import type { PrunedBranch } from "./schema";
import type { SpeciesConfig } from "./speciesConfig";
import {
  lerp,
  qbez,
  r,
  seededInt,
  seededVal,
  taperedPath,
  trunkCentreX,
} from "./treeGenerator.math";
import type {
  BranchSpec,
  Floret,
  Flower,
  Leaf,
  RenderedBranch,
  TreeSVGData,
} from "./treeGenerator.types";

export type { BranchSpec, Floret, Flower, Leaf, RenderedBranch, TreeSVGData };

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 300;
const SPLIT_DELAY = 7; // days from parent appearing to children appearing
export const BRANCH_GROW_DURATION = 6; // days from first appearance to full length
// Golden angle: 137.508° in radians. Irrational ratio ensures no azimuth repeats
// across alternate-phyllotaxy primaries, producing a natural spiral.
const GOLDEN_ANGLE = 2.399193;

// ─── Phase 8 — Individual Variability ─────────────────────────────────────────

/** Per-tree signed scalar in [-1, +1], deterministic from treeId + slot. */
function ivSignedScalar(treeId: string, slot: number): number {
  return seededVal(treeId, 4000 + slot) * 2 - 1;
}

/**
 * Phase 8 — derives a per-tree "effective" spec by perturbing a few
 * silhouette-shaping fields by amounts proportional to the species'
 * `individualVariability`. The same species + treeId always produces the same
 * effective spec, so determinism is preserved.
 *
 * Multipliers chosen so iv = 0 leaves every field at its species default
 * (zero variability between seeds), and the magnitudes stay bounded enough
 * at iv = 1 to keep the silhouette recognisable as the same species.
 */
function applyIndividualVariability(
  spec: SpeciesConfig,
  treeId: string,
): SpeciesConfig {
  const iv = spec.individualVariability;
  if (iv <= 0) return spec;
  const s = (slot: number) => ivSignedScalar(treeId, slot);
  return {
    ...spec,
    branchAngleBase: spec.branchAngleBase + s(0) * iv * 0.3,
    branchCurvature: spec.branchCurvature * (1 + s(1) * iv * 0.8),
    branchWander: spec.branchWander * (1 + s(2) * iv * 1.0),
    padRadius: spec.padRadius * (1 + s(3) * iv * 0.5),
    splitDiverge: spec.splitDiverge * (1 + s(4) * iv * 0.6),
  };
}

/** Days at which the growth curve reaches half of `maxTrunkHeight` (before
 *  per-tree growth-rate jitter). Smaller = faster early growth. */
const TRUNK_GROWTH_HALFLIFE_DAYS = 12;

/** Returns the trunk height (in SVG units) for a given tree — this is the
 *  single source of truth for the growth curve; generateTree calls this
 *  directly so callers can also compute glow sizes etc. without running the
 *  full generator.
 *
 *  Height climbs steeply in the first few weeks (sapling growth spurt) then
 *  flattens smoothly toward `maxTrunkHeight` — day 10 reaches ~40-49% of
 *  maxTrunkHeight, day 100 reaches ~89%. */
export function computeTrunkHeight(
  activeDaysCount: number,
  spec: SpeciesConfig,
  treeId: string,
): number {
  const iv = spec.individualVariability;
  // Per-tree growth rate variation — magnitude scales with species'
  // individualVariability. iv=0 → all seeds reach identical heights; iv=0.4
  // → ±32% spread on the effective day count (and thus on height).
  const growthRateMultiplier = 1 + ivSignedScalar(treeId, 5) * iv * 0.8;
  const scaledDays = activeDaysCount * growthRateMultiplier;
  const maxH = spec.maxTrunkHeight;
  return maxH > 0 && scaledDays > 0
    ? (maxH * scaledDays) / (scaledDays + TRUNK_GROWTH_HALFLIFE_DAYS)
    : 0;
}

/** SVG units — trunk base width at germination, before any age-driven growth. */
const TRUNK_WIDTH_BASE = 2;
/** SVG units — the asymptotic width gain (on top of `TRUNK_WIDTH_BASE`) as
 *  `activeDaysCount` → ∞, before the species' `trunkWidthFactor`. */
const TRUNK_WIDTH_GAIN = 20;
/** Days at which the width gain reaches half of `TRUNK_WIDTH_GAIN`. Deliberately
 *  much larger than `TRUNK_GROWTH_HALFLIFE_DAYS` (12) — real trunks keep
 *  thickening for decades after height growth has effectively stopped, which
 *  is how mature/ancient trees keep reading as "older" long after their
 *  height has plateaued. */
const TRUNK_WIDTH_GROWTH_HALFLIFE_DAYS = 95;

/** Returns the trunk base width (in SVG units) for a given tree — the single
 *  source of truth for trunk-mass growth, times the species' `trunkWidthFactor`.
 *  Unlike `computeTrunkHeight`, which plateaus by ~day 50, width keeps
 *  thickening visibly well past day 100, so long-lived trees continue to read
 *  as more massive with age instead of looking identical past maturity.
 *
 *  At trunkWidthFactor = 1: day 10 ≈ 3.9, day 25 ≈ 6.2, day 50 ≈ 8.9,
 *  day 100 ≈ 12.3, day 200 ≈ 15.6. */
export function computeTrunkBaseWidth(
  activeDaysCount: number,
  spec: SpeciesConfig,
): number {
  const gain =
    activeDaysCount > 0
      ? (TRUNK_WIDTH_GAIN * activeDaysCount) /
        (activeDaysCount + TRUNK_WIDTH_GROWTH_HALFLIFE_DAYS)
      : 0;
  return (TRUNK_WIDTH_BASE + gain) * spec.trunkWidthFactor;
}

// ─── Trunk Silhouette ─────────────────────────────────────────────────────────

/**
 * Computes the local perpendicular unit vector to the trunk centreline at
 * fraction `t` ∈ [0, 1]. Used both for taper width and for jaggedness offsets.
 */
function trunkPerpAt(
  t: number,
  trunkBaseX: number,
  trunkCpX: number,
  trunkTopX: number,
  trunkHeight: number,
): { px: number; py: number } {
  // Tangent of the centreline as a function of t (centreline x = qbez,
  // centreline y = baseY - trunkHeight·t → dy/dt = -trunkHeight).
  const dxdt =
    2 * (1 - t) * (trunkCpX - trunkBaseX) + 2 * t * (trunkTopX - trunkCpX);
  const dydt = -trunkHeight;
  const tlen = Math.hypot(dxdt, dydt) || 1;
  // Right-perpendicular: (px, py) = (-dydt, dxdt) / |t| → +x = right of centre.
  return { px: -dydt / tlen, py: dxdt / tlen };
}

/**
 * Builds the trunk silhouette path. Subdivides each side into `SEGS` quadratic
 * bezier sub-segments for smoothness, with `trunkJaggedness` perturbing the
 * silhouette knots perpendicularly (envelope sin(πt) anchors base + apex).
 *
 * When `trunkJaggedness === 0`, the result is a smooth piecewise-bezier
 * approximation of the original two-bezier trunk; non-zero jaggedness adds
 * gnarled bumps/notches along the silhouette.
 */
