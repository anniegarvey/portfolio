import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WaterSprinkles, type WaterSprinklesHandle } from "./WaterSprinkles";

const SPAWN_INTERVAL_MS = 90;

function renderSprinkles() {
  const apiRef: { current: WaterSprinklesHandle | null } = { current: null };
  const { container, unmount } = render(
    <WaterSprinkles
      ref={(handle) => {
        apiRef.current = handle;
      }}
    />,
  );
  return { apiRef, container, unmount };
}

function droplets(container: HTMLElement) {
  return container.querySelectorAll('[data-testid="water-droplet"]');
}

describe("WaterSprinkles", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders nothing before the pointer is pressed", () => {
    const { container } = renderSprinkles();
    expect(droplets(container)).toHaveLength(0);
  });

  it("spawns a droplet immediately on start", () => {
    const { apiRef, container } = renderSprinkles();
    act(() => {
      apiRef.current?.start(10, 20);
    });
    expect(droplets(container)).toHaveLength(1);
  });

  it("keeps spawning droplets at an interval while held", async () => {
    vi.useFakeTimers();
    const { apiRef, container } = renderSprinkles();
    act(() => {
      apiRef.current?.start(10, 20);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPAWN_INTERVAL_MS * 3);
    });
    // 1 immediate spawn on start + 3 interval ticks
    expect(droplets(container)).toHaveLength(4);
  });

  it("stops spawning once stop() is called", async () => {
    vi.useFakeTimers();
    const { apiRef, container } = renderSprinkles();
    act(() => {
      apiRef.current?.start(10, 20);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPAWN_INTERVAL_MS);
    });
    const countAtStop = droplets(container).length;

    act(() => {
      apiRef.current?.stop();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPAWN_INTERVAL_MS * 5);
    });

    expect(droplets(container)).toHaveLength(countAtStop);
  });

  it("caps the number of concurrent droplets", async () => {
    vi.useFakeTimers();
    const { apiRef, container } = renderSprinkles();
    act(() => {
      apiRef.current?.start(10, 20);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPAWN_INTERVAL_MS * 50);
    });
    expect(droplets(container).length).toBeLessThanOrEqual(20);
  });

  it("removes a droplet once its fall animation ends", () => {
    const { apiRef, container } = renderSprinkles();
    act(() => {
      apiRef.current?.start(10, 20);
    });
    const [droplet] = droplets(container);

    act(() => {
      fireEvent.animationEnd(droplet as Element);
    });

    expect(droplets(container)).toHaveLength(0);
  });

  it("spawns subsequent droplets at the moved cursor position", async () => {
    vi.useFakeTimers();
    const { apiRef, container } = renderSprinkles();
    act(() => {
      apiRef.current?.start(10, 20);
      apiRef.current?.move(50, 60);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPAWN_INTERVAL_MS);
    });

    const all = droplets(container);
    const latest = all[all.length - 1] as HTMLElement;
    expect(latest.style.getPropertyValue("--drop-x")).toBe("50px");
    expect(latest.style.getPropertyValue("--drop-y")).toBe("60px");
  });

  it("does not spawn droplets when the user prefers reduced motion", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    vi.useFakeTimers();
    const { apiRef, container } = renderSprinkles();

    act(() => {
      apiRef.current?.start(10, 20);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPAWN_INTERVAL_MS * 3);
    });

    expect(droplets(container)).toHaveLength(0);
  });

  it("clears the spawn interval on unmount", async () => {
    vi.useFakeTimers();
    const { apiRef, unmount } = renderSprinkles();
    act(() => {
      apiRef.current?.start(10, 20);
    });

    unmount();

    // If the interval survived unmount, this would call setState on an
    // unmounted component and vitest.setup.ts turns that console.error
    // into a thrown failure.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SPAWN_INTERVAL_MS * 5);
    });
  });
});
