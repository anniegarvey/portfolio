#!/usr/bin/env bash
# Runs the visual snapshot tests (e2e/visual) inside the official Playwright
# image for the pinned @playwright/test version, so every machine renders the
# same pixels: Annie's, Claude's cloud sessions and CI. Outside this image the
# visual specs are skipped (see playwright.base.config.ts).
#
#   pnpm snapshots                       # compare against the committed PNGs
#   pnpm snapshots --update-snapshots    # regenerate them
#
# Extra arguments go to `playwright test`. Needs Docker and installed
# node_modules (Linux x64, which the image mounts as-is).
set -euo pipefail

version=$(node -p "require('@playwright/test/package.json').version")
image="mcr.microsoft.com/playwright:v${version}-noble"

# Claude's cloud containers ship Docker but don't start the daemon.
if ! docker info >/dev/null 2>&1 && command -v dockerd >/dev/null; then
  (dockerd >/tmp/dockerd.log 2>&1 &)
  for _ in $(seq 30); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi

# next/font downloads Google Fonts at dev time, so pass through any proxy
# (and its CA) the host needs to reach the internet.
proxy_args=()
for var in HTTPS_PROXY https_proxy HTTP_PROXY http_proxy NO_PROXY no_proxy; do
  [[ -n "${!var:-}" ]] && proxy_args+=(-e "$var")
done
if [[ -n "${NODE_EXTRA_CA_CERTS:-}" ]]; then
  proxy_args+=(-e NODE_EXTRA_CA_CERTS -v "$NODE_EXTRA_CA_CERTS:$NODE_EXTRA_CA_CERTS:ro")
fi

# The image has no pnpm, and the web server command is `pnpm exec next dev`,
# so a tiny shim runs local binaries instead (no download needed).
docker run --rm --network host --ipc=host \
  -e CI=1 -e PLAYWRIGHT_PINNED_IMAGE=1 "${proxy_args[@]}" \
  -v "$PWD":/work -w /work "$image" \
  bash -c 'printf "#!/bin/sh\n[ \"\$1\" = exec ] && shift\nexec \"\$@\"\n" > /usr/local/bin/pnpm &&
    chmod +x /usr/local/bin/pnpm &&
    export PATH="/work/node_modules/.bin:$PATH" &&
    exec playwright test e2e/visual "$@"' _ "$@"
