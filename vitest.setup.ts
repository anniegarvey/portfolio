import "fake-indexeddb/auto";
import "@testing-library/jest-dom";
import "jest-axe/extend-expect";
import { afterEach, beforeEach, vi } from "vitest";

// jsdom doesn't implement the Web Animations API — stub it globally so tests
// that spy on Element.prototype.animate don't fail on "property not defined".
if (!Element.prototype.animate) {
  Element.prototype.animate = () => ({}) as Animation;
}

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
