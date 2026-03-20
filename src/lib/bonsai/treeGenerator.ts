import type { PrunedBranch, SpeciesConfig } from "./schema";

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface Leaf {
  /** Stable React key — unique within this branch's leaf cluster. */
  id: string;
  cx: number;
  cy: number;
  /** For needles: half-length. For ovals/scale: half-width. For palmate/lobed: overall scale. */
  rx: number;
  /** For needles: half-thickness (always small). For ovals/scale: half-height. */
  ry: number;
  /** Rotation in degrees — needle direction, leaf tilt, etc. */
  angleDeg: number;
}

export interface RenderedBranch {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pathData: string; // tapered filled shape
  depth: number;
  leaves: Leaf[];
  isPruned: boolean;
  isTerminal: boolean;
}

export interface TreeSVGData {
  viewBox: string;
  trunkX: number;
  trunkBaseY: number;
  trunkTopY: number;
  trunkTopX: number; // offset from centre due to curvature
  trunkPathData: string;
  branches: RenderedBranch[];
  /** Leaf cluster at the trunk apex — always rendered, never prunable. */
  apexLeaves: Leaf[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 300;
const SPLIT_DELAY = 7; // days from parent appearing to children appearing
const MAX_DEPTH = 2; // 0 = primary, 1 = secondary, 2 = tertiary
export const BRANCH_GROW_DURATION = 6; // days from first appearance to full length

// ─── Seeded Randomness ────────────────────────────────────────────────────────

/** Returns a deterministic value in [0, 1) for a given string key + index.
 *  Consistent across renders for the same inputs. */
function seededVal(key: string, index: number): number {
  let h = index * 2654435761;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 2246822519);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  return ((h >>> 0) & 0xffff) / 0x10000;
}

/** Linear interpolate between a and b, clamped to [0,1]. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

/** Round to 1 decimal place — reduces SVG path string size without visible loss. */
function r(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Random integer in [min, max] using seededVal. */
function seededInt(
  key: string,
  index: number,
  min: number,
  max: number,
): number {
  return min + Math.floor(seededVal(key, index) * (max - min + 1));
}

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

/** Tapered filled quadrilateral path from (x1,y1) [width w1] to (x2,y2) [width w2].
 *  Sides are gently curved outward using quadratic bezier for an organic look. */
/** curveBias: lateral offset (SVG units) at midpoint — positive bends toward the perpendicular,
 *  negative away. Creates gently curved organic branches instead of straight ones. */
function taperedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w1: number,
  w2: number,
  curveBias = 0,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return "";

  const px = -dy / len; // unit perpendicular x
  const py = dx / len; // unit perpendicular y

  const ax = x1 + px * w1;
  const ay = y1 + py * w1;
  const bx = x1 - px * w1;
  const by = y1 - py * w1;
  const cx = x2 + px * w2;
  const cy = y2 + py * w2;
  const dx2 = x2 - px * w2;
  const dy2 = y2 - py * w2;

  // Shift the midpoint laterally by curveBias to curve the branch centreline
  const mx = (x1 + x2) / 2 + px * curveBias;
  const my = (y1 + y2) / 2 + py * curveBias;
  const cp1x = mx + px * (w1 * 0.85);
  const cp1y = my + py * (w1 * 0.85);
  const cp2x = mx - px * (w1 * 0.85);
  const cp2y = my - py * (w1 * 0.85);

  return `M ${r(ax)} ${r(ay)} Q ${r(cp1x)} ${r(cp1y)} ${r(cx)} ${r(cy)} L ${r(dx2)} ${r(dy2)} Q ${r(cp2x)} ${r(cp2y)} ${r(bx)} ${r(by)} Z`;
}

/** Quadratic bezier point at parameter t. */
function qbez(p0: number, p1: number, p2: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

/** Find the x position on the curved trunk centreline at height fraction t (0=base, 1=top). */
function trunkCentreX(
  t: number,
  baseX: number,
  cpX: number,
  topX: number,
): number {
  return qbez(baseX, cpX, topX, t);
}

/** Ancestor IDs for pruning propagation: "L0-a-b" → ["L0", "L0-a"]. */
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

// ─── Leaf Generation ──────────────────────────────────────────────────────────

function generateLeaves(
  branchId: string,
  tipX: number,
  tipY: number,
  progress: number,
  depth: number,
  spec: SpeciesConfig,
  treeId: string,
  sizeMultiplier = 1.0,
): Leaf[] {
  const [minL, maxL] = spec.leavesPerCluster;
  const count = seededInt(branchId + treeId, 77, minL, maxL);
  const leaves: Leaf[] = [];
  const size = spec.leafSize * progress * sizeMultiplier;

  if (spec.leafShape === "needle") {
    // Radiate needles evenly around the tip with a small jitter
    for (let i = 0; i < count; i++) {
      const baseDeg = (i / count) * 360;
      const jitter = (seededVal(branchId + treeId, i + 200) - 0.5) * 18;
      leaves.push({
        id: `${branchId}-${i}`,
        cx: tipX,
        cy: tipY,
        rx: 0.4, // very thin
        ry: size,
        angleDeg: baseDeg + jitter,
      });
    }
  } else if (spec.leafShape === "scale") {
    // Dense tiny scales clustered tightly around the tip
    const spread = 4 + depth * 0.5;
    for (let i = 0; i < count; i++) {
      const angle = seededVal(branchId + treeId, i * 2 + 50) * Math.PI * 2;
      const dist = seededVal(branchId + treeId, i * 2 + 51) * spread;
      leaves.push({
        id: `${branchId}-${i}`,
        cx: tipX + Math.cos(angle) * dist,
        cy: tipY + Math.sin(angle) * dist,
        rx: size * 0.7,
        ry: size * 0.7,
        angleDeg: seededVal(branchId + treeId, i + 300) * 360,
      });
    }
  } else {
    // oval, palmate, lobed — individual leaves scattered around the tip
    const spread = 5 + spec.leafSize * 0.5;
    for (let i = 0; i < count; i++) {
      const angle = seededVal(branchId + treeId, i * 3 + 10) * Math.PI * 2;
      const dist = seededVal(branchId + treeId, i * 3 + 11) * spread;
      const tilt = seededVal(branchId + treeId, i * 3 + 12) * 360;
      leaves.push({
        id: `${branchId}-${i}`,
        cx: tipX + Math.cos(angle) * dist,
        cy: tipY + Math.sin(angle) * dist,
        rx: size,
        ry: size * (spec.leafShape === "oval" ? 0.6 : 1.0),
        angleDeg: tilt,
      });
    }
  }

  return leaves;
}

// ─── Branch Spec ─────────────────────────────────────────────────────────────

interface BranchSpec {
  id: string;
  appearsAtDay: number;
  x1: number;
  y1: number;
  fulltipX: number;
  fulltipY: number; // position at full growth (for child attachment)
  angle: number;
  maxLength: number;
  baseWidth: number;
  tipWidth: number;
  depth: number;
  /** Lateral midpoint offset for taperedPath — gives each branch its own gentle curve. */
  curveBias: number;
}

function buildBranchTree(
  id: string,
  x1: number,
  y1: number,
  angle: number,
  maxLength: number,
  appearsAtDay: number,
  depth: number,
  baseWidth: number,
  spec: SpeciesConfig,
  day: number,
  treeId: string,
  out: BranchSpec[],
): void {
  const tipWidth = Math.max(baseWidth * 0.25, 0.4);
  const fulltipX = x1 + Math.cos(angle) * maxLength;
  const fulltipY = y1 + Math.sin(angle) * maxLength;
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
    angle,
    maxLength,
    baseWidth,
    tipWidth,
    depth,
    curveBias,
  });

