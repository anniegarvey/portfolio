import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Butterfly, Cloud, Daisy, Lavender, ld, scatter, Tulip, vars } from ".";

describe("Scenery helpers", () => {
  it("ld pairs a light and a dark colour", () => {
    expect(ld("#fff", "#000")).toBe("light-dark(#fff, #000)");
  });

  it("vars passes custom properties through as a style", () => {
    expect(vars({ "--sway-range": "4px" })).toEqual({ "--sway-range": "4px" });
  });
});

describe("Scenery art", () => {
  it("places a butterfly and feeds its wander loop from the path", () => {
    const { container } = render(
      <svg aria-hidden="true">
        <Butterfly
          path={[1, 2, 3, 4, 5, 6]}
          period={10}
          spot="red"
          wing="blue"
          x={12}
          y={34}
        />
      </svg>,
    );
    const placed = container.querySelector("svg > g");
    expect(placed).toHaveAttribute("transform", "translate(12 34) scale(1)");
    const wander = placed?.firstElementChild as SVGGElement;
    expect(wander.style.getPropertyValue("--w3y")).toBe("6px");
    expect(wander.style.getPropertyValue("--wander-period")).toBe("10s");
  });

  it("grows each flower from its foot to the height asked", () => {
    const { container } = render(
      <svg aria-hidden="true">
        <Tulip color="red" h={10} x={2} />
        <Daisy color="white" h={12} x={4} />
        <Lavender color="purple" h={14} x={6} />
      </svg>,
    );
    const stems = container.querySelectorAll("line");
    expect([...stems].map((s) => s.getAttribute("y2"))).toEqual([
      "-10",
      "-12",
      "-13",
    ]);
  });

  it("draws a cloud where it is put", () => {
    const { container } = render(
      <svg aria-hidden="true">
        <Cloud scale={2} shade="grey" tint="white" x={5} y={6} />
      </svg>,
    );
    expect(container.querySelector("svg > g")).toHaveAttribute(
      "transform",
      "translate(5 6) scale(2)",
    );
  });
});

describe("scatter", () => {
  const box = { x0: 0, x1: 400, y0: 100, y1: 200 };

  it("drops every point inside the box, with dice in [0, 1)", () => {
    const points = scatter(40, box, 3);
    expect(points).toHaveLength(40);
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(400);
      expect(p.y).toBeGreaterThanOrEqual(100);
      expect(p.y).toBeLessThan(200);
      for (const die of [p.u, p.v]) {
        expect(die).toBeGreaterThanOrEqual(0);
        expect(die).toBeLessThan(1);
      }
    }
  });

  it("gives the same points for the same seed, and different ones otherwise", () => {
    expect(scatter(10, box, 5)).toEqual(scatter(10, box, 5));
    expect(scatter(10, box, 5)).not.toEqual(scatter(10, box, 6));
  });

  it("spreads points over the whole box rather than clumping", () => {
    const points = scatter(32, box, 9);
    // Every quarter of the box gets its share, give or take.
    for (const [qx, qy] of [
      [0, 100],
      [200, 100],
      [0, 150],
      [200, 150],
    ]) {
      const inQuarter = points.filter(
        (p) => p.x >= qx && p.x < qx + 200 && p.y >= qy && p.y < qy + 50,
      );
      expect(inQuarter.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("does not line points up along a diagonal", () => {
    const points = scatter(30, box, 1);
    // Stepping by fixed amounts puts neighbours at a constant offset from
    // each other; strewn points vary.
    const steps = new Set(
      points.slice(1).map((p, i) => Math.round(p.x - points[i].x)),
    );
    expect(steps.size).toBeGreaterThan(20);
  });
});
