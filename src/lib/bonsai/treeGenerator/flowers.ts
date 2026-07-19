import type { SpeciesConfig } from "../speciesConfig";
import { seededInt, seededVal } from "../treeGenerator.math";
import type { Floret, Flower, RenderedBranch } from "../treeGenerator.types";

// ─── Flower Generation ────────────────────────────────────────────────────────

const FLOWER_FADE_DURATION = 8; // days from floweringAge to full opacity

function buildRacemeFlorets(
  tipCx: number,
  tipCy: number,
  seed: string,
  flowerSize: number,
  racemeLength: number,
  progress: number,
): Floret[] {
  const floretCount = Math.round(seededInt(seed, 55, 14, 20) * progress);
  const florets: Floret[] = [];
  for (let i = 0; i < floretCount; i++) {
    const t = i / Math.max(floretCount - 1, 1);
    const rowWidth = flowerSize * 2.5 * Math.sin(t * Math.PI) * 0.9;
    const xOff = (seededVal(seed, i * 3 + 400) - 0.5) * rowWidth * 2;
    florets.push({
      id: `r${i}`,
      cx: tipCx + xOff,
      cy: tipCy + t * racemeLength * progress,
      rx: flowerSize * (0.8 + seededVal(seed, i * 3 + 402) * 0.4),
      ry: flowerSize * 0.55,
      angleDeg: seededVal(seed, i * 3 + 401) * 40 - 20,
    });
  }
  return florets;
}

function buildClusterFlorets(
  tipCx: number,
  tipCy: number,
  seed: string,
  flowerSize: number,
): Floret[] {
  const petalCount = seededInt(seed, 66, 4, 6);
  const florets: Floret[] = [];
  for (let i = 0; i < petalCount; i++) {
    const angle =
      (i / petalCount) * Math.PI * 2 + seededVal(seed, i + 500) * 0.4;
    const dist = flowerSize * (0.7 + seededVal(seed, i + 501) * 0.5);
    florets.push({
      id: `p${i}`,
      cx: tipCx + Math.cos(angle) * dist,
      cy: tipCy + Math.sin(angle) * dist,
      rx: flowerSize * (0.85 + seededVal(seed, i + 502) * 0.3),
      ry: flowerSize * (0.7 + seededVal(seed, i + 503) * 0.25),
      angleDeg: (angle * 180) / Math.PI,
    });
  }
  // Centre dot appended last — renderer slices it off separately
  florets.push({
    id: "centre",
    cx: tipCx,
    cy: tipCy,
    rx: flowerSize * 0.35,
    ry: flowerSize * 0.35,
    angleDeg: 0,
  });
  return florets;
}

function buildCatkinFlorets(
  tipCx: number,
  tipCy: number,
  flowerSize: number,
  progress: number,
): Floret[] {
  const catkinLen = flowerSize * 7 * progress;
  const bumpCount = Math.round(catkinLen / (flowerSize * 1.6));
  const florets: Floret[] = [];
  for (let i = 0; i < bumpCount; i++) {
    const t = i / Math.max(bumpCount - 1, 1);
    const xOff = Math.sin(t * Math.PI * 2.5) * flowerSize * 0.6;
    florets.push({
      id: `b${i}`,
      cx: tipCx + xOff,
      cy: tipCy + t * catkinLen,
      rx: flowerSize * (0.55 + (1 - t) * 0.25),
      ry: flowerSize * 0.55,
      angleDeg: xOff * 8,
    });
  }
  return florets;
}

function buildBerryFlorets(
  tipCx: number,
  tipCy: number,
  seed: string,
  flowerSize: number,
): Floret[] {
  const berryCount = seededInt(seed, 77, 1, 3);
  const florets: Floret[] = [];
  for (let i = 0; i < berryCount; i++) {
    const angle = seededVal(seed, i * 2 + 600) * Math.PI * 2;
    const dist = seededVal(seed, i * 2 + 601) * flowerSize * 2.5;
    florets.push({
      id: `b${i}`,
      cx: tipCx + Math.cos(angle) * dist,
      cy: tipCy + Math.sin(angle) * dist,
      rx: flowerSize,
      ry: flowerSize,
      angleDeg: 0,
    });
  }
  return florets;
}

export function generateFlowers(
  rendered: RenderedBranch[],
  apexTipX: number,
  apexTipY: number,
  activeDaysCount: number,
  spec: SpeciesConfig,
  treeId: string,
): Flower[] {
  const fs = spec.flowers;
  if (!fs) return [];
  if (activeDaysCount < fs.floweringAge) return [];

  const progress = Math.min(
    (activeDaysCount - fs.floweringAge) / FLOWER_FADE_DURATION,
    1,
  );

  const tips: Array<{ id: string; cx: number; cy: number }> = [];
  for (const b of rendered) {
    if (b.isPruned) continue;
    if (b.isTerminal) tips.push({ id: b.id, cx: b.x2, cy: b.y2 });
    // Spur shoots along non-terminal branches (real Prunus/Quercus flowers
    // aren't only at branch tips) are also eligible sites, keyed distinctly
    // so the density roll below is independent of the tip roll.
    if (b.spurTip)
      tips.push({
        id: `${b.id}-spur`,
        cx: b.spurTip.x,
        cy: b.spurTip.y,
      });
  }
  tips.push({ id: "apex", cx: apexTipX, cy: apexTipY });

  // Real cone/catkin/berry/blossom display is sparse and scattered, not a
  // bloom at every tip — thin the eligible tips down to `flowerDensity` with
  // a per-tip seeded roll keyed on tip id + treeId (slot 15, unused by the
  // per-shape floret builders below), so the selected set is stable across
  // renders for a given tree regardless of day.
  const floweringTips = tips.filter(
    (tip) => seededVal(tip.id + treeId, 15) < fs.flowerDensity,
  );

  return floweringTips.map((tip) => {
    const seed = tip.id + treeId;
    const base = { id: `flower-${tip.id}`, cx: tip.cx, cy: tip.cy, progress };

    if (fs.flowerShape === "raceme") {
      return {
        ...base,
        florets: [],
        racemeFlorets: buildRacemeFlorets(
          tip.cx,
          tip.cy,
          seed,
          fs.flowerSize,
          fs.racemeLength ?? 24,
          progress,
        ),
      };
    }
    if (fs.flowerShape === "cluster") {
      return {
        ...base,
        florets: buildClusterFlorets(tip.cx, tip.cy, seed, fs.flowerSize),
        racemeFlorets: [],
      };
    }
    if (fs.flowerShape === "catkin") {
      return {
        ...base,
        florets: buildCatkinFlorets(tip.cx, tip.cy, fs.flowerSize, progress),
        racemeFlorets: [],
      };
    }
    // berry
    return {
      ...base,
      florets: buildBerryFlorets(tip.cx, tip.cy, seed, fs.flowerSize),
      racemeFlorets: [],
    };
  });
}
