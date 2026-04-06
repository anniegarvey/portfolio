/**
 * Generates static SVG snapshots of each bonsai species at every growth stage.
 *
 * Usage:
 *   pnpm generate-snapshots                  # all 7 species, all 6 stages
 *   pnpm generate-snapshots --species=maple  # one species only
 *
 * Output: public/bonsai-snapshots/{speciesId}-{stage-label}.svg
 * Each file is a standalone SVG that can be used as <img src> without a server.
 *
 * Reusability: add any SpeciesId to the --species flag to export any tree type.
 */

import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticTreeSVG } from "../src/components/bonsai/TreeSVG/StaticTreeSVG";
import type { SpeciesId } from "../src/lib/bonsai/schema";
// Relative imports — scripts/ is outside the Next.js @/* alias resolution scope.
import { SPECIES_CONFIG } from "../src/lib/bonsai/schema";

// ─── Growth stages (matches GROWTH_LABEL_THRESHOLDS in schema.ts) ─────────────

const STAGES = [
  { days: 0, label: "seed" },
  { days: 3, label: "seedling" },
  { days: 10, label: "sapling" },
  { days: 25, label: "young-tree" },
  { days: 50, label: "mature-tree" },
  { days: 100, label: "ancient-tree" },
] as const;

// ─── CLI args ─────────────────────────────────────────────────────────────────

const speciesArg = process.argv
  .find((a) => a.startsWith("--species="))
  ?.split("=")[1] as SpeciesId | undefined;

if (speciesArg && !(speciesArg in SPECIES_CONFIG)) {
  console.error(
    `Unknown species "${speciesArg}". Valid values: ${Object.keys(SPECIES_CONFIG).join(", ")}`,
  );
  process.exit(1);
}

const speciesToRun: SpeciesId[] = speciesArg
  ? [speciesArg]
  : (Object.keys(SPECIES_CONFIG) as SpeciesId[]);

// ─── Output directory ─────────────────────────────────────────────────────────

const outDir = path.join(process.cwd(), "public", "bonsai-snapshots");
fs.mkdirSync(outDir, { recursive: true });

// ─── Generate ─────────────────────────────────────────────────────────────────

let total = 0;

for (const speciesId of speciesToRun) {
  for (const { days, label } of STAGES) {
    const tree = {
      id: `snapshot-${speciesId}`,
      speciesId,
      activeDaysCount: days,
      acquiredAt: "2024-01-01",
      prunedBranches: [] as [],
    };

    const svgString = renderToStaticMarkup(
      createElement(StaticTreeSVG, { tree }),
    );
    const filename = `${speciesId}-${label}.svg`;
    fs.writeFileSync(path.join(outDir, filename), svgString);
    console.log(`  ✓  ${filename}`);
    total++;
  }
}

console.log(`\nGenerated ${total} snapshot(s) → public/bonsai-snapshots/`);
