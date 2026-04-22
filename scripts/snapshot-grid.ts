/**
 * Generates a side-by-side PNG grid of every bonsai species at every growth
 * stage. Used as a visual-diff baseline for multi-phase redesign work — the
 * PNGs are committed under docs/bonsai-snapshots/ and can be compared across
 * commits with any image-diff tool (e.g. `git diff`'s binary marker,
 * GitHub's image view, or a separate tool like odiff).
 *
 * Each grid contains 6 stages in one row: seed, seedling, sapling,
 * young-tree, mature-tree, ancient-tree.
 *
 * Usage:
 *   pnpm exec tsx scripts/snapshot-grid.ts                  # all species
 *   pnpm exec tsx scripts/snapshot-grid.ts --species=maple  # one species only
 *
 * Output: docs/bonsai-snapshots/{speciesId}-grid.png
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticTreeSVG } from "../src/components/bonsai/TreeSVG/StaticTreeSVG";
import type { SpeciesId } from "../src/lib/bonsai/schema";
import { SPECIES_CONFIG } from "../src/lib/bonsai/speciesConfig";

// ─── Stages (matches GROWTH_LABEL_THRESHOLDS in schema.ts) ────────────────────

const STAGES = [
  { days: 0, label: "seed" },
  { days: 3, label: "seedling" },
  { days: 10, label: "sapling" },
  { days: 25, label: "young-tree" },
  { days: 50, label: "mature-tree" },
  { days: 100, label: "ancient-tree" },
] as const;

const CELL_W = 240;
const CELL_H = 360;
const LABEL_H = 28;
const GRID_W = CELL_W * STAGES.length;
const GRID_H = CELL_H + LABEL_H;

async function main() {
  const speciesArg = process.argv
    .find((a) => a.startsWith("--species="))
    ?.split("=")[1] as SpeciesId | undefined;

  if (speciesArg && !(speciesArg in SPECIES_CONFIG)) {
    console.error(
      `Unknown species "${speciesArg}". Valid: ${Object.keys(SPECIES_CONFIG).join(", ")}`,
    );
    process.exit(1);
  }

  const speciesToRun: SpeciesId[] = speciesArg
    ? [speciesArg]
    : (Object.keys(SPECIES_CONFIG) as SpeciesId[]);

  const outDir = path.join(process.cwd(), "docs", "bonsai-snapshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: GRID_W, height: GRID_H },
    });

    for (const speciesId of speciesToRun) {
      const cells = STAGES.map(({ days, label }) => {
        const tree = {
          id: `snapshot-${speciesId}`,
          speciesId,
          activeDaysCount: days,
          acquiredAt: "2024-01-01",
          prunedBranches: [] as [],
        };
        const svg = renderToStaticMarkup(
          createElement(StaticTreeSVG, { tree }),
        );
        return { label, svg };
      });

      const html = `<!doctype html>
<html>
  <head>
    <style>
      body { margin: 0; background: #f0ecd8; font-family: system-ui, sans-serif; }
      .row { display: grid; grid-template-columns: repeat(${STAGES.length}, ${CELL_W}px); }
      .cell { width: ${CELL_W}px; }
      .cell svg { width: ${CELL_W}px; height: ${CELL_H}px; display: block; }
      .label {
        height: ${LABEL_H}px;
        line-height: ${LABEL_H}px;
        text-align: center;
        font-size: 12px;
        color: #5a4e2c;
        border-top: 1px solid rgba(90, 78, 44, 0.15);
      }
    </style>
  </head>
  <body>
    <div class="row">
      ${cells
        .map(
          (c) =>
            `<div class="cell">${c.svg}<div class="label">${c.label}</div></div>`,
        )
        .join("")}
    </div>
  </body>
</html>`;

      await page.setContent(html);
      const buf = await page.screenshot({
        clip: { x: 0, y: 0, width: GRID_W, height: GRID_H },
      });
      const filename = `${speciesId}-grid.png`;
      fs.writeFileSync(path.join(outDir, filename), buf);
      console.log(`  OK  ${filename}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
