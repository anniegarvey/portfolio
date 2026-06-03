---
name: playwright-skill
description: Complete browser automation with Playwright. Auto-detects dev server via .port file. Test pages, fill forms, take screenshots, check responsive design, validate UX, automate any browser task. Use when user wants to test websites, automate browser interactions, validate web functionality, or perform any browser-based testing.
---

# Playwright Browser Automation

This project has Playwright installed and configured. `playwright.config.ts` handles everything:
- Reads the dev server port from `.port`
- Auto-starts the dev server if not already running (`reuseExistingServer: true` in dev)
- Uses Chromium, `baseURL` set to `http://localhost:<port>`

## Running existing e2e tests

```bash
pnpm playwright test                          # all tests
pnpm playwright test e2e/bonsai/              # specific directory
pnpm playwright test e2e/energy-planner/flow.spec.ts  # specific file
```

## Ad-hoc automation (screenshots, interactions, etc.)

Write a Playwright Test spec to `./temp/playwright-NAME.spec.ts` (gitignored). Use `temp.playwright.config.ts`, which points `testDir` at `./temp` — so normal `pnpm playwright test` runs are unaffected.

```bash
pnpm playwright test --config temp.playwright.config.ts temp/playwright-NAME.spec.ts
```

Example spec:

```typescript
import { test } from '@playwright/test';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

test('responsive screenshots', async ({ page }) => {
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/bonsai');
    await page.screenshot({ path: `temp/${vp.name}.png`, fullPage: true });
  }
});
```

After the run, read the screenshots from `temp/` to assess the result.

## Tips

- Use `baseURL`-relative paths (`/`, `/bonsai`, `/energy-planner`) — the config sets the host/port automatically
- Prefer `page.getByRole`, `page.getByText`, `page.getByTestId` over CSS selectors
- Use `waitForURL`, `waitForSelector`, `waitForLoadState` instead of fixed timeouts
