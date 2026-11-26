import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ALL_SPECIES_IDS } from "@/lib/glade/catalog";
import type { SpeciesId } from "@/lib/glade/schema";
import { CreatureSVG } from "./CreatureSVG";

function draw(speciesId: SpeciesId, silhouette = false) {
  const { container } = render(
    <CreatureSVG silhouette={silhouette} size={52} speciesId={speciesId} />,
  );
  // biome-ignore lint/style/noNonNullAssertion: the component is one svg
  return container.querySelector("svg")!;
}

/** Species that are asleep or serene, and so drawn with their eyes shut. */
const EYES_SHUT: SpeciesId[] = ["puffloaf", "fernmother"];

/** Species seen from the side, which show one eye. */
const SIDE_ON: SpeciesId[] = ["hedgehog", "wren"];

describe("CreatureSVG", () => {
  it("draws every species as its own picture, hidden from assistive technology", () => {
    const pictures = ALL_SPECIES_IDS.map((id) => {
      const svg = draw(id);
      expect(svg).toHaveAttribute("aria-hidden", "true");
      expect(svg).toHaveAttribute("width", "52");
      expect(svg).toHaveAttribute("viewBox", "0 0 64 64");
      return svg.innerHTML;
    });
    expect(new Set(pictures).size).toBe(ALL_SPECIES_IDS.length);
  });

  it("gives every creature blinking eyes, unless it is drawn with them shut", () => {
    for (const id of ALL_SPECIES_IDS) {
      const eyes = draw(id).querySelectorAll('[data-part="eye"]');
      const expected = EYES_SHUT.includes(id)
        ? 0
        : SIDE_ON.includes(id)
          ? 1
          : 2;
      expect(eyes, id).toHaveLength(expected);
    }
  });

  it("blinks each species on its own beat", () => {
    const delays = ALL_SPECIES_IDS.map((id) =>
      draw(id).style.getPropertyValue("--blink-delay"),
    );
    expect(new Set(delays).size).toBe(ALL_SPECIES_IDS.length);
  });

  it("beats the wings of the three winged species, each at its own speed", () => {
    const beats = (["glimmerwing", "emberveil", "mirewing"] as const).map(
      (id) => {
        const svg = draw(id);
        // Two wings a side.
        expect(svg.querySelectorAll('[data-part="wing"]'), id).toHaveLength(4);
        return Number.parseFloat(svg.style.getPropertyValue("--wingbeat"));
      },
    );
    // A dragonfly's blur, a moth's flutter, a butterfly barely stirring.
    expect(beats[0]).toBeLessThan(beats[1]);
    expect(beats[1]).toBeLessThan(beats[2]);
    expect(draw("rabbit").querySelector('[data-part="wing"]')).toBeNull();
  });

  it("draws the details each description promises", () => {
    // The songbirds sing; the wren, whose song outsizes it, sings more.
    expect(draw("robin").querySelectorAll('[data-part="note"]')).toHaveLength(
      1,
    );
    expect(draw("wren").querySelectorAll('[data-part="note"]')).toHaveLength(2);
    // The drowsy cloud-sheep sleeps.
    expect(draw("puffloaf").querySelector('[data-part="zzz"]')).not.toBeNull();
    // Glimmerwing's glow is a lantern; the fire-moth sheds embers.
    expect(
      draw("glimmerwing").querySelector('[data-part="glow"]'),
    ).not.toBeNull();
    expect(
      draw("emberveil").querySelectorAll('[data-part="ember"]'),
    ).toHaveLength(3);
    // Herbs along the Mosskit's spine; five fronds crown the Fernmother.
    expect(draw("mosskit").querySelectorAll('[data-part="sway"]')).toHaveLength(
      3,
    );
    expect(
      draw("fernmother").querySelectorAll('[data-part="sway"]'),
    ).toHaveLength(5);
  });

  it("marks a silhouette, and only a silhouette", () => {
    expect(draw("fox", true)).toHaveAttribute("data-silhouette");
    expect(draw("fox")).not.toHaveAttribute("data-silhouette");
  });
});
