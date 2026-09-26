import { describe, expect, it } from "vitest";
import { measureTreeFrame, placeBackdrop, type TreeFrame } from "./backdrop";

// A 900×450 garden with a tree whose art origin is at (400, 100) and drawn at
// 0.45px per unit: a 200-unit-wide tree in the garden's 90px box.
const garden: TreeFrame = {
  originX: 400,
  originY: 100,
  scale: 0.45,
  width: 900,
  height: 450,
};

describe("placeBackdrop", () => {
  it("enlarges the scene by as much as the tree is enlarged", () => {
    const box = placeBackdrop(garden, {
      originX: 20,
      originY: 10,
      scale: 2.25,
      width: 450,
      height: 400,
    });
    expect(box.width).toBeCloseTo(4500);
    expect(box.height).toBeCloseTo(2250);
  });

  it("puts the garden point under the tree at the same spot on the tree", () => {
    const tend: TreeFrame = {
      originX: 20,
      originY: 10,
      scale: 2.25,
      width: 450,
      height: 400,
    };
    const box = placeBackdrop(garden, tend);
    const k = tend.scale / garden.scale;
    // Any tree-art point, e.g. (100, 280): where it lands in each view.
    const inGarden = {
      x: garden.originX + 100 * garden.scale,
      y: garden.originY + 280 * garden.scale,
    };
    const inTend = {
      x: tend.originX + 100 * tend.scale,
      y: tend.originY + 280 * tend.scale,
    };
    expect(box.left + inGarden.x * k).toBeCloseTo(inTend.x);
    expect(box.top + inGarden.y * k).toBeCloseTo(inTend.y);
  });

  it("keeps the scene covering the view when the tree stands at an edge", () => {
    const tend = {
      originX: 20,
      originY: 10,
      scale: 2.25,
      width: 450,
      height: 400,
    };
    const atTopLeft = placeBackdrop(
      { ...garden, originX: -40, originY: -60 },
      tend,
    );
    expect(atTopLeft.left).toBe(0);
    expect(atTopLeft.top).toBe(0);

    const atBottomRight = placeBackdrop(
      { ...garden, originX: 890, originY: 440 },
      tend,
    );
    expect(atBottomRight.left).toBeCloseTo(tend.width - atBottomRight.width);
    expect(atBottomRight.top).toBeCloseTo(tend.height - atBottomRight.height);
  });
});

describe("measureTreeFrame", () => {
  function rect(left: number, top: number, width: number, height: number) {
    return { left, top, width, height } as DOMRect;
  }

  function setUp(zoom: number) {
    const box = document.createElement("div");
    const art = document.createElement("div");
    art.innerHTML = '<svg viewBox="-20 40 200 300"></svg>';
    box.append(art);
    // A 400×300 box with a 2px border, scaled about its top-left by `zoom`.
    Object.defineProperties(box, {
      offsetWidth: { value: 404 },
      clientWidth: { value: 400 },
      clientHeight: { value: 300 },
      clientLeft: { value: 2 },
      clientTop: { value: 2 },
    });
    box.getBoundingClientRect = () => rect(100, 50, 404 * zoom, 304 * zoom);
    // Art 100px wide, 30px in and 20px down from the box's outer edge.
    art.getBoundingClientRect = () =>
      rect(100 + 30 * zoom, 50 + 20 * zoom, 100 * zoom, 150 * zoom);
    return { box, art };
  }

  it("finds the art's origin and scale in the box's padding box", () => {
    const { box, art } = setUp(1);
    expect(measureTreeFrame(box, art)).toEqual({
      originX: 30 - 2 + 20 * 0.5,
      originY: 20 - 2 - 40 * 0.5,
      scale: 0.5,
      width: 400,
      height: 300,
    });
  });

  it("measures in layout pixels whatever the zoom", () => {
    const plain = setUp(1);
    const zoomed = setUp(1.5);
    const a = measureTreeFrame(plain.box, plain.art);
    const b = measureTreeFrame(zoomed.box, zoomed.art);
    expect(b?.scale).toBeCloseTo(a?.scale ?? 0);
    expect(b?.originX).toBeCloseTo(a?.originX ?? 0);
    expect(b?.originY).toBeCloseTo(a?.originY ?? 0);
  });

  it("gives up when the art has no tree drawn yet", () => {
    const { box, art } = setUp(1);
    art.innerHTML = "";
    expect(measureTreeFrame(box, art)).toBeNull();
  });
});
