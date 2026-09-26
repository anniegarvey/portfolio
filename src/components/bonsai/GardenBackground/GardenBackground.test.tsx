import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BackgroundId } from "@/lib/bonsai/schema";
import { GardenBackground } from "./GardenBackground";

const SCENES: BackgroundId[] = [
  "garden",
  "zen-garden",
  "misty-mountain",
  "night-garden",
  "autumn-forest",
];

describe("GardenBackground — scene rendering", () => {
  it.each(SCENES)("paints the %s scene", (id) => {
    const { container } = render(<GardenBackground backgroundId={id} />);
    expect(container.querySelector("svg")?.childElementCount).toBeGreaterThan(
      10,
    );
  });

  it.each(
    SCENES,
  )("names the %s scene's gradients per instance, so two on a page never share one", (id) => {
    const { container } = render(
      <>
        <GardenBackground backgroundId={id} />
        <GardenBackground backgroundId={id} />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((el) => el.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    // Every url(#…) reference resolves within the same scene.
    const [first] = container.querySelectorAll("svg");
    const own = new Set([...first.querySelectorAll("[id]")].map((el) => el.id));
    const refs = first.innerHTML.match(/url\(#([^)]+)\)/g) ?? [];
    for (const ref of refs) {
      expect(own.has(ref.slice(5, -1))).toBe(true);
    }
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