function buildTrunkPath(
  trunkBaseX: number,
  trunkBaseY: number,
  trunkCpX: number,
  trunkTopX: number,
  trunkBaseW: number,
  trunkTopW: number,
  trunkHeight: number,
  trunkJaggedness: number,
  treeId: string,
): string {
  if (trunkHeight <= 0) return "";
  const SEGS = 5;

  /** Half-width of the trunk at fraction t ∈ [0, 1] (linear taper between
   *  base and top widths — `trunkTopW` already encodes the species' taper
   *  power, so the lerp here is just position-along-trunk). */
  const halfWidthAt = (t: number): number => lerp(trunkBaseW, trunkTopW, t) / 2;

  const centreAt = (t: number): { cx: number; cy: number } => ({
    cx: qbez(trunkBaseX, trunkCpX, trunkTopX, t),
    cy: trunkBaseY - trunkHeight * t,
  });

  const jitterMag = trunkJaggedness * trunkBaseW * 0.45;

  const silhouette = (
    t: number,
    side: -1 | 1,
    extraOffset: number,
  ): { x: number; y: number } => {
    const { cx, cy } = centreAt(t);
    const { px, py } = trunkPerpAt(
      t,
      trunkBaseX,
      trunkCpX,
      trunkTopX,
      trunkHeight,
    );
    const offset = halfWidthAt(t) + extraOffset;
    return { x: cx + side * px * offset, y: cy + side * py * offset };
  };

  const lKnots: { x: number; y: number }[] = [];
  const rKnots: { x: number; y: number }[] = [];
  for (let i = 0; i <= SEGS; i++) {
    const t = i / SEGS;
    const env = Math.sin(Math.PI * t); // anchor endpoints (env=0 at t=0, t=1)
    const lj = (seededVal(`${treeId}lj`, i) - 0.5) * 2 * jitterMag * env;
    const rj = (seededVal(`${treeId}rj`, i) - 0.5) * 2 * jitterMag * env;
    lKnots.push(silhouette(t, -1, lj));
    rKnots.push(silhouette(t, +1, rj));
  }

  // Mid-segment quadratic bezier control points sit on the un-jittered smooth
  // centreline, giving the multi-segment path a gently curving feel through
  // the jittered knot points (instead of straight-line segments).
  const lMids: { x: number; y: number }[] = [];
  const rMids: { x: number; y: number }[] = [];
  for (let i = 0; i < SEGS; i++) {
    const t = (i + 0.5) / SEGS;
    lMids.push(silhouette(t, -1, 0));
    rMids.push(silhouette(t, +1, 0));
  }

  let path = `M ${r(lKnots[0].x)} ${r(lKnots[0].y)} `;
  for (let i = 0; i < SEGS; i++) {
    path += `Q ${r(lMids[i].x)} ${r(lMids[i].y)} ${r(lKnots[i + 1].x)} ${r(lKnots[i + 1].y)} `;
  }
  path += `L ${r(rKnots[SEGS].x)} ${r(rKnots[SEGS].y)} `;
  for (let i = SEGS - 1; i >= 0; i--) {
    path += `Q ${r(rMids[i].x)} ${r(rMids[i].y)} ${r(rKnots[i].x)} ${r(rKnots[i].y)} `;
  }
  path += "Z";
  return path;
}

/**
 * Generates 3–5 short root fingers radiating from the trunk base (nebari).
 * Each finger is a small tapered shape extending outward and slightly down
 * from the basal edge of the trunk, painted with the same trunk fill so it
 * reads as a continuation of the trunk silhouette.
 *
 * `nebariSpread` (0–1+) scales finger length as a fraction of trunkBaseW.
 * Returns an empty array when the spread is 0 or the trunk hasn't formed.
 */
function buildNebariPaths(
  trunkBaseX: number,
  trunkBaseY: number,
  trunkBaseW: number,
  nebariSpread: number,
  treeId: string,
): string[] {
  if (nebariSpread <= 0 || trunkBaseW <= 0) return [];
  // 3–5 fingers, deterministic per tree.
  const fingerCount = 3 + Math.floor(seededVal(`${treeId}nC`, 0) * 3);
  const baseLen = nebariSpread * trunkBaseW * 1.4;
  const halfBase = trunkBaseW / 2;
  const paths: string[] = [];
  for (let i = 0; i < fingerCount; i++) {
    const tFrac = (i + 0.5) / fingerCount; // 0..1 across the fan
    // Fan from lower-left through bottom to lower-right. Stay clear of the
    // straight-down direction so fingers visibly splay sideways above soil.
    const fanAngle = (tFrac - 0.5) * Math.PI * 1.15;
    const dx = Math.sin(fanAngle);
    // Shallow downward bias so fingers sit just above the soil ellipse instead
    // of plunging into it (soil ellipse rises ~1px above trunkBaseY).
    const dy = Math.abs(Math.cos(fanAngle)) * 0.3;
    const lenJ = 0.7 + seededVal(treeId, 310 + i) * 0.5;
    const len = baseLen * lenJ;
    // Attach across the width of the base so left fingers root in the left
    // half of the trunk and right fingers in the right half.
    const attachX = trunkBaseX + (tFrac - 0.5) * halfBase * 1.4;
    const attachY = trunkBaseY - 0.5;
    const tipX = attachX + dx * len;
    const tipY = attachY + dy * len;
    // Width: thicker at attach, tapering to a soft point.
    const w0 = 1.4 + nebariSpread * 1.2;
    const w1 = 0.4;
    paths.push(taperedPath(attachX, attachY, tipX, tipY, w0, w1));
  }
  return paths;
}

// ─── Branch Logic Helpers ─────────────────────────────────────────────────────

/** Ancestor IDs for pruning propagation: "p0-a-b" → ["p0", "p0-a"]. */
function buildAncestors(id: string): string[] {
  const segs = id.split("-");
  if (segs.length <= 1) return [];
  const out: string[] = [];
  for (let i = 1; i < segs.length; i++) {
    out.push(segs.slice(0, i).join("-"));
  }
  return out;
}

function isSelfPruned(
  id: string,
  prunedMap: Map<string, PrunedBranch>,
  day: number,
  regrowth: number,
): boolean {
  const e = prunedMap.get(id);
  return !!e && day < e.prunedAtDay + regrowth;
}

function isAncestorPruned(
  id: string,
  prunedMap: Map<string, PrunedBranch>,
  day: number,
  regrowth: number,
): boolean {
  return buildAncestors(id).some((a) =>
    isSelfPruned(a, prunedMap, day, regrowth),
  );
}

function growProgress(appearsAt: number, day: number): number {
  const age = day - appearsAt;
  if (age <= 0) return 0;
  return Math.min(age / BRANCH_GROW_DURATION, 1);
}

/**
 * Computes branch attachment heights using the bonsai "1/3 rule":
 * first branch at firstFrac of trunk, each subsequent at 1/3 of remaining distance
 * up to maxFrac. This produces natural clustering — wide gaps at the base tapering
 * to tighter spacing near the apex.
 */
function computeBranchHeights(
  trunkHeight: number,
  numBranches: number,
  firstFrac: number,
  maxFrac: number,
): number[] {
  const maxH = trunkHeight * maxFrac;
  const out: number[] = [];
  let h = trunkHeight * firstFrac;
  for (let i = 0; i < numBranches; i++) {
    if (h >= maxH) break;
    out.push(h);
    h = h + (maxH - h) / 3;
  }
  return out;
}

/**
 * If a branch (or any of its ancestors) is currently regrowing after being
 * pruned, returns a [0,1] progress relative to when regrowth started —
 * with child branches offset by SPLIT_DELAY per level below the pruned root.
 * Returns null when the branch is in normal (never-pruned / fully-regrown) state.
 */
function effectiveRegrowthProgress(
  s: BranchSpec,
  prunedMap: Map<string, PrunedBranch>,
  day: number,
  regrowthDays: number,
): number | null {
  // Walk from root ancestor down to self; find the first regrowing entry.
  const fromRootToSelf = [...buildAncestors(s.id), s.id];
  for (let i = 0; i < fromRootToSelf.length; i++) {
    const entry = prunedMap.get(fromRootToSelf[i]);
    if (entry && day >= entry.prunedAtDay + regrowthDays) {
      // Each level below the pruned root adds SPLIT_DELAY before it appears.
      const stepsBelow = fromRootToSelf.length - 1 - i;
      const regrowthStart = entry.prunedAtDay + regrowthDays;
      const effectiveAge = day - regrowthStart - stepsBelow * SPLIT_DELAY;
      if (effectiveAge <= 0) return 0;
      return Math.min(effectiveAge / BRANCH_GROW_DURATION, 1);
    }
  }
  return null; // not in regrowth
}

