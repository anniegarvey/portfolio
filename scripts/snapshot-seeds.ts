/**
 * Generates a per-species PNG grid of 3 seeds × 5 growth stages. Complements
 * snapshot-grid.ts (single seed, all stages): growth-realism work must be
 * reviewed across several seeds so a tuning change isn't judged on one lucky
 * roll of the per-tree randomness.
 *
 * Rows are seeds ("snapshot" matches the tree id used by snapshot-grid.ts so
 * the first row lines up with the committed single-seed grids). Columns are
 * the five visible growth stages — the day-0 seed stage is omitted because it
 * renders identically for every seed.
 *
 * Usage:
 *   pnpm snapshot-seeds                  # all species
 *   pnpm snapshot-seeds --species=maple  # one species only
 *
 * Output: docs/bonsai-snapshots/{speciesId}-seeds.png
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticTreeSVG } from "../src/components/bonsai/TreeSVG/StaticTreeSVG";
import type { SpeciesId } from "../src/lib/bonsai/schema";
import { SPECIES_CONFIG } from "../src/lib/bonsai/speciesConfig";

const STAGES = [
  { days: 3, label: "seedling (d3)" },
  { days: 10, label: "sapling (d10)" },
  { days: 25, label: "young (d25)" },
  { days: 50, label: "mature (d50)" },
  { days: 100, label: "ancient (d100)" },
] as const;

const SEEDS = ["snapshot", "seed-B", "seed-C"] as const;

const CELL_W = 200;
const CELL_H = 300;
const LABEL_H = 24;
const ROW_LABEL_W = 70;
const GRID_W = ROW_LABEL_W + CELL_W * STAGES.length;
const GRID_H = LABEL_H + (CELL_H + 1) * SEEDS.length;

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
      const rowsHtml = SEEDS.map((seed) => {
        const cells = STAGES.map(({ days }) => {
          const tree = {
            id: `${seed}-${speciesId}`,
            speciesId,
            activeDaysCount: days,
            acquiredAt: "2024-01-01",
            prunedBranches: [] as [],
          };
          return renderToStaticMarkup(createElement(StaticTreeSVG, { tree }));
        });
        return `<div class="row"><div class="row-label">${seed}</div>${cells
          .map((svg) => `<div class="cell">${svg}</div>`)
          .join("")}</div>`;
      }).join("");

      const headerHtml = `<div class="header"><div class="hcell hl">${speciesId}</div>${STAGES.map(
        (s) => `<div class="hcell">${s.label}</div>`,
      ).join("")}</div>`;

      const html = `<!doctype html><html><head><style>
        body { margin: 0; background: #f0ecd8; font-family: system-ui, sans-serif; }
        .header, .row { display: grid; grid-template-columns: ${ROW_LABEL_W}px repeat(${STAGES.length}, ${CELL_W}px); }
        .header { height: ${LABEL_H}px; background: #e6e0c4; }
        .hcell { font-size: 11px; color: #5a4e2c; line-height: ${LABEL_H}px; text-align: center; }
        .hl { font-weight: 700; }
        .row { border-top: 1px solid rgba(90,78,44,0.15); }
        .row-label { font-size: 11px; color: #5a4e2c; align-self: center; text-align: center; }
        .cell svg { width: ${CELL_W}px; height: ${CELL_H}px; display: block; border-right: 1px solid rgba(90,78,44,0.08); }
      </style></head><body>${headerHtml}${rowsHtml}</body></html>`;

      await page.setContent(html);
      const buf = await page.screenshot({
        clip: { x: 0, y: 0, width: GRID_W, height: GRID_H },
      });
      fs.writeFileSync(path.join(outDir, `${speciesId}-seeds.png`), buf);
      console.log(`  OK  ${speciesId}-seeds.png`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
