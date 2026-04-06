import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SpeciesIdSchema } from "@/lib/bonsai/schema";
import { BonsaiTimelapse } from "./BonsaiTimelapse";

describe("BonsaiTimelapse", () => {
  it("renders 6 SVG frames for maple", () => {
    render(<BonsaiTimelapse speciesId="maple" />);
    const svgs = document.querySelectorAll("svg");
    expect(svgs).toHaveLength(6);
  });

  it("renders all 6 growth stage labels", () => {
    render(<BonsaiTimelapse speciesId="maple" />);
    expect(screen.getByText("Seed")).toBeInTheDocument();
    expect(screen.getByText("Seedling")).toBeInTheDocument();
    expect(screen.getByText("Sapling")).toBeInTheDocument();
    expect(screen.getByText("Young Tree")).toBeInTheDocument();
    expect(screen.getByText("Mature Tree")).toBeInTheDocument();
    expect(screen.getByText("Ancient Tree")).toBeInTheDocument();
  });

  it("renders the accessible frame stack label", () => {
    render(<BonsaiTimelapse speciesId="maple" />);
    expect(
      screen.getByRole("img", {
        name: /maple bonsai growing from seed to ancient tree/i,
      }),
    ).toBeInTheDocument();
  });

  it.each(
    SpeciesIdSchema.options,
  )("renders without throwing for species: %s", (speciesId) => {
    expect(() =>
      render(<BonsaiTimelapse speciesId={speciesId} />),
    ).not.toThrow();
  });

  it("wraps frames in a light-mode container", () => {
    const { container } = render(<BonsaiTimelapse speciesId="maple" />);
    // data-light-mode signals the light color-scheme wrapper (CSS value is
    // not available in JSDOM since next-yak generates class-based styles)
    const wrapper = container.querySelector("[data-light-mode]") as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.dataset.lightMode).toBe("true");
  });

  it("assigns sequential data-frame attributes to frames", () => {
    const { container } = render(<BonsaiTimelapse speciesId="maple" />);
    const frames = container.querySelectorAll("[data-frame]");
    const indices = Array.from(frames).map((el) =>
      Number(el.getAttribute("data-frame")),
    );
    // 6 frames + 6 captions = 12 elements with data-frame
    expect(indices).toEqual([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5]);
  });
});
