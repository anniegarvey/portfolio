#!/usr/bin/env bash
# Make sure this checkout has a code-review-graph knowledge graph that matches
# the branch it is sitting on, rebuilding when it doesn't. Run from the
# SessionStart hook in .claude/settings.json.
#
# Rebuilds rather than copies an existing graph on purpose: every path stored in
# graph.db is absolute, so a graph copied from the main repo would describe the
# main repo's files at the main repo's paths. A full build is ~8s, which is
# cheaper than reasoning about a graph that is quietly wrong.
#
# Two conditions trigger a rebuild:
#   1. No graph has ever been built here. Note this is NOT the same as "no
#      graph.db file" — see the "Last updated: never" comment below.
#   2. The graph was built on a different branch, at a different commit, than
#      the one checked out now.
#
# Usage: scripts/crg-graph-check.sh
set -uo pipefail

command -v code-review-graph >/dev/null 2>&1 || exit 0

root=$(git rev-parse --show-toplevel 2>/dev/null) || true
if [ -z "${root:-}" ]; then
  echo 'Not a git repo, skipping'
  exit 0
fi

status=$(code-review-graph status --repo "$root" 2>/dev/null)
built=$(printf '%s\n' "$status" | sed -n 's/^Built on branch: //p')
built_at=$(printf '%s\n' "$status" | sed -n 's/^Built at commit: //p')
current=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
current_at=$(git rev-parse --short=12 HEAD 2>/dev/null)

# Both `status` and `embed` create an empty graph.db when none exists, so the
# file being present proves nothing. "Last updated: never" is the only reliable
# signal that no build has run here.
reason=''
case "$status" in
*'Last updated: never'*) reason='no graph for this checkout (new worktree?)' ;;
esac

# Branch name alone is too eager: `git checkout -b feature` renames the branch
# without moving HEAD, and that graph is still perfectly good. Require the
# commit to have moved too, so only a real content switch forces a rebuild.
if [ -z "$reason" ] && [ -n "$built" ] && [ -n "$current" ] && [ "$built" != "$current" ] &&
  [ -n "$built_at" ] && [ -n "$current_at" ] && [ "$built_at" != "$current_at" ]; then
  reason="graph was built on '$built' at $built_at, now on '$current' at $current_at"
fi

if [ -n "$reason" ]; then
  echo "code-review-graph: $reason - rebuilding (~10s)"
  if ! code-review-graph build --repo "$root" -q >/dev/null 2>&1; then
    echo 'Graph build FAILED - run: code-review-graph build'
  fi
  status=$(code-review-graph status --repo "$root" 2>/dev/null)
fi

printf '%s\n' "$status"