  if (depth >= MAX_DEPTH) return;

  const childDay = appearsAtDay + SPLIT_DELAY;
  if (day < childDay) return;

  // Per-branch random divergence variation (±15% around species default)
  const divergeVar =
    spec.splitDiverge * (1.0 + (seededVal(id + treeId, 88) - 0.5) * 0.3);
  const childLength = maxLength * (0.55 + seededVal(id + treeId, 89) * 0.12);
  const childBaseWidth = tipWidth * 1.5;

  buildBranchTree(
    `${id}-a`,
    fulltipX,
    fulltipY,
    angle - divergeVar,
    childLength,
    childDay,
    depth + 1,
    childBaseWidth,
    spec,
    day,
    treeId,
    out,
  );
  buildBranchTree(
    `${id}-b`,
    fulltipX,
    fulltipY,
    angle + divergeVar,
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

// ─── Main Generator ───────────────────────────────────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: procedural SVG tree generation is inherently complex
export function generateTree(
  activeDaysCount: number,
  spec: SpeciesConfig,
  prunedBranches: PrunedBranch[],
  treeId: string,
): TreeSVGData {
  const trunkBaseX = VIEWBOX_WIDTH / 2;
  const trunkBaseY = VIEWBOX_HEIGHT - 30;
  const prunedMap = new Map(prunedBranches.map((p) => [p.branchId, p]));

  // ─── Trunk ────────────────────────────────────────────────────────────────

  // Per-tree growth rate variation (±15%) for visual uniqueness between same-species trees
  const growthRate = 5.5 * (0.88 + seededVal(treeId, 3) * 0.24);
  // Smooth asymptotic approach to maxTrunkHeight — growth slows naturally near the limit
  const rawGrowth =
    activeDaysCount > 0 ? activeDaysCount ** 0.72 * growthRate : 0;
  const maxH = spec.maxTrunkHeight;
  const trunkHeight = maxH > 0 ? (maxH * rawGrowth) / (maxH + rawGrowth) : 0;
  const trunkTopY = trunkBaseY - trunkHeight;

  const trunkBaseW = Math.min(14, 2 + activeDaysCount * 0.12);
  const trunkTopW = trunkBaseW * 0.28;

  // Per-tree curvature direction: 50% left, 50% right, based on tree ID
  const curveDir = seededVal(treeId, 0) > 0.5 ? 1 : -1;
  // Per-tree curvature variation (±30%) — makes each individual tree look distinct
  const curveMag = spec.trunkCurvature * (0.75 + seededVal(treeId, 1) * 0.5);
  const curveOffset = curveMag * trunkHeight * 0.4 * curveDir;

  // Trunk centreline: quadratic bezier P0 (base) → P1 (control) → P2 (top)
  const trunkCpX = trunkBaseX + curveOffset * 0.65;
  const trunkCpY = trunkBaseY - trunkHeight * 0.45;
  const trunkTopX = trunkBaseX + curveOffset;

  // Trunk shape: two bezier edges (left and right) sharing the same curvature
  const midW = (trunkBaseW + trunkTopW) / 4;

  const lP0x = trunkBaseX - trunkBaseW / 2;
  const lP0y = trunkBaseY;
  const lP1x = trunkCpX - midW;
  const lP1y = trunkCpY;
  const lP2x = trunkTopX - trunkTopW / 2;
  const lP2y = trunkTopY;

  const rP0x = trunkBaseX + trunkBaseW / 2;
  const rP0y = trunkBaseY;
  const rP1x = trunkCpX + midW;
  const rP1y = trunkCpY;
  const rP2x = trunkTopX + trunkTopW / 2;
  const rP2y = trunkTopY;

  const trunkPathData =
    trunkHeight > 0
      ? `M ${r(lP0x)} ${r(lP0y)} Q ${r(lP1x)} ${r(lP1y)} ${r(lP2x)} ${r(lP2y)} ` +
        `L ${r(rP2x)} ${r(rP2y)} Q ${r(rP1x)} ${r(rP1y)} ${r(rP0x)} ${r(rP0y)} Z`
      : "";

  // ─── Branch Specs ─────────────────────────────────────────────────────────

  const allSpecs: BranchSpec[] = [];
  // Total number of individual branches (no longer generated in symmetric pairs).
  // Branches alternate L/R loosely; each has its own seeded appearance day.
  const maxBranches = spec.maxBranchPairs * 2;

  // Reserve headroom above the topmost branch ≈ one full top-branch length above.
  const finalTopBranchLen = Math.max(12, 34 - (spec.maxBranchPairs - 1) * 3);
  const maxAttachFrac =
    trunkHeight > 0
      ? Math.max(
          0.55,
          Math.min(0.82, 1 - (finalTopBranchLen * 1.4) / trunkHeight),
        )
      : 0.68;
  const branchSpan = Math.max(0.05, maxAttachFrac - 0.5);
  const maxSlots = Math.max(maxBranches - 1, 1);

  for (let branchIdx = 0; branchIdx < maxBranches; branchIdx++) {
    // Alternate L/R but give each branch its own seeded timing jitter
    const side = branchIdx % 2 === 0 ? "L" : "R";
    const sideIdx = Math.floor(branchIdx / 2); // 0-based index within each side
    const id = `${side}${sideIdx}`;

    // Independent appearance day with ±70% of branchFrequency jitter
    const baseDay = (sideIdx + 1) * spec.branchFrequency;
    const jitter =
      (seededVal(`${id}t${treeId}`, 0) - 0.5) * spec.branchFrequency * 0.7;
    const appearsAtDay = Math.max(1, Math.round(baseDay + jitter));
    if (activeDaysCount < appearsAtDay) continue;

    // Height fraction: distribute across the trunk with extra per-branch randomness
    const baseFrac = 0.5 + (branchIdx / maxSlots) * branchSpan;
    const attachFraction =
      baseFrac + (seededVal(`p${branchIdx}${treeId}`, 0) - 0.5) * 0.12;
    const heightFromBase = trunkHeight * Math.max(attachFraction, 0.28);

    // Position on the curved trunk centreline
    const t = trunkHeight > 0 ? Math.min(heightFromBase / trunkHeight, 1) : 0;
    const attachX = trunkCentreX(t, trunkBaseX, trunkCpX, trunkTopX);
    const attachY = trunkBaseY - heightFromBase;

    // Angle: lower branches more horizontal/drooping, upper more ascending
    const midBranch = maxBranches / 2;
    const droop = (midBranch - branchIdx) * spec.branchAngleDroop * 0.5;
    // Extra per-branch angle randomness (±10°)
    const angleVar = (seededVal(`pa${branchIdx}${treeId}`, 0) - 0.5) * 0.18;
    const effectiveBase = spec.branchAngleBase - droop + angleVar;

    const angle = side === "L" ? -(Math.PI - effectiveBase) : -effectiveBase;

    // Thickness: based on trunk width at the attachment point — upper/shorter
    // branches are naturally thinner since the trunk has tapered by then.
    const attachTrunkW = lerp(trunkBaseW, trunkTopW, t);
    const primaryBaseW = Math.max(
      0.5,
      attachTrunkW * spec.branchThicknessFactor,
    );

    // Length: lower/older branches longer; add per-branch variation (±20%)
    const lengthBase = 34 - sideIdx * 3;
    const lengthVar = (seededVal(`pl${branchIdx}${treeId}`, 0) - 0.5) * 8;
    const primaryLength = Math.max(10, lengthBase + lengthVar);

    buildBranchTree(
      id,
      attachX,
      attachY,
      angle,
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

  // ─── Apex Branches ────────────────────────────────────────────────────────
  // A pair of upward-forking branches from the trunk tip crowns the tree.
  // Using the full sub-branch pipeline means they gain the same foliage
  // density as lateral branches, and their terminal tips extend visibly
  // above the topmost lateral pair — resolving the stubby-apex look.
  if (trunkHeight > 0 && activeDaysCount >= spec.branchFrequency) {
    const apexAppearsAtDay = spec.branchFrequency;
    const apexLength = Math.max(8, finalTopBranchLen * 0.7);
    const apexBaseWidth = Math.max(0.6, trunkTopW * 1.4);
    const apexHalfSpread = spec.splitDiverge * 0.8;

    for (const [apexId, sign] of [
      ["apex-L", -1],
      ["apex-R", 1],
    ] as [string, number][]) {
      buildBranchTree(
        apexId,
        trunkTopX,
        trunkTopY,
        -(Math.PI / 2) + sign * apexHalfSpread,
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
    const x2 = s.x1 + Math.cos(s.angle) * currentLen;
    const y2 = s.y1 + Math.sin(s.angle) * currentLen;
    const currentTipW = lerp(s.baseWidth, s.tipWidth, effectiveProg);

    const path = taperedPath(
      s.x1,
      s.y1,
      x2,
      y2,
      s.baseWidth,
      currentTipW,
      s.curveBias,
    );

    const isTerminal = !(
      visibleIds.has(`${s.id}-a`) || visibleIds.has(`${s.id}-b`)
    );

    // Tip leaves — always at the terminal point when the branch is a terminal
    const leaves: Leaf[] =
      isTerminal && effectiveProg > 0.3
        ? generateLeaves(s.id, x2, y2, effectiveProg, s.depth, spec, treeId)
        : [];

    // Interior leaf clusters along the branch for species like pine / juniper
    if (spec.leavesAlongBranch && effectiveProg > 0.4 && currentLen > 8) {
      const interiorCount = Math.min(3, Math.floor(currentLen / 10));
      for (let k = 1; k <= interiorCount; k++) {
        const frac = k / (interiorCount + 1);
        const ix = s.x1 + Math.cos(s.angle) * currentLen * frac;
        const iy = s.y1 + Math.sin(s.angle) * currentLen * frac;
        const interior = generateLeaves(
          `${s.id}-int-${k}`,
          ix,
          iy,
          effectiveProg * 0.75,
          s.depth,
          spec,
          treeId,
          0.65,
        );
        leaves.push(...interior);
      }
    }

    rendered.push({
      id: s.id,
      x1: s.x1,
      y1: s.y1,
      x2,
      y2,
      pathData: path,
      depth: s.depth,
      leaves,
      isPruned: false,
      isTerminal,
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
      leaves: [],
      isPruned: true,
      isTerminal: false,
    });
  }

  // ─── Apex Leaves ──────────────────────────────────────────────────────────
  // Treat the trunk tip as a terminal point — foliage appears there once the
  // trunk has had a few days to establish, growing in density over ~6 days.
  const apexProgress = Math.min(activeDaysCount / 6, 1);
  const apexLeaves =
    activeDaysCount > 0 && trunkHeight > 0
      ? generateLeaves(
          "apex",
          trunkTopX,
          trunkTopY,
          apexProgress,
          0,
          spec,
          treeId,
        )
      : [];

  return {
    viewBox: `0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`,
    trunkX: trunkBaseX,
    trunkBaseY,
    trunkTopY,
    trunkTopX,
    trunkPathData,
    branches: rendered,
    apexLeaves,
  };
}
