# Playwright MCP (interactive browser control from chat)

[Playwright MCP](https://playwright.dev/docs/getting-started-mcp) drives a real browser directly via tool calls — no spec file to write. It reads the page as an accessibility tree, not screenshots, so it can click/fill/navigate by role and name.

Not configured yet? See `./mcp-setup.md`.

Unlike `pnpm playwright test`, MCP does **not** auto-start the dev server. Start it yourself first (`pnpm dev`) and read the port from `.port` — MCP also has no `baseURL`, so navigate to the full URL, e.g. `http://localhost:$(cat .port)/bonsai`.
