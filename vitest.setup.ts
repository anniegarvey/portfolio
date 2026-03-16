import "fake-indexeddb/auto";
import "@testing-library/jest-dom";
import "jest-axe/extend-expect";
import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(
    (message: unknown, ...args: unknown[]) => {
      throw new Error(
        `Unexpected console.error: ${message} ${args.map(String).join(" ")}`.trim(),
      );
    },
  );
  vi.spyOn(console, "warn").mockImplementation(
    (message: unknown, ...args: unknown[]) => {
      throw new Error(
        `Unexpected console.warn: ${message} ${args.map(String).join(" ")}`.trim(),
      );
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});
