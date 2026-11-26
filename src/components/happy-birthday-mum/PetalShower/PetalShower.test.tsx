import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PetalShower } from "./PetalShower";

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: reduce }));
}

describe("PetalShower", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("stays empty until triggered", () => {
    stubReducedMotion(false);
    const { container } = render(<PetalShower triggerCount={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("showers petals and notes, then clears them away", () => {
    stubReducedMotion(false);
    const { container } = render(<PetalShower triggerCount={1} />);

    expect(container).not.toBeEmptyDOMElement();
    expect(container.textContent).toMatch(/[♪♫♩♬]/);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("skips the shower with reduced motion", () => {
    stubReducedMotion(true);
    const { container } = render(<PetalShower triggerCount={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});
