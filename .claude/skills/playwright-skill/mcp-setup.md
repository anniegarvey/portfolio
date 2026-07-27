# Playwright MCP setup (one-time)

Skip this if `.mcp.json` already has a `playwright` entry.

```bash
claude mcp add --scope project playwright -- npx @playwright/mcp@0.0.78 --headless --isolated --executable-path '${HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'
```

The `--executable-path` points at the Chromium already bundled with this project's Playwright install (same browser the e2e suite uses) — MCP's default browser expects a system Chrome install, which isn't present here and needs sudo to add. The `chromium-1208` revision is tied to the pinned `@playwright/test` version in `package.json`; if that version bumps and MCP starts failing to launch, check `~/.cache/ms-playwright/` for the new revision folder and update the path. `${HOME}` is expanded by Claude Code at server-spawn time, so the committed path stays portable across machines.

Drop `--headless` for a visible window (needs the WSL browser fix in `CLAUDE.md`'s Commands section). `--isolated` matches this project's e2e default of a fresh context per run, with no persisted login state.

This writes to the committed, project-scoped `.mcp.json` — that file may need `git add` separately once you're happy with it (agents are blocked from writing it directly).

After adding or changing this entry, restart Claude Code — the MCP server is spawned once at session start and won't pick up config changes until then.