// ─── Foliage Pad Generation ───────────────────────────────────────────────────

/**
 * Builds a single foliage pad: `count` leaves scattered within a disc of
 * `radius` SVG units centred on (cx, cy). Each leaf carries a z offset so the
 * renderer can globally depth-sort leaves across overlapping pads — front
 * leaves overpaint rear leaves regardless of which pad they belong to.
 *
 * The z spread is proportional to the species' `crownDepthFactor`, so
 * spherical-canopy species (oak, pine) produce more depth variation per pad
 * than flat-canopy species (flame tree).
 */
function generatePad(
  seed: string,
  treeId: string,
  cx: number,
  cy: number,
  radius: number,
  count: number,
  spec: SpeciesConfig,
  progress: number,
  sizeMultiplier = 1.0,
): Leaf[] {
  const leaves: Leaf[] = [];
  const size = spec.leafSize * progress * sizeMultiplier;
  const zSpread = radius * spec.crownDepthFactor;

  for (let i = 0; i < count; i++) {
    const angle = seededVal(seed + treeId, i * 4 + 1000) * Math.PI * 2;
    // sqrt() gives uniform area distribution within the disc.
    const dist = Math.sqrt(seededVal(seed + treeId, i * 4 + 1001)) * radius;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const dz = (seededVal(seed + treeId, i * 4 + 1002) - 0.5) * 2 * zSpread;
    const tilt = seededVal(seed + treeId, i * 4 + 1003) * 360;
    const id = `${seed}-${i}`;

    if (spec.leafShape === "needle") {
      // Fan needles across an upward arc (-160°..-20°, centred on straight-up
      // -90°) instead of a full 360° "sea urchin" spread, and compress the
      // pad disc vertically so needle pads read as horizontal tufts sitting
      // on the branch — the classic pine-pad look.
      const baseDeg = -160 + (i / count) * 140;
      const jitter = (seededVal(seed + treeId, i * 4 + 1004) - 0.5) * 18;
      leaves.push({
        id,
        cx: r(cx + dx),
        cy: r(cy + dy * 0.55),
        rx: 0.4,
        ry: size,
        angleDeg: baseDeg + jitter,
        z: dz,
      });
    } else if (spec.leafShape === "scale") {
      leaves.push({
        id,
        cx: r(cx + dx),
        cy: r(cy + dy),
        rx: size * 0.7,
        ry: size * 0.7,
        angleDeg: tilt,
        z: dz,
      });
    } else {
      // oval, palmate, lobed, pinnate
      leaves.push({
        id,
        cx: r(cx + dx),
        cy: r(cy + dy),
        rx: size,
        ry: size * (spec.leafShape === "oval" ? 0.6 : 1.0),
        angleDeg: tilt,
        z: dz,
      });
    }
  }

  return leaves;
}

/** Age signal — twig/foliage density thickens as the tree matures, independent
 *  of a branch's own grow-in progress (`effectiveProg`). Scales a raw per-pad
 *  leaf count by 0.75 (freshly sprouted) up to ~1.2 (very old, ageFrac→1), so
 *  a day-100 tree carries noticeably more leaves per pad than day-50 while
 *  staying within ~1.25× of the pre-age-signal counts (SVG render cost). */
function ageDensityCount(baseCount: number, ageFrac: number): number {
  return Math.max(1, Math.round(baseCount * (0.75 + 0.45 * ageFrac)));
}

/** Age signal — pads broaden slightly as the tree matures, independent of a
 *  branch's own grow-in progress. Scales a configured `padRadius` by 0.8
 *  (freshly sprouted) up to 1.15 (very old, ageFrac→1), clamped so it never
 *  exceeds 1.15× the configured radius. */
function agePadRadius(padRadius: number, ageFrac: number): number {
  return padRadius * Math.min(1.15, 0.8 + 0.35 * ageFrac);
}

// ─── Foliage Distribution Dispatch ────────────────────────────────────────────
// Each distribution mode is a separate small function so the dispatcher stays
// readable. All four return Leaf[] in the branch-local frame.

interface FoliageContext {
  branchId: string;
  tipX: number;
  tipY: number;
  branchAngle: number;
  branchLen: number;
  isTerminal: boolean;
  depth: number;
  effectiveProg: number;
  spec: SpeciesConfig;
  treeId: string;
  ageFrac: number;
}

interface FoliageResult {
  leaves: Leaf[];
  /** Spur pad centre, if `terminalFoliage` rolled one for this branch/day —
   *  plumbed out so `generateFlowers` can also site flowers on spur shoots. */
  spurTip?: { x: number; y: number };
}

function terminalFoliage(c: FoliageContext): FoliageResult {
  const leaves: Leaf[] = [];
  let spurTip: { x: number; y: number } | undefined;

  if (c.isTerminal && c.effectiveProg > 0.3) {
    const [minL, maxL] = c.spec.leavesPerPad;
    const count = ageDensityCount(
      seededInt(c.branchId + c.treeId, 77, minL, maxL),
      c.ageFrac,
    );
    leaves.push(
      ...generatePad(
        c.branchId,
        c.treeId,
        c.tipX,
        c.tipY,
        agePadRadius(c.spec.padRadius, c.ageFrac),
        count,
        c.spec,
        c.effectiveProg,
      ),
    );
  }

  // Spur pads — real broadleaf crowns aren't bare branches with a single
  // puff at the tip; short shoots (spurs) along the outer non-terminal
  // branches also carry foliage, keeping the crown outline continuous.
  // Gated stochastically per branch via `interiorPadDensity` (reused from
  // pad-mode's interior-pad chance) and only once the branch has grown in
  // and is long enough to plausibly carry a spur. Restricted to depth >= 1
  // so primary scaffold branches stay bare, as in real trees.
  if (
    !c.isTerminal &&
    c.depth >= 1 &&
    c.effectiveProg > 0.3 &&
    c.branchLen > 6 &&
    c.spec.interiorPadDensity > 0 &&
    seededVal(c.branchId + c.treeId, 78) < c.spec.interiorPadDensity
  ) {
    const [minL, maxL] = c.spec.leavesPerPad;
    // Position ~55-75% of the way from base to tip, seeded per branch.
    const frac = 0.55 + seededVal(c.branchId + c.treeId, 800) * 0.2;
    const spurX = c.tipX - Math.cos(c.branchAngle) * c.branchLen * (1 - frac);
    const spurY = c.tipY - Math.sin(c.branchAngle) * c.branchLen * (1 - frac);
    spurTip = { x: spurX, y: spurY };
    const spurCount = ageDensityCount(
      seededInt(
        c.branchId + c.treeId,
        801,
        Math.max(1, Math.floor(minL * 0.5)),
        Math.max(2, Math.ceil(maxL * 0.5)),
      ),
      c.ageFrac,
    );
    leaves.push(
      ...generatePad(
        `${c.branchId}spur`,
        c.treeId,
        spurX,
        spurY,
        agePadRadius(c.spec.padRadius, c.ageFrac) * 0.6,
        spurCount,
        c.spec,
        c.effectiveProg,
      ),
    );
  }

  return { leaves, spurTip };
}

