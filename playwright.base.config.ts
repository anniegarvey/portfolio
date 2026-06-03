import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { devices } from "@playwright/test";

export function getPort(): string {
  if (process.env.CI) return "3000";
  if (existsSync(".port")) return readFileSync(".port", "utf8").trim();
  return execFileSync("node", ["scripts/pick-port.js"]).toString().trim();
}

export function baseConfig(port: string) {
  return {
    fullyParallel: true,
    reporter: [["html", { open: "never" }]] as [["html", { open: string }]],
    use: {
      baseURL: `http://localhost:${port}`,
      trace: "on-first-retry" as const,
      screenshot: "only-on-failure" as const,
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
  };
}
