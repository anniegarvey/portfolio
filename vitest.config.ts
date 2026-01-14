import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    alias: {
      "@": resolve(__dirname, "./src"),
    },
    coverage: {
      enabled: true,
      thresholds: {
        lines: 100,
        statements: 100,
        branches: 85.71,
        functions: 100,
        perFile: true,
        autoUpdate: true,
      },
    },
    testTimeout: 500,
  },
});