function padFoliage(c: FoliageContext): Leaf[] {
  if (c.effectiveProg <= 0.3) return [];
  const [minL, maxL] = c.spec.leavesPerPad;
  // Terminal tip pad — full radius.
  if (c.isTerminal) {
    const count = ageDensityCount(
      seededInt(c.branchId + c.treeId, 77, minL, maxL),
      c.ageFrac,
    );
    return generatePad(
      c.branchId,
      c.treeId,
      c.tipX,
      c.tipY,
      agePadRadius(c.spec.padRadius, c.ageFrac),
      count,
      c.spec,
      c.effectiveProg,
    );
  }
  // Interior pad on near-tip non-terminal branches — fills the empty crown
  // centre on dense canopies. Triggers stochastically so the inner pad layer
  // doesn't form a solid sphere.
  if (
    c.spec.interiorPadDensity > 0 &&
    seededVal(c.branchId + c.treeId, 78) < c.spec.interiorPadDensity
  ) {
    const intCount = ageDensityCount(
      seededInt(
        c.branchId + c.treeId,
        79,
        Math.max(1, Math.floor(minL * 0.5)),
        Math.max(2, Math.ceil(maxL * 0.5)),
      ),
      c.ageFrac,
    );
    return generatePad(
      `${c.branchId}i`,
      c.treeId,
      c.tipX,
      c.tipY,
      agePadRadius(c.spec.padRadius, c.ageFrac) * 0.7,
      intCount,
      c.spec,
      c.effectiveProg,
      0.85,
    );
  }
  return [];
}

function scatteredFoliage(c: FoliageContext): Leaf[] {
  if (c.effectiveProg <= 0.4 || c.branchLen <= 6) return [];
  const [minL, maxL] = c.spec.leavesPerPad;
  // 1–3 pads spaced along the upper section of the branch (40–100% of length).
  const numPads = Math.max(
    1,
    Math.round(seededVal(c.branchId + c.treeId, 80) * 3 + 0.5),
  );
  const leaves: Leaf[] = [];
  for (let p = 0; p < numPads; p++) {
    const frac = 0.4 + ((p + 0.5) / numPads) * 0.6;
    const px = c.tipX - Math.cos(c.branchAngle) * c.branchLen * (1 - frac);
    const py = c.tipY - Math.sin(c.branchAngle) * c.branchLen * (1 - frac);
    const count = ageDensityCount(
      seededInt(c.branchId + c.treeId, 82 + p, minL, maxL),
      c.ageFrac,
    );
    leaves.push(
      ...generatePad(
        `${c.branchId}s${p}`,
        c.treeId,
        px,
        py,
        agePadRadius(c.spec.padRadius, c.ageFrac),
        count,
        c.spec,
        c.effectiveProg,
      ),
    );
  }
  return leaves;
}

function pendentFoliage(c: FoliageContext): Leaf[] {
  if (!(c.isTerminal && c.effectiveProg > 0.3)) return [];
  const [minL, maxL] = c.spec.leavesPerPad;
  const leaves: Leaf[] = [];

  // Terminal tip cluster.
  const tipCount = ageDensityCount(
    seededInt(c.branchId + c.treeId, 77, minL, maxL),
    c.ageFrac,
  );
  leaves.push(
    ...generatePad(
      c.branchId,
      c.treeId,
      c.tipX,
      c.tipY,
      agePadRadius(c.spec.padRadius, c.ageFrac),
      tipCount,
      c.spec,
      c.effectiveProg,
    ),
  );

  // Hanging chain of smaller clusters draping below the tip — wisteria's
  // signature weeping curtain. Length scales with the species' raceme length
  // when defined, otherwise a sensible default.
  const chainLength =
    (c.spec.flowers?.racemeLength ?? 18) * 0.6 * c.effectiveProg;
  const chainSteps = seededInt(c.branchId + c.treeId, 83, 2, 4);
  for (let d = 1; d <= chainSteps; d++) {
    const t = d / chainSteps;
    const sway = (seededVal(c.branchId + c.treeId, 84 + d) - 0.5) * 2.5;
    const hangCount = ageDensityCount(
      seededInt(c.branchId + c.treeId, 85 + d, minL, maxL),
      c.ageFrac,
    );
    leaves.push(
      ...generatePad(
        `${c.branchId}h${d}`,
        c.treeId,
        c.tipX + sway,
        c.tipY + t * chainLength,
        agePadRadius(c.spec.padRadius, c.ageFrac) * 0.55,
        hangCount,
        c.spec,
        c.effectiveProg,
        0.75,
      ),
    );
  }
  return leaves;
}

/** Dispatches to the per-distribution builder selected on the species spec.
 *  Only `terminalFoliage` ever produces a `spurTip` — the other three modes
 *  are wrapped so their call sites stay unchanged. */
function buildFoliageLeaves(c: FoliageContext): FoliageResult {
  switch (c.spec.foliageDistribution) {
    case "terminal":
      return terminalFoliage(c);
    case "pad":
      return { leaves: padFoliage(c) };
    case "scattered":
      return { leaves: scatteredFoliage(c) };
    case "pendent":
      return { leaves: pendentFoliage(c) };
  }
}

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

