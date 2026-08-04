import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ALL_CROP_IDS,
  ALL_SITE_IDS,
  GROWTH_STAGES,
} from "@/lib/meadowmere/catalog";
import { ALL_NEIGHBOUR_IDS } from "@/lib/meadowmere/catalog";
import type { Facing } from "@/lib/meadowmere/movement";
import { FarmerSVG } from "./FarmerSVG";
import { CottageArt, PlotArt, SiteArt, StallArt } from "./FeatureArt";
import { TerrainLayer } from "./TerrainLayer";

/** SVG fragments need an <svg> root to render into. */
function renderSvg(node: React.ReactNode) {
  return render(<svg aria-hidden>{node}</svg>);
}

const FACINGS: Facing[] = ["up", "down", "left", "right"];

describe("FarmerSVG", () => {
  it.each(FACINGS)("draws the %s pose", (facing) => {
    const { container } = render(<FarmerSVG facing={facing} walking={false} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(
      container.querySelectorAll("ellipse, circle, rect, path").length,
    ).toBeGreaterThan(5);
  });

  it("mirrors one side-on drawing rather than carrying two", () => {
    const paths = (facing: Facing) =>
      [
        ...render(
          <FarmerSVG facing={facing} walking={false} />,
        ).container.querySelectorAll("path"),
      ].map((p) => p.getAttribute("d"));

    // Left and right are the same shapes flipped in CSS; the front-facing
    // pose is drawn separately.
    expect(paths("left")).toEqual(paths("right"));
    expect(paths("left")).not.toEqual(paths("down"));
  });

  it("draws a different pose facing the viewer than facing away", () => {
    const { container: down } = render(
      <FarmerSVG facing="down" walking={false} />,
    );
    const { container: up } = render(<FarmerSVG facing="up" walking={false} />);
    expect(down.innerHTML).not.toBe(up.innerHTML);
  });

  it("takes a walking flag without changing the pose it draws", () => {
    const { container: still } = render(
      <FarmerSVG facing="down" walking={false} />,
    );
    const { container: moving } = render(<FarmerSVG facing="down" walking />);
    expect(still.querySelectorAll("circle").length).toBe(
      moving.querySelectorAll("circle").length,
    );
  });
});

describe("TerrainLayer", () => {
  it("draws every tile of the 16 × 12 grid", () => {
    const { container } = renderSvg(<TerrainLayer />);
    // One group per tile, as direct children of the layer's own group.
    const layer = container.querySelector("svg > g") as SVGGElement;
    expect(layer.children.length).toBe(16 * 12);
  });

  it("is hidden from assistive tech — the hotspots carry the meaning", () => {
    const { container } = renderSvg(<TerrainLayer />);
    expect(container.querySelector("svg > g")).toHaveAttribute("aria-hidden");
  });

  it("draws the same shapes on every render, so snapshots stay stable", () => {
    const first = renderSvg(<TerrainLayer />).container.innerHTML;
    const second = renderSvg(<TerrainLayer />).container.innerHTML;
    expect(first).toBe(second);
  });
});

describe("PlotArt", () => {
  it("draws bare soil for an empty bed", () => {
    const { container } = renderSvg(
      <PlotArt cropId={null} stage={null} wateredToday={false} />,
    );
    expect(container.querySelectorAll("rect").length).toBe(1);
  });

  it.each(GROWTH_STAGES)("draws the %s stage", (stage) => {
    const { container } = renderSvg(
      <PlotArt cropId="parsnip" stage={stage} wateredToday={false} />,
    );
    expect(container.querySelectorAll("*").length).toBeGreaterThan(3);
  });

  it.each(ALL_CROP_IDS)("gives %s its own ripe form", (cropId) => {
    const { container } = renderSvg(
      <PlotArt cropId={cropId} stage="Ripe" wateredToday={false} />,
    );
    expect(container.innerHTML).not.toBe("");
  });

  it("draws ripe crops differently from one another", () => {
    const parsnip = renderSvg(
      <PlotArt cropId="parsnip" stage="Ripe" wateredToday={false} />,
    ).container.innerHTML;
    const pumpkin = renderSvg(
      <PlotArt cropId="pumpkin" stage="Ripe" wateredToday={false} />,
    ).container.innerHTML;
    expect(parsnip).not.toBe(pumpkin);
  });

  it("darkens the soil once the bed has been watered today", () => {
    const dry = renderSvg(
      <PlotArt cropId="parsnip" stage="Sprout" wateredToday={false} />,
    ).container.innerHTML;
    const wet = renderSvg(
      <PlotArt cropId="parsnip" stage="Sprout" wateredToday />,
    ).container.innerHTML;
    expect(dry).not.toBe(wet);
  });
});

describe("SiteArt", () => {
  it.each(ALL_SITE_IDS)("draws %s", (siteId) => {
    const { container } = renderSvg(<SiteArt locked={false} siteId={siteId} />);
    expect(container.innerHTML).not.toBe("");
  });

  it("shuts a gate across a site that isn't open yet", () => {
    const open = renderSvg(<SiteArt locked={false} siteId="riverbank" />);
    const shut = renderSvg(<SiteArt locked siteId="riverbank" />);
    expect(shut.container.querySelectorAll("rect").length).toBeGreaterThan(
      open.container.querySelectorAll("rect").length,
    );
  });

  it("fades a locked site so it reads as out of reach", () => {
    const { container } = renderSvg(<SiteArt locked siteId="stonewood" />);
    expect(container.querySelector("g")).toHaveAttribute("opacity", "0.55");
  });
});

describe("CottageArt", () => {
  it.each(ALL_NEIGHBOUR_IDS)("gives %s their own cottage", (neighbourId) => {
    const { container } = renderSvg(<CottageArt neighbourId={neighbourId} />);
    expect(container.innerHTML).not.toBe("");
  });

  it("makes each neighbour's cottage distinct", () => {
    const rendered = ALL_NEIGHBOUR_IDS.map(
      (id) => renderSvg(<CottageArt neighbourId={id} />).container.innerHTML,
    );
    expect(new Set(rendered).size).toBe(ALL_NEIGHBOUR_IDS.length);
  });
});

describe("StallArt", () => {
  it("draws the stall", () => {
    const { container } = renderSvg(<StallArt />);
    expect(container.querySelectorAll("rect").length).toBeGreaterThan(3);
  });
});
