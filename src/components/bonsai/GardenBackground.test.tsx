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
  it("always draws the whole scene", () => {
    const { container } = render(<GardenBackground backgroundId="garden" />);
    expect(container.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "0 0 400 200",
    );
  });
});
