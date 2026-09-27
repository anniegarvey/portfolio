import type { SpeciesConfig } from "../speciesConfig";
import { seededInt, seededVal } from "../treeGenerator.math";
import type { Floret, Flower, RenderedBranch } from "../treeGenerator.types";

// ─── Flower Generation ────────────────────────────────────────────────────────

const FLOWER_FADE_DURATION = 8; // days from floweringAge to full opacity

/**
 * Silhouettes clustered round a tip — blossoms, poinciana flowers, cones —
 * `min`..`max` of them within `spread` × size of the tip.
 */
function buildClusterFlorets(
  tipCx: number,
  tipCy: number,
  seed: string,
  size: number,
  [min, max]: [number, number],
  spread: number,
  maxTiltDeg: number,
): Floret[] {
  const count = seededInt(seed, 66, min, max);
  const florets: Floret[] = [];
  for (let i = 0; i < count; i++) {
    const angle = seededVal(seed, i * 4 + 500) * Math.PI * 2;
    const dist =
      (i === 0 ? 0 : 0.6 + seededVal(seed, i * 4 + 501) * 0.4) * size * spread;
    const r = size * (0.85 + seededVal(seed, i * 4 + 502) * 0.3);
    florets.push({
      id: `f${i}`,
      cx: tipCx + Math.cos(angle) * dist,
      cy: tipCy + Math.sin(angle) * dist,
      rx: r,
      ry: r,
      angleDeg: (seededVal(seed, i * 4 + 503) - 0.5) * 2 * maxTiltDeg,
    });
  }
  return florets;
}

/**
 * Silhouettes hanging from a tip — samaras, catkins, a raceme — `count` of
 * them fanned a little either side of straight down, `length` long.
 */
function buildHangingFlorets(
  tipCx: number,
  tipCy: number,
  seed: string,
  width: number,
  length: number,
  count: number,
): Floret[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `h${i}`,
    cx: tipCx + (i - (count - 1) / 2) * width * 0.8,
    cy: tipCy,
    rx: width,
    ry: length * (0.85 + seededVal(seed, i * 3 + 400) * 0.3),
    angleDeg: (seededVal(seed, i * 3 + 401) - 0.5) * 30,
  }));
}

function buildFlorets(
  tip: { cx: number; cy: number },
  seed: string,
  fs: NonNullable<SpeciesConfig["flowers"]>,
  progress: number,
): Floret[] {
  const size = fs.flowerSize;
  switch (fs.flowerShape) {
    case "blossom":
      return buildClusterFlorets(tip.cx, tip.cy, seed, size, [2, 4], 1.2, 180);
    case "corymb":
      return buildClusterFlorets(tip.cx, tip.cy, seed, size, [3, 5], 1.4, 35);
    case "berry":
      return buildClusterFlorets(tip.cx, tip.cy, seed, size, [1, 3], 2, 0);
    case "samara":
      return buildHangingFlorets(
        tip.cx,
        tip.cy,
        seed,
        size,
        size,
        seededInt(seed, 77, 1, 2),
      );
    case "catkin":
      return buildHangingFlorets(
        tip.cx,
        tip.cy,
        seed,
        size,
        size * 7 * progress,
        seededInt(seed, 77, 1, 3),
      );
    case "raceme":
      return buildHangingFlorets(
        tip.cx,
        tip.cy,
        seed,
        size * 2.2,
        (fs.racemeLength ?? 24) * progress,
        1,
      );
  }
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
    return {
      id: `flower-${tip.id}`,
      cx: tip.cx,
      cy: tip.cy,
      progress,
      florets: buildFlorets(tip, seed, fs, progress),
    };
  });
}
