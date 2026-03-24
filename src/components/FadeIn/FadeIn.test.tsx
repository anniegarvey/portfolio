import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FadeIn } from "./FadeIn";

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let observerCallback: ObserverCallback | null = null;
let mockObserve: ReturnType<typeof vi.fn>;
let mockDisconnect: ReturnType<typeof vi.fn>;

function setupIntersectionObserverMock() {
  mockObserve = vi.fn();
  mockDisconnect = vi.fn();

  const _mockObserve = mockObserve;
  const _mockDisconnect = mockDisconnect;

  function MockIntersectionObserver(this: unknown, callback: ObserverCallback) {
    observerCallback = callback;
  }
  MockIntersectionObserver.prototype.observe = _mockObserve;
  MockIntersectionObserver.prototype.disconnect = _mockDisconnect;
  MockIntersectionObserver.prototype.unobserve = vi.fn();

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
}

function triggerIntersection(isIntersecting: boolean) {
  act(() => {
    observerCallback?.([{ isIntersecting } as IntersectionObserverEntry]);
  });
}

describe("FadeIn", () => {
  beforeEach(() => {
    observerCallback = null;
    setupIntersectionObserverMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders children", () => {
    render(
      <FadeIn>
        <p>Hello</p>
      </FadeIn>,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("starts invisible with the fade-in-element class", () => {
    const { container } = render(
      <FadeIn>
        <p>content</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("fade-in-element");
    expect(wrapper).toHaveAttribute("data-visible", "false");
  });

  it("becomes visible when the observer fires with isIntersecting true", () => {
    const { container } = render(
      <FadeIn>
        <p>content</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;

    triggerIntersection(true);

    expect(wrapper).toHaveAttribute("data-visible", "true");
  });

  it("stays invisible when the observer fires with isIntersecting false", () => {
    const { container } = render(
      <FadeIn>
        <p>content</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;

    triggerIntersection(false);

    expect(wrapper).toHaveAttribute("data-visible", "false");
  });

  it("applies the delay as a CSS custom property", () => {
    const { container } = render(
      <FadeIn delay={300}>
        <p>content</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--fade-delay")).toBe("300ms");
  });

  it("uses 0ms delay by default", () => {
    const { container } = render(
      <FadeIn>
        <p>content</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--fade-delay")).toBe("0ms");
  });

  it("merges extra className with fade-in-element", () => {
    const { container } = render(
      <FadeIn className="my-class">
        <p>content</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass("fade-in-element", "my-class");
  });

  it("merges extra style props", () => {
    const { container } = render(
      <FadeIn style={{ height: "100%" }}>
        <p>content</p>
      </FadeIn>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe("100%");
  });

  it("disconnects the observer once the element becomes visible", () => {
    render(
      <FadeIn>
        <p>content</p>
      </FadeIn>,
    );
    triggerIntersection(true);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("starts observing the wrapper element", () => {
    const { container } = render(
      <FadeIn>
        <p>content</p>
      </FadeIn>,
    );
    expect(mockObserve).toHaveBeenCalledWith(container.firstChild);
  });
});
