import { defineConfig } from "@playwright/test";
import {
  baseConfig,
  getPort,
  usePreinstalledChromium,
} from "./playwright.base.config";

const port = getPort();

export default defineConfig({
  ...baseConfig(port),
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Cloud containers have fewer cores, and the pre-commit hook runs vitest
  // alongside; five workers there starve the timing-sensitive tests.
  workers: process.env.CI ? 1 : usePreinstalledChromium ? 2 : 5,
});
