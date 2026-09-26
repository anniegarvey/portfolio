import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Butterfly, Cloud, Daisy, Lavender, ld, Tulip, vars } from ".";

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
