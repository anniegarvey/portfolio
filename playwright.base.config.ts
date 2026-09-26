import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { chromium, devices } from "@playwright/test";

export function getPort(): string {
  if (process.env.CI) return "3000";
  if (existsSync(".port")) return readFileSync(".port", "utf8").trim();
  return execFileSync("node", ["scripts/pick-port.js"]).toString().trim();
}

// Claude's cloud containers preinstall a Chromium that may not match the
// pinned Playwright version (and block browser downloads). Fall back to it
// only when Playwright's own browser is missing, so local runs are unchanged.
const PREINSTALLED_CHROMIUM = "/opt/pw-browsers/chromium";

export const usePreinstalledChromium =
  !existsSync(chromium.executablePath()) && existsSync(PREINSTALLED_CHROMIUM);

export function baseConfig(port: string) {
  return {
    // Screenshots and text-width checks are tuned to the pinned browser's
    // rendering, which the preinstalled one doesn't reproduce.
    ...(usePreinstalledChromium && {
      ignoreSnapshots: true,
      grepInvert: /@pinned-browser/,
    }),
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
        use: {
          ...devices["Desktop Chrome"],
          launchOptions: usePreinstalledChromium
            ? { executablePath: PREINSTALLED_CHROMIUM }
            : {},
        },
      },
    ],
    webServer: {
      command: `PORT=${port} pnpm exec next dev`,
      url: `http://localhost:${port}`,
      reuseExistingServer: !process.env.CI,
    },
  };
}
