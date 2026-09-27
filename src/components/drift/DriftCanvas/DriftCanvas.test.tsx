import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type DriftSettings } from "@/lib/drift/settings";
import { DriftCanvas, type DriftCanvasHandle } from "./DriftCanvas";

/**
 * jsdom has no canvas, no layout and no animation frames, so all three are
 * stood up by hand: a 2D context that records what it's asked to draw, a
 * 400×300 box (a phone-sized, 96×72 grid, which keeps these quick), and a frame queue the tests advance themselves.
 */
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let clock: number;
let painted: ImageData[];
let rect: { width: number; height: number };

function flushFrames(count = 1, ms = 16) {
  for (let n = 0; n < count; n++) {
    const pending = [...frames.values()];
    frames.clear();
    clock += ms;
    act(() => {
      for (const callback of pending) callback(clock);
    });
  }
}

function opaquePixels(image: ImageData) {
  let count = 0;
  for (let k = 3; k < image.data.length; k += 4) {
    if (image.data[k] > 10) count++;
  }
  return count;
}

const lastPaint = () => painted[painted.length - 1];
const canvas = () => screen.getByRole("img", { name: /water to stir/i });

function renderCanvas(settings: Partial<DriftSettings> = {}, calm = false) {
  const ref = createRef<DriftCanvasHandle>();
  const view = render(
    <DriftCanvas
      calm={calm}
      ref={ref}
      settings={{ ...DEFAULT_SETTINGS, ...settings }}
    />,
  );
  return { ref, ...view };
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 1;
  clock = 0;
  painted = [];
  rect = { width: 400, height: 300 };
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  vi.spyOn(
    HTMLCanvasElement.prototype,
    "getBoundingClientRect",
  ).mockImplementation(() => ({ left: 0, top: 0, ...rect }) as DOMRect);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (() => ({
      createImageData: (width: number, height: number) =>
        ({
          width,
          height,
          data: new Uint8ClampedArray(width * height * 4),
        }) as ImageData,
      putImageData: (image: ImageData) => {
        painted.push({ ...image, data: Uint8ClampedArray.from(image.data) });
      },
    })) as unknown as HTMLCanvasElement["getContext"],
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DriftCanvas", () => {
  it("sizes its grid to the canvas and opens with a few blooms of colour", () => {
    rect = { width: 800, height: 600 };
    renderCanvas();
    expect(canvas()).toHaveAttribute("width", "144");
    expect(canvas()).toHaveAttribute("height", "108");
    flushFrames();
    expect(opaquePixels(lastPaint())).toBeGreaterThan(50);
  });

  it("uses a coarser grid on a phone-sized canvas", () => {
    renderCanvas();
    expect(canvas()).toHaveAttribute("width", "96");
    expect(canvas()).toHaveAttribute("height", "72");
  });

  it("waits for layout before starting the water", () => {
    rect = { width: 0, height: 0 };
    renderCanvas();
    flushFrames(2);
    expect(painted).toHaveLength(0);

    rect = { width: 400, height: 300 };
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    flushFrames();
    expect(painted.length).toBeGreaterThan(0);
  });

  it("keeps the water when a resize doesn't change the grid", () => {
    const { ref } = renderCanvas();
    act(() => ref.current?.clear());
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    flushFrames();
    expect(opaquePixels(lastPaint())).toBe(0);
  });

  it("clears the water and blooms new colour on request", () => {
    const { ref } = renderCanvas();
    act(() => ref.current?.clear());
    flushFrames();
    expect(opaquePixels(lastPaint())).toBe(0);

    act(() => ref.current?.bloom());
    flushFrames();
    expect(opaquePixels(lastPaint())).toBeGreaterThan(20);
  });

  it("stirs dye in where a mouse passes over", () => {
    const { ref } = renderCanvas({ drift: false });
    act(() => ref.current?.clear());
    fireEvent.pointerMove(canvas(), {
      clientX: 50,
      clientY: 150,
      pointerType: "mouse",
    });
    clock += 16;
    fireEvent.pointerMove(canvas(), {
      clientX: 350,
      clientY: 150,
      pointerType: "mouse",
    });
    flushFrames();
    expect(opaquePixels(lastPaint())).toBeGreaterThan(20);
  });

  it("only stirs for a finger once it touches down", () => {
    const { ref } = renderCanvas({ drift: false });
    act(() => ref.current?.clear());
    // Pen or touch hovering, with no buttons pressed, does nothing.
    fireEvent.pointerMove(canvas(), {
      clientX: 50,
      clientY: 150,
      pointerType: "touch",
    });
    fireEvent.pointerMove(canvas(), {
      clientX: 350,
      clientY: 150,
      pointerType: "touch",
    });
    flushFrames();
    expect(opaquePixels(lastPaint())).toBe(0);

    fireEvent.pointerDown(canvas(), {
      clientX: 50,
      clientY: 50,
      pointerType: "touch",
    });
    clock += 16;
    fireEvent.pointerMove(canvas(), {
      buttons: 1,
      clientX: 350,
      clientY: 50,
      pointerType: "touch",
    });
    flushFrames();
    expect(opaquePixels(lastPaint())).toBeGreaterThan(20);
  });

  it("starts a fresh stroke after the pointer lifts", () => {
    const { ref } = renderCanvas({ drift: false });
    fireEvent.pointerMove(canvas(), {
      clientX: 50,
      clientY: 150,
      pointerType: "mouse",
    });
    fireEvent.pointerUp(canvas());
    act(() => ref.current?.clear());
    // With no previous point there's no stroke to draw yet.
    fireEvent.pointerMove(canvas(), {
      clientX: 350,
      clientY: 150,
      pointerType: "mouse",
    });
    flushFrames();
    expect(opaquePixels(lastPaint())).toBe(0);
  });

  it("paints a rainbow stroke at full brightness", () => {
    const { ref } = renderCanvas({ drift: true, palette: "rainbow" });
    act(() => ref.current?.clear());
    act(() => ref.current?.bloom());
    fireEvent.pointerMove(canvas(), {
      clientX: 50,
      clientY: 150,
      pointerType: "mouse",
    });
    clock += 16;
    fireEvent.pointerMove(canvas(), {
      clientX: 350,
      clientY: 150,
      pointerType: "mouse",
    });
    flushFrames();
    const { data } = lastPaint();
    let brightest = 0;
    for (let k = 0; k < data.length; k += 4) {
      if (data[k + 3] > 10) {
        brightest = Math.max(
          brightest,
          Math.min(Math.max(data[k], data[k + 1], data[k + 2]), 255),
        );
      }
    }
    expect(brightest).toBe(255);
  });

  it("keeps the water moving with gentle currents", () => {
    const { ref } = renderCanvas({ drift: true });
    act(() => ref.current?.clear());
    flushFrames(3);
    expect(opaquePixels(lastPaint())).toBeGreaterThan(0);
  });

  it("stops the currents in calm mode", () => {
    const { ref } = renderCanvas({ drift: true }, true);
    act(() => ref.current?.clear());
    flushFrames(3);
    expect(opaquePixels(lastPaint())).toBe(0);
  });

  it("pauses while the tab is hidden and resumes when it's back", () => {
    renderCanvas();
    flushFrames();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(frames.size).toBe(0);

    hidden.mockReturnValue(false);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(frames.size).toBe(1);
  });

  it("stops its frame loop when unmounted", () => {
    const { unmount } = renderCanvas();
    unmount();
    expect(frames.size).toBe(0);
  });

  it("does nothing without a 2D context", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const { ref } = renderCanvas();
    act(() => {
      ref.current?.bloom();
      ref.current?.clear();
    });
    fireEvent.pointerMove(canvas(), {
      clientX: 50,
      clientY: 150,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(canvas(), {
      clientX: 80,
      clientY: 150,
      pointerType: "mouse",
    });
    expect(frames.size).toBe(0);
  });

  it("tints the water behind the dye with the palette", () => {
    renderCanvas({ palette: "dusk" });
    expect(canvas().style.getPropertyValue("--water-dark")).toBe("#140a18");
    expect(canvas().style.getPropertyValue("--water-light")).toBe("#fbf0f4");
  });
});
