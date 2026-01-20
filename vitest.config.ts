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
        lines: 87.5,
        statements: 86.2,
        branches: 70,
        functions: 77.77,
        perFile: true,
      },
    },
    testTimeout: 500,
  },
});
