import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GardenBackground } from "./GardenBackground";

describe("GardenBackground — scene rendering", () => {
  it("renders garden scene", () => {
    const { container } = render(<GardenBackground backgroundId="garden" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders zen-garden scene", () => {
    const { container } = render(
      <GardenBackground backgroundId="zen-garden" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders misty-mountain scene", () => {
    const { container } = render(
      <GardenBackground backgroundId="misty-mountain" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders night-garden scene", () => {
    const { container } = render(
      <GardenBackground backgroundId="night-garden" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders autumn-forest scene", () => {
    const { container } = render(
      <GardenBackground backgroundId="autumn-forest" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("GardenBackground — viewBox", () => {
  it("uses full viewBox when no tendPos given", () => {
    const { container } = render(<GardenBackground backgroundId="garden" />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 400 200",
    );
  });

  it("uses computed viewBox when tendPos is given", () => {
    const { container } = render(
      <GardenBackground backgroundId="garden" tendPos={{ x: 50, y: 50 }} />,
    );
    const svg = container.querySelector("svg");
    // viewBox should differ from the default full viewBox
    expect(svg?.getAttribute("viewBox")).not.toBe("0 0 400 200");
  });

  it("clamps viewBox x to 0 when tendPos x is 0", () => {
    const { container } = render(
      <GardenBackground backgroundId="garden" tendPos={{ x: 0, y: 50 }} />,
    );
    const viewBox =
      container.querySelector("svg")?.getAttribute("viewBox") ?? "";
    const x = Number(viewBox.split(" ")[0]);
    expect(x).toBe(0);
  });

  it("clamps viewBox x to max when tendPos x is 100", () => {
    const { container } = render(
      <GardenBackground backgroundId="garden" tendPos={{ x: 100, y: 50 }} />,
    );
    const viewBox =
      container.querySelector("svg")?.getAttribute("viewBox") ?? "";
    const x = Number(viewBox.split(" ")[0]);
    expect(x).toBe(320); // 400 - w(80)
  });

  it("clamps viewBox y to 0 when tendPos y is 0", () => {
    const { container } = render(
      <GardenBackground backgroundId="garden" tendPos={{ x: 50, y: 0 }} />,
    );
    const viewBox =
      container.querySelector("svg")?.getAttribute("viewBox") ?? "";
    const y = Number(viewBox.split(" ")[1]);
    expect(y).toBe(0);
  });

  it("clamps viewBox y to max when tendPos y is 100", () => {
    const { container } = render(
      <GardenBackground backgroundId="garden" tendPos={{ x: 50, y: 100 }} />,
    );
    const viewBox =
      container.querySelector("svg")?.getAttribute("viewBox") ?? "";
    const y = Number(viewBox.split(" ")[1]);
    expect(y).toBe(160); // 200 - h(40)
  });
});
