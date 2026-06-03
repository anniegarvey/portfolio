import { defineConfig } from "@playwright/test";
import { baseConfig, getPort } from "./playwright.base.config";

const port = getPort();

export default defineConfig({
  ...baseConfig(port),
  testDir: "./temp",
});