function generateFlowers(
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

// ─── Branch Tree Builder ──────────────────────────────────────────────────────

const TIP_BEND_FRACTION = 0.3;

interface BranchGeometry {
  kneeOffsetX: number;
  kneeOffsetY: number;
  tipOffsetX: number;
  tipOffsetY: number;
  tipOffsetZ: number;
  shaftLength: number;
  tipBendLength: number;
  angle2D: number;
  tipBendAngle: number;
  projectedLength: number;
}

/**
 * Computes shaft+tip 2D geometry for a branch from its 3D pitch + azimuth.
 *
 * Phase 7 — final-depth twigs with non-zero `tipDroop` bend toward the tip
 * by `(π/2)·tipDroop` over the last `TIP_BEND_FRACTION` of length: positive
 * tipDroop = upturn (pine candles), negative = weep (wisteria). Non-terminal
 * branches and species with `tipDroop === 0` collapse to a straight branch
 * (knee = unbent tip, `tipBendLength === 0`).
 */
function computeBranchGeometry(
  pitch: number,
  azimuth: number,
  length3D: number,
  applyBend: boolean,
  tipDroop: number,
): BranchGeometry {
  const cosPitch = Math.cos(pitch);
  const dirX = cosPitch * Math.cos(azimuth);
  const dirY = -Math.sin(pitch);
  const dirZ = cosPitch * Math.sin(azimuth);
  const shaftFrac = applyBend ? 1 - TIP_BEND_FRACTION : 1;
  const kneeOffsetX = dirX * length3D * shaftFrac;
  const kneeOffsetY = dirY * length3D * shaftFrac;
  const kneeOffsetZ = dirZ * length3D * shaftFrac;

  let tipOffsetX = dirX * length3D;
  let tipOffsetY = dirY * length3D;
  let tipOffsetZ = dirZ * length3D;
  if (applyBend) {
    // Clamp bentPitch so a weeping/upturned tip flattens at perpendicular
    // rather than overshooting and curling back the wrong way — without this,
    // a parent already plunging near -π/2 plus a strongly negative tipDroop
    // would wrap past straight-down and the tip would point upward.
    const HALF_PI = Math.PI / 2;
    const rawBent = pitch + HALF_PI * tipDroop;
    const bentPitch =
      tipDroop < 0
        ? Math.max(rawBent, -HALF_PI)
        : tipDroop > 0
          ? Math.min(rawBent, HALF_PI)
          : rawBent;
    const cosBent = Math.cos(bentPitch);
    const bentLen = length3D * TIP_BEND_FRACTION;
    tipOffsetX = kneeOffsetX + cosBent * Math.cos(azimuth) * bentLen;
    tipOffsetY = kneeOffsetY + -Math.sin(bentPitch) * bentLen;
    tipOffsetZ = kneeOffsetZ + cosBent * Math.sin(azimuth) * bentLen;
  }

  const shaftLength = Math.sqrt(kneeOffsetX ** 2 + kneeOffsetY ** 2);
  const tipBendLength = applyBend
    ? Math.sqrt(
        (tipOffsetX - kneeOffsetX) ** 2 + (tipOffsetY - kneeOffsetY) ** 2,
      )
    : 0;
  const angle2D = shaftLength < 1e-9 ? 0 : Math.atan2(kneeOffsetY, kneeOffsetX);
  const tipBendAngle =
    applyBend && tipBendLength >= 1e-9
      ? Math.atan2(tipOffsetY - kneeOffsetY, tipOffsetX - kneeOffsetX)
      : angle2D;

  return {
    kneeOffsetX,
    kneeOffsetY,
    tipOffsetX,
    tipOffsetY,
    tipOffsetZ,
    shaftLength,
    tipBendLength,
    angle2D,
    tipBendAngle,
    projectedLength: shaftLength + tipBendLength,
  };
}

function buildBranchTree(
  id: string,
  x1: number,
  y1: number,
  parentTipZ: number,
  pitch: number,
  azimuth: number,
  length3D: number,
  appearsAtDay: number,
  depth: number,
  baseWidth: number,
  spec: SpeciesConfig,
  day: number,
  treeId: string,
  out: BranchSpec[],
): void {
  const tipWidth = Math.max(baseWidth * 0.25, 0.4);

  // 3D → 2D projection happens inside computeBranchGeometry. Pitch is
  // elevation above horizontal (SVG y-down so upward = +pitch → negative
  // dy); azimuth is yaw around the trunk axis (0 = right, π/2 = toward
  // viewer, π = left, 3π/2 = away).
  const applyBend = depth === spec.maxDepth && spec.tipDroop !== 0;
  const geom = computeBranchGeometry(
    pitch,
    azimuth,
    length3D,
    applyBend,
    spec.tipDroop,
  );

  // Z-depth of this tip = parent tip's z + this segment's z component.
  // Cumulative (not segment-local) so a deep terminal sitting in front of
  // a forward-facing primary inherits its primary's depth — without this,
  // terminal leaves would always have small |z| and depth tinting would
  // collapse to the primaries that have no leaves on them.
  const tipZRaw = parentTipZ + geom.tipOffsetZ;
  // Clamp to exactly 0 only at the trunk root + cardinal-azimuth cases to
  // keep the all-flat branch determinism property.
  const z = Math.abs(tipZRaw) < 1e-10 ? 0 : tipZRaw;

  const kneeX = x1 + geom.kneeOffsetX;
  const kneeY = y1 + geom.kneeOffsetY;
  const fulltipX = x1 + geom.tipOffsetX;
  const fulltipY = y1 + geom.tipOffsetY;
  const { shaftLength, tipBendLength, projectedLength, angle2D, tipBendAngle } =
    geom;
  // Each branch gets a seeded random curve — range ±branchCurvature
  const curveBias =
    (seededVal(id + treeId, 91) - 0.5) * 2 * spec.branchCurvature;

  out.push({
    id,
    appearsAtDay,
    x1,
    y1,
    fulltipX,
    fulltipY,
    angle: angle2D,
    azimuth,
    z,
    maxLength: projectedLength,
    baseWidth,
    tipWidth,
    depth,
    curveBias,
    kneeX,
    kneeY,
    shaftLength,
    tipBendLength,
    tipBendAngle,
  });

  if (depth >= spec.maxDepth) return;

  const childDay = appearsAtDay + SPLIT_DELAY;
  if (day < childDay) return;

  // branchWander: small random walk on the parent's 3D pitch before forking,
  // producing organic kinks rather than ruler-straight branch lines.
  const wanderedPitch =
    pitch + (seededVal(id + treeId, 77) - 0.5) * 2 * spec.branchWander;

  // Per-branch random divergence variation (±15% around species default)
  const divergeVar =
    spec.splitDiverge * (1.0 + (seededVal(id + treeId, 88) - 0.5) * 0.3);

  // Shorter twigs at deeper levels — base factor shrinks linearly with depth.
  const baseLengthFactor = Math.max(0.3, 0.55 - depth * 0.04);
  // Children inherit the parent's 3D length so deeper branches scale naturally
  // even if the parent itself was foreshortened in 2D.
  const childLength =
    length3D * (baseLengthFactor + seededVal(id + treeId, 89) * 0.12);
  const childBaseWidth = tipWidth * 1.5;

  // Leader: the first child continues near-parallel to the parent direction.
  // High apicalDominance → small leader offset (pine, juniper); low → all
  // children diverge similarly (maple, flame tree).
  const leaderDiverge = (1 - spec.apicalDominance) * divergeVar;

  // Per-fork fan rotation — orients the divergence plane around the parent's
  // 3D direction. Without this, every fork's divergence stays in pitch
  // (vertical), so a forward-projected primary's leader-and-laterals chain
  // collapses onto a single vertical column above the attachment, giving
  // the "linear strip up the trunk" silhouette.
  const forkFanRotation = seededVal(`${id}-fanRot${treeId}`, 0) * Math.PI * 2;

  // Compensates for azimuth coordinate compression near the poles — without
  // this, near-vertical parents get tiny visual spread for the same azimuth
  // offset. Floor at 0.4 keeps the term bounded near vertical.
  const azCompensation = 1 / Math.max(0.4, Math.abs(Math.cos(pitch)));

  // Per-fork childCount perturbation — at higher individualVariability, some
  // forks gain or lose a child relative to the species default. Probability of
  // a non-zero adjustment scales linearly with iv, so iv = 0 leaves every fork
  // at its configured count. Bounded so the species silhouette stays readable.
  const baseChildCount = spec.childCountByDepth[depth] ?? 2;
  const ivAdjRoll = seededVal(`${id}-cc${treeId}`, 0);
  const ivAdjRange = spec.individualVariability * 0.4;
  let childCount = baseChildCount;
  if (baseChildCount > 1 && ivAdjRoll < ivAdjRange) {
    childCount = baseChildCount - 1;
  } else if (ivAdjRoll > 1 - ivAdjRange) {
    childCount = baseChildCount + 1;
  }
  const laterals = Math.max(1, childCount - 1);

  for (let k = 0; k < childCount; k++) {
    const childSuffix = String.fromCharCode(97 + k); // 'a', 'b', 'c', …
    let childPitch: number;
    let childAzimuth: number;

    if (k === 0) {
      // Leader — stays close to wandered parent direction. Azimuth jitter
      // scales with (1 - apicalDominance) so loose-apex species (maple,
      // flame tree) wander further from the parent's azimuth than tight-apex
      // species (pine, oak).
      childPitch = wanderedPitch + leaderDiverge;
      const leaderAzJitter =
        (seededVal(`${id}-${childSuffix}-az${treeId}`, 0) - 0.5) *
        2 *
        leaderDiverge *
        azCompensation;
      childAzimuth = azimuth + leaderAzJitter;
    } else {
      // Lateral — distribute around the fan ring at equal angular spacing
      // rotated by forkFanRotation. cos(fan)=1 reproduces the old "pitch
      // only" behaviour; sin(fan)=1 spreads laterally instead. Random
      // rotation per fork mixes both outcomes across the tree.
      const fanAngle = forkFanRotation + ((k - 1) * 2 * Math.PI) / laterals;
      childPitch = wanderedPitch + divergeVar * Math.cos(fanAngle);
      childAzimuth = azimuth + divergeVar * Math.sin(fanAngle) * azCompensation;
    }

    buildBranchTree(
      `${id}-${childSuffix}`,
      fulltipX,
      fulltipY,
      tipZRaw,
      childPitch,
      childAzimuth,
      childLength,
      childDay,
      depth + 1,
      childBaseWidth,
      spec,
      day,
      treeId,
      out,
    );
  }
}

// ─── Main Generator ───────────────────────────────────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: procedural SVG tree generation is inherently complex
export function generateTree(
  activeDaysCount: number,
  inputSpec: SpeciesConfig,
  prunedBranches: PrunedBranch[],
  treeId: string,
): TreeSVGData {
  // Phase 8 — every downstream read of the spec sees per-tree-perturbed values
  // so seeds of the same species look like distinct individuals.
  const spec = applyIndividualVariability(inputSpec, treeId);
  const iv = spec.individualVariability;
  // Multiplier applied to per-branch seeded jitter ranges. Calibrated so iv=0.2
  // (typical species default) reproduces the historical hard-coded jitter.
  // Higher iv (e.g. juniper 0.4) widens jitter; iv=0 narrows it sharply.
  const jitterScale = 0.5 + iv * 2.5;

  const trunkBaseX = VIEWBOX_WIDTH / 2;
  const trunkBaseY = VIEWBOX_HEIGHT - 30;
  const prunedMap = new Map(prunedBranches.map((p) => [p.branchId, p]));

  // ─── Trunk ────────────────────────────────────────────────────────────────

  const trunkHeight = computeTrunkHeight(activeDaysCount, spec, treeId);
  const trunkTopY = trunkBaseY - trunkHeight;
  // Age signal — how close this tree is to its asymptotic max height. Trunk
  // height itself plateaus early (see the growth-curve note in SPECIES.md);
  // this fraction instead drives the three signals that keep reading as
  // "older" long after — bark jaggedness, foliage density, and lower-branch
  // sag — plus the pre-existing apex-twig-length scaling below.
  const heightFrac =
    spec.maxTrunkHeight > 0 ? trunkHeight / spec.maxTrunkHeight : 0;

  const trunkBaseW = computeTrunkBaseWidth(activeDaysCount, spec);
  // Species-driven taper: with the historical 0.28 base ratio raised to the
  // species' trunkTaperPower, power > 1 narrows the apex (faster taper, e.g.
  // pine 1.4 → ratio 0.18) and power < 1 widens it (slower taper).
  const trunkTopW = trunkBaseW * 0.28 ** spec.trunkTaperPower;

  // Per-tree curvature direction: 50% left, 50% right, based on tree ID
  const curveDir = seededVal(treeId, 0) > 0.5 ? 1 : -1;
  // Per-tree curvature variation — magnitude scales with iv. At iv=0.15 the
  // ±25% spread matches the previous hard-coded behaviour; juniper (0.4)
  // gets ±68% spread, producing visibly straight-vs-bent individuals.
  const curveMag =
    spec.trunkCurvature * (1 + ivSignedScalar(treeId, 6) * iv * 1.7);
  const curveOffset = curveMag * trunkHeight * 0.4 * curveDir;

  // Trunk centreline: quadratic bezier P0 (base) → P1 (control) → P2 (top)
  const trunkCpX = trunkBaseX + curveOffset * 0.65;
  const trunkTopX = trunkBaseX + curveOffset;

  // Age signal — bark starts smooth and gnarls as the tree matures (young
  // saplings render at 60% of the species' jaggedness; old trees ramp up to
  // 120% as heightFrac approaches its asymptote).
  const effectiveJaggedness = spec.trunkJaggedness * (0.6 + 0.6 * heightFrac);

  const trunkPathData = buildTrunkPath(
    trunkBaseX,
    trunkBaseY,
    trunkCpX,
    trunkTopX,
    trunkBaseW,
    trunkTopW,
    trunkHeight,
    effectiveJaggedness,
    treeId,
  );

  const nebariPathData =
    trunkHeight > 0
      ? buildNebariPaths(
          trunkBaseX,
          trunkBaseY,
          trunkBaseW,
          spec.nebariSpread,
          treeId,
        )
      : [];

  // ─── Branch Specs ─────────────────────────────────────────────────────────

  const allSpecs: BranchSpec[] = [];

  // Cascade species (drooping branches): cluster branches in the upper portion of the trunk.
  // Upright species: distribute from firstBranchFrac upward using the "1/3 rule".
  const isCascade = spec.branchAngleBase < -0.05;
  // Strong-leader species (pine, oak) get the same raised ceiling as cascade
  // styles so the topmost whorl/node sits closer to the apex instead of
  // leaving a bare trunk segment under the apex cluster.
  const maxAttachFrac = isCascade || spec.apicalDominance >= 0.6 ? 0.96 : 0.9;

  // ─── Phyllotaxy-Driven Primary Branch Placement ──────────────────────────
  // Primary branches are numbered p0, p1, p2 … sequentially. Phyllotaxy
  // controls how many branches share each height node and what azimuth each
  // gets around the trunk axis.
  const phyllotaxy = spec.phyllotaxy;
  const whorlSize = spec.whorlSize ?? 3;
  const maxBranchPairs = spec.maxBranchPairs;
  const branchFrequency = spec.branchFrequency;
  const branchAngleBase = spec.branchAngleBase;
  const branchAngleRamp = spec.branchAngleRamp;
  // Species-dependent taper of primary branch length from lowest to highest
  // zone — higher apicalDominance narrows the crown into a conical silhouette
  // (pine); lower apicalDominance keeps upper branches nearly as long as the
  // lowest, reading as a flatter umbrella (flame tree). Replaces the old
  // fixed 0.42; zoneFrac === 0 (lowest branch) is unaffected either way.
  const zoneTaper = 0.25 + 0.35 * spec.apicalDominance;

  // Per-tree azimuth rotation — prevents every tree of the same species from
  // landing primaries at identical cardinal angles. Without this, opposite
  // and whorled species always project the same forward/back primaries to
  // dx ≈ 0, giving every tree a "linear strip up the trunk" silhouette.
  const treeAzimuthOffset = seededVal(treeId, 12) * Math.PI * 2;

  // Height-node count: whorled/opposite group multiple primaries per node.
  const numNodes =
    phyllotaxy === "whorled"
      ? Math.ceil(maxBranchPairs / whorlSize)
      : phyllotaxy === "opposite"
        ? Math.ceil(maxBranchPairs / 2)
        : maxBranchPairs;

  const branchHeights = computeBranchHeights(
    trunkHeight,
    numNodes,
    spec.firstBranchFrac,
    maxAttachFrac,
  );
  const numActualNodes = branchHeights.length;

  let primaryIdx = 0;

  nodeLoop: for (let nodeIdx = 0; nodeIdx < numActualNodes; nodeIdx++) {
    // Branches born from this height node
    const branchesAtNode =
      phyllotaxy === "whorled"
        ? Math.min(whorlSize, maxBranchPairs - primaryIdx)
        : phyllotaxy === "opposite"
          ? Math.min(2, maxBranchPairs - primaryIdx)
          : 1;

    // Zone fraction: 0 = lowest node, 1 = highest — used for angle ramp.
    const zoneFrac = numActualNodes > 1 ? nodeIdx / (numActualNodes - 1) : 0.5;

    for (let k = 0; k < branchesAtNode; k++) {
      if (primaryIdx >= maxBranchPairs) break nodeLoop;

      const currentPrimary = primaryIdx;
      primaryIdx++;
      const id = `p${currentPrimary}`;

      // Appearance day: lower nodes appear earlier
      const baseDay = (nodeIdx + 1) * branchFrequency;
      const dayJitter =
        (seededVal(`${id}t${treeId}`, 0) - 0.5) * branchFrequency * 0.5;
      const appearsAtDay = Math.max(1, Math.round(baseDay + dayJitter));
      if (activeDaysCount < appearsAtDay) continue;

      // Attachment height — alternate branches get a small per-branch jitter;
      // whorled/opposite keep all siblings at the same node height.
      const hJitter =
        phyllotaxy === "alternate"
          ? (seededVal(`${id}h${treeId}`, 0) - 0.5) *
            trunkHeight *
            0.03 *
            jitterScale
          : 0;
      const heightFromBase = Math.max(
        trunkHeight * spec.firstBranchFrac * 0.85,
        Math.min(
          trunkHeight * maxAttachFrac * 0.99,
          branchHeights[nodeIdx] + hJitter,
        ),
      );

      const t = trunkHeight > 0 ? Math.min(heightFromBase / trunkHeight, 1) : 0;
      const attachX = trunkCentreX(t, trunkBaseX, trunkCpX, trunkTopX);
      const attachY = trunkBaseY - heightFromBase;

      // Elevation (pitch) angle — same ramp logic as before
      const angleProgression = branchAngleRamp * (zoneFrac - 0.5);
      const angleJitter =
        (seededVal(`pa${id}${treeId}`, 0) - 0.5) * 0.14 * jitterScale;
      // Age signal — lower primaries sag under accumulated mass as the tree
      // ages. Ramps in only once heightFrac passes ~0.7 (day ~30+) and hits
      // full strength by ~0.9 (day ~90+); scaled by lowness so the apex never
      // sags. Cascade species are already drooping by design and are excluded.
      const sagRamp = isCascade
        ? 0
        : Math.min(1, Math.max(0, (heightFrac - 0.7) / 0.2));
      const sag = sagRamp * (1 - zoneFrac) * 0.1;
      const pitch = branchAngleBase + angleProgression + angleJitter - sag;

      // Azimuth (yaw around trunk axis) — the key Phase 3 change
      let azimuth: number;
      if (phyllotaxy === "whorled") {
        // k-th branch of the whorl, evenly spaced around 2π. Successive
        // whorls are rotated by π/whorlSize so they interleave instead of
        // repeating the same azimuths up the trunk — doubles the unique
        // azimuths used and prevents every whorl looking like the same
        // 3-spoke (juniper) or 5-spoke (pine) signature.
        // Divide by branchesAtNode (not whorlSize) so partial final whorls
        // still spread evenly — e.g. 2 leftover branches get 0° and 180°.
        const baseAzimuth = (k / branchesAtNode) * Math.PI * 2;
        const whorlRotation = (nodeIdx * Math.PI) / whorlSize;
        const azJitter =
          (seededVal(`az${id}${treeId}`, 0) - 0.5) * 0.3 * jitterScale;
        azimuth = baseAzimuth + whorlRotation + azJitter;
      } else if (phyllotaxy === "opposite") {
        // Decussate: successive pairs rotate 90° (π/2). Within each pair,
        // the two branches are diametrically opposite (+ π). Per-node jitter
        // prevents every pair landing on exactly cardinal axes — without it
        // pair 1 always projects to dx = 0, foreshortening the whole pair
        // onto the trunk centreline.
        const pairBase = (nodeIdx % 2) * (Math.PI / 2);
        const pairJitter =
          (seededVal(`az${id}${treeId}`, 0) - 0.5) * 0.4 * jitterScale;
        azimuth = pairBase + pairJitter + k * Math.PI;
      } else {
        // alternate — golden-angle spiral avoids azimuth repetition
        const baseAzimuth = currentPrimary * GOLDEN_ANGLE;
        const azJitter =
          (seededVal(`az${id}${treeId}`, 0) - 0.5) * 0.3 * jitterScale;
        azimuth = baseAzimuth + azJitter;
      }
      azimuth += treeAzimuthOffset;

      // Thickness from trunk width at attachment — upper branches naturally thinner
      const attachTrunkW = lerp(trunkBaseW, trunkTopW, t);
      const primaryBaseW = Math.max(
        0.5,
        attachTrunkW * spec.branchThicknessFactor,
      );

      // Length: lower branches longer (wide silhouette), upper shorter —
      // scaled by the tree's CURRENT trunk height so a young sapling gets
      // proportionally short whips instead of adult-length branches on a
      // stubby trunk. Children inherit this length and extend it further.
      const lengthBase =
        trunkHeight * spec.crownSpreadFactor * (1 - zoneFrac * zoneTaper);
      const lengthVar =
        (seededVal(`pl${id}${treeId}`, 0) - 0.5) *
        lengthBase *
        0.3 *
        jitterScale;
      const primaryLength = Math.max(6, lengthBase + lengthVar);

      // Pitch + azimuth pass through unprojected — buildBranchTree does the
      // 3D→2D projection internally so foreshortening and depth are preserved.
      // Primaries attach to the trunk at z = 0 (the trunk centreline is the
      // z origin); cumulative tip z is built up as the recursion descends.
      buildBranchTree(
        id,
        attachX,
        attachY,
        0,
        pitch,
        azimuth,
        primaryLength,
        appearsAtDay,
        0,
        primaryBaseW,
        spec,
        activeDaysCount,
        treeId,
        allSpecs,
      );
    }
  }

  // ─── Apex Branches ────────────────────────────────────────────────────────
  // The trunk tip is "just another forking node" that follows the species'
  // phyllotaxy: whorled species crown with a whorl, opposite with a pair,
  // alternate with a single leader (which then forks per childCountByDepth[0]).
  // The old fixed apex-L / apex-R pair was always at azimuth ∈ {0, π}, which
  // gave every species a bilaterally symmetric "pom-pom on a stick"; phyllotaxy-
  // driven azimuths plus the per-tree azimuth offset distribute the apex
  // branches around the trunk axis instead.
  // Apex twig length as a fraction of trunk height — same species-driven
  // shrink-with-branch-count relationship as before (denser primaries → finer
  // apex growth), scaled by the current trunk-height fraction of maturity
  // (`heightFrac`, computed above) so it reproduces the original fixed length
  // once trunkHeight reaches maxTrunkHeight, and shrinks proportionally on a
  // young tree instead of always spawning adult-length apex growth.
  const finalTopBranchLen =
    heightFrac * Math.max(12, 34 - (spec.maxBranchPairs - 1) * 3);
  if (
    trunkHeight > 0 &&
    activeDaysCount >= spec.branchFrequency &&
    !isCascade
  ) {
    const apexAppearsAtDay = spec.branchFrequency;
    const apexLength = Math.max(4, finalTopBranchLen * 0.7);
    const apexBaseWidth = Math.max(0.6, trunkTopW * 1.4);
    const apexHalfSpread = spec.splitDiverge * 0.8;

    const apexBranchCount =
      phyllotaxy === "whorled" ? whorlSize : phyllotaxy === "opposite" ? 2 : 1;

    // Continue the height-node sequence so apex whorls inherit the inter-
    // whorl rotation pattern and alternate spirals advance past the last
    // primary's golden-angle azimuth.
    const apexNodeIdx = numActualNodes;

    for (let k = 0; k < apexBranchCount; k++) {
      const apexId = `apex-${k}`;
      let apexAzimuth: number;
      if (phyllotaxy === "whorled") {
        const baseAzimuth = (k / apexBranchCount) * Math.PI * 2;
        const whorlRotation = (apexNodeIdx * Math.PI) / whorlSize;
        const azJitter =
          (seededVal(`az${apexId}${treeId}`, 0) - 0.5) * 0.3 * jitterScale;
        apexAzimuth = baseAzimuth + whorlRotation + azJitter;
      } else if (phyllotaxy === "opposite") {
        const pairBase = (apexNodeIdx % 2) * (Math.PI / 2);
        const pairJitter =
          (seededVal(`az${apexId}${treeId}`, 0) - 0.5) * 0.4 * jitterScale;
        apexAzimuth = pairBase + pairJitter + k * Math.PI;
      } else {
        // alternate — continue the golden-angle spiral past the last primary
        const baseAzimuth = (primaryIdx + k) * GOLDEN_ANGLE;
        const azJitter =
          (seededVal(`az${apexId}${treeId}`, 0) - 0.5) * 0.3 * jitterScale;
        apexAzimuth = baseAzimuth + azJitter;
      }
      apexAzimuth += treeAzimuthOffset;

      // Pitch — near-vertical with small per-branch tilt so multi-apex
      // species don't read as a single ramrod-straight column.
      const pitchTilt =
        (seededVal(`apx${apexId}${treeId}`, 0) - 0.5) * 0.18 * jitterScale;
      const apexPitch = Math.PI / 2 - apexHalfSpread + pitchTilt;

      buildBranchTree(
        apexId,
        trunkTopX,
        trunkTopY,
        0,
        apexPitch,
        apexAzimuth,
        apexLength,
        apexAppearsAtDay,
        0,
        apexBaseWidth,
        spec,
        activeDaysCount,
        treeId,
        allSpecs,
      );
    }
  }

  // ─── Render Branches ──────────────────────────────────────────────────────

  // Collect IDs of branches that will be visible (for terminal-leaf detection).
  const visibleIds = new Set<string>();
  for (const s of allSpecs) {
    if (isSelfPruned(s.id, prunedMap, activeDaysCount, spec.regrowthDays))
      continue;
    if (isAncestorPruned(s.id, prunedMap, activeDaysCount, spec.regrowthDays))
      continue;
    const prog = growProgress(s.appearsAtDay, activeDaysCount);
    const regrowProg = effectiveRegrowthProgress(
      s,
      prunedMap,
      activeDaysCount,
      spec.regrowthDays,
    );
    const ep = regrowProg !== null ? regrowProg : prog;
    if (ep > 0) visibleIds.add(s.id);
  }

  const rendered: RenderedBranch[] = [];

  for (const s of allSpecs) {
    if (isSelfPruned(s.id, prunedMap, activeDaysCount, spec.regrowthDays))
      continue;
    if (isAncestorPruned(s.id, prunedMap, activeDaysCount, spec.regrowthDays))
      continue;

    const prog = growProgress(s.appearsAtDay, activeDaysCount);
    const regrowProg = effectiveRegrowthProgress(
      s,
      prunedMap,
      activeDaysCount,
      spec.regrowthDays,
    );
    // Regrowing branches use progress relative to when regrowth started; normal
    // branches use age-based progress. Skip if neither gives a positive value.
    const effectiveProg = regrowProg !== null ? regrowProg : prog;
    if (effectiveProg <= 0) continue;

    const currentLen = lerp(0, s.maxLength, effectiveProg);
    const currentTipW = lerp(s.baseWidth, s.tipWidth, effectiveProg);

    let x2: number;
    let y2: number;
    let tipAngle2D: number;
    let path: string;
    if (s.tipBendLength > 0 && currentLen > s.shaftLength) {
      // Phase 7 — bent tip rendered as two tapered segments meeting at the
      // knee. While the tip is still extending, the visible end moves along
      // the bent direction; once the tip is fully grown, leaves attach at the
      // bent end so the foliage layer follows the curl.
      const tipLen = currentLen - s.shaftLength;
      x2 = s.kneeX + Math.cos(s.tipBendAngle) * tipLen;
      y2 = s.kneeY + Math.sin(s.tipBendAngle) * tipLen;
      tipAngle2D = s.tipBendAngle;
      const kneeWidth = lerp(
        s.baseWidth,
        s.tipWidth,
        s.shaftLength / s.maxLength,
      );
      const shaftPath = taperedPath(
        s.x1,
        s.y1,
        s.kneeX,
        s.kneeY,
        s.baseWidth,
        kneeWidth,
        s.curveBias,
      );
      const tipPath = taperedPath(
        s.kneeX,
        s.kneeY,
        x2,
        y2,
        kneeWidth,
        currentTipW,
        0,
      );
      path = `${shaftPath} ${tipPath}`;
    } else {
      // Either an unbent branch, or a bent branch still in its shaft phase
      // (the kink hasn't appeared yet). Single tapered segment as before.
      x2 = s.x1 + Math.cos(s.angle) * currentLen;
      y2 = s.y1 + Math.sin(s.angle) * currentLen;
      tipAngle2D = s.angle;
      path = taperedPath(
        s.x1,
        s.y1,
        x2,
        y2,
        s.baseWidth,
        currentTipW,
        s.curveBias,
      );
    }

    const isTerminal = !(
      visibleIds.has(`${s.id}-a`) || visibleIds.has(`${s.id}-b`)
    );

    const { leaves, spurTip } = buildFoliageLeaves({
      branchId: s.id,
      tipX: x2,
      tipY: y2,
      branchAngle: tipAngle2D,
      branchLen: currentLen,
      isTerminal,
      depth: s.depth,
      effectiveProg,
      spec,
      treeId,
      ageFrac: heightFrac,
    });

    rendered.push({
      id: s.id,
      x1: s.x1,
      y1: s.y1,
      x2,
      y2,
      pathData: path,
      depth: s.depth,
      z: s.z,
      leaves,
      isPruned: false,
      isTerminal,
      spurTip,
    });
  }

  // Pruned stubs — render a tiny stub so the user sees where the branch was
  const specsById = new Map(allSpecs.map((s) => [s.id, s]));
  for (const p of prunedBranches) {
    if (activeDaysCount >= p.prunedAtDay + spec.regrowthDays) continue;
    const s = specsById.get(p.branchId);
    if (!s) continue;
    if (isAncestorPruned(s.id, prunedMap, activeDaysCount, spec.regrowthDays))
      continue;

    const stubLen = Math.min(s.baseWidth * 1.5, 4);
    const sx2 = s.x1 + Math.cos(s.angle) * stubLen;
    const sy2 = s.y1 + Math.sin(s.angle) * stubLen;
    rendered.push({
      id: s.id,
      x1: s.x1,
      y1: s.y1,
      x2: sx2,
      y2: sy2,
      pathData: taperedPath(
        s.x1,
        s.y1,
        sx2,
        sy2,
        s.baseWidth * 0.7,
        s.baseWidth * 0.3,
      ),
      depth: s.depth,
      z: s.z,
      leaves: [],
      isPruned: true,
      isTerminal: false,
    });
  }

  // ─── Apex Leaves ──────────────────────────────────────────────────────────
  // Trunk-top decoration — a small terminal pad that appears within the first
  // few days while primary branches are still emerging. Once apex branches
  // form, this layer mostly hides behind them and acts as a fallback so a
  // pre-branch sapling isn't bare at the top.
  const apexProgress = Math.min(activeDaysCount / 6, 1);
  const apexLeaves: Leaf[] =
    activeDaysCount > 0 && trunkHeight > 0
      ? generatePad(
          "apex",
          treeId,
          trunkTopX,
          trunkTopY,
          agePadRadius(spec.padRadius, heightFrac) * 0.7,
          ageDensityCount(
            seededInt(
              `apex${treeId}`,
              0,
              spec.leavesPerPad[0],
              spec.leavesPerPad[1],
            ),
            heightFrac,
          ),
          spec,
          apexProgress,
          0.85,
        )
      : [];

  const flowers = generateFlowers(
    rendered,
    trunkTopX,
    trunkTopY,
    activeDaysCount,
    spec,
    treeId,
  );

  return {
    viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
    trunkX: trunkBaseX,
    trunkBaseY,
    trunkTopY,
    trunkTopX,
    trunkPathData,
    nebariPathData,
    branches: rendered,
    apexLeaves,
    flowers,
  };
}
