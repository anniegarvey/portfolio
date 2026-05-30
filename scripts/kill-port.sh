#!/usr/bin/env bash
# Kill the dev server bound to this worktree's port (and its forked Next.js
# workers), without touching dev servers running in sibling worktrees.
#
# Resolves the PID *from the listening port*, then signals its whole process
# group so the forked render worker dies too. This is the safe alternative to
# `pkill -f next`, which kills every worktree's dev server at once.
#
# Usage: scripts/kill-port.sh [port]   # defaults to ./.port, then 3000
set -uo pipefail

PORT="${1:-$(cat .port 2>/dev/null || echo 3000)}"

# Resolve listener PIDs via `ss`, not `lsof`: under WSL2 lsof cannot reliably
# map the socket back to a PID for IPv6/dual-stack `*:port` binds (which is how
# `next dev` listens), and silently returns nothing.
pids_on_port() {
  ss -ltnpH "sport = :$PORT" 2>/dev/null | grep -oP 'pid=\K[0-9]+' | sort -u
}

PIDS=$(pids_on_port)
if [ -z "$PIDS" ]; then
  echo "kill-port: nothing listening on port $PORT"
  exit 0
fi

SELF_PGID=$(ps -o pgid= -p $$ | tr -d ' ')

signal() { # signal <SIG> <pid>
  local pgid
  pgid=$(ps -o pgid= -p "$2" 2>/dev/null | tr -d ' ')
  [ -z "$pgid" ] && return
  if [ "$pgid" = "$SELF_PGID" ]; then
    echo "kill-port: refusing to signal own process group ($pgid)"
    return
  fi
  echo "kill-port: SIG$1 port $PORT -> pid $2 (group $pgid)"
  kill -"$1" "-$pgid" 2>/dev/null
}

for pid in $PIDS; do signal TERM "$pid"; done

# Grace period (~3s) for a clean shutdown, then SIGKILL whatever still holds it.
for _ in $(seq 1 10); do
  [ -z "$(pids_on_port)" ] && break
  sleep 0.3
done
for pid in $(pids_on_port); do signal KILL "$pid"; done

if [ -n "$(pids_on_port)" ]; then
  echo "kill-port: WARNING port $PORT still in use" >&2
  exit 1
fi
echo "kill-port: port $PORT clear"
