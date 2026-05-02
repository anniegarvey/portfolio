/**
 * Phase 8 — generates a side-by-side PNG grid of 4 seeds × every bonsai
 * species at day 50 (mature-tree stage). Used to eyeball the effect of the
 * `individualVariability` per-species scalar: every row should read as the
 * same species, but the four cells in a row should look like distinct
 * individuals rather than near-identical clones.
 *
 * Usage:
 *   pnpm exec tsx scripts/snapshot-variety.ts
 *
 * Output: docs/bonsai-snapshots/variety-grid.png
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticTreeSVG } from "../src/components/bonsai/TreeSVG/StaticTreeSVG";
import type { SpeciesId } from "../src/lib/bonsai/schema";
import { SPECIES_CONFIG } from "../src/lib/bonsai/speciesConfig";

// Distinct seeds chosen so each one rolls a different sign on every variability
// slot in the generator (see ivSignedScalar). Plain "tree-1"…"tree-4" works in
// practice — the seeded hash already decorrelates between slots.
const SEEDS = ["variety-A", "variety-B", "variety-C", "variety-D"] as const;
const DAYS = 50; // mature-tree stage — branching + foliage are visually mature

const CELL_W = 220;
const CELL_H = 320;
const LABEL_H = 22;
const ROW_LABEL_W = 90;
const speciesIds = Object.keys(SPECIES_CONFIG) as SpeciesId[];
const GRID_W = ROW_LABEL_W + CELL_W * SEEDS.length;
const GRID_H = LABEL_H + (CELL_H + 1) * speciesIds.length;

async function main() {
  const outDir = path.join(process.cwd(), "docs", "bonsai-snapshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: GRID_W, height: GRID_H },
    });

    const rowsHtml = speciesIds
      .map((speciesId) => {
        const cells = SEEDS.map((seed) => {
          const tree = {
            id: `${seed}-${speciesId}`,
            speciesId,
            activeDaysCount: DAYS,
            acquiredAt: "2024-01-01",
            prunedBranches: [] as [],
          };
          return renderToStaticMarkup(
            createElement(StaticTreeSVG, { tree }),
          );
        });
        const label = SPECIES_CONFIG[speciesId].label;
        return `<div class="row">
            <div class="row-label">${label}</div>
            ${cells.map((svg) => `<div class="cell">${svg}</div>`).join("")}
          </div>`;
      })
      .join("");

    const headerHtml = `<div class="header">
        <div class="header-label">species \\ seed</div>
        ${SEEDS.map((s) => `<div class="header-cell">${s}</div>`).join("")}
      </div>`;

    const html = `<!doctype html>
<html>
  <head>
    <style>
      body { margin: 0; background: #f0ecd8; font-family: system-ui, sans-serif; }
      .header, .row {
        display: grid;
        grid-template-columns: ${ROW_LABEL_W}px repeat(${SEEDS.length}, ${CELL_W}px);
      }
      .header { height: ${LABEL_H}px; background: #e6e0c4; }
      .header-label, .header-cell {
        font-size: 11px; color: #5a4e2c; line-height: ${LABEL_H}px;
        text-align: center; border-right: 1px solid rgba(90, 78, 44, 0.15);
      }
      .header-label { font-weight: 600; }
      .row { border-top: 1px solid rgba(90, 78, 44, 0.15); }
      .row-label {
        font-size: 12px; color: #5a4e2c; font-weight: 600;
        align-self: center; text-align: center;
        border-right: 1px solid rgba(90, 78, 44, 0.15);
      }
      .cell { width: ${CELL_W}px; }
      .cell svg {
        width: ${CELL_W}px; height: ${CELL_H}px; display: block;
        border-right: 1px solid rgba(90, 78, 44, 0.05);
      }
    </style>
  </head>
  <body>
    ${headerHtml}
    ${rowsHtml}
  </body>
</html>`;

    await page.setContent(html);
    const buf = await page.screenshot({
      clip: { x: 0, y: 0, width: GRID_W, height: GRID_H },
      fullPage: false,
    });
    const outPath = path.join(outDir, "variety-grid.png");
    fs.writeFileSync(outPath, buf);
    console.log(`  OK  ${outPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
