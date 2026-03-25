import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Each worktree session gets its own port via .port file so multiple agents
// can run simultaneously without conflicting. Falls back to 3000 in CI.
function getPort(): string {
  if (process.env.CI) return "3000";
  if (existsSync(".port")) return readFileSync(".port", "utf8").trim();
  return execFileSync("node", ["scripts/pick-port.js"]).toString().trim();
}

const port = getPort();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `PORT=${port} pnpm exec next dev`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
