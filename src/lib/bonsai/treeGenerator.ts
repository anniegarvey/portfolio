import type { PrunedBranch } from "./schema";
import type { SpeciesConfig } from "./speciesConfig";
import {
  lerp,
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

/** Returns the trunk height (in SVG units) for a given tree — mirrors the
 *  growth formula inside generateTree so callers can compute glow sizes etc.
 *  without running the full generator. */
export function computeTrunkHeight(
  activeDaysCount: number,
  spec: SpeciesConfig,
  treeId: string,
): number {
  const growthRate = 5.5 * (0.88 + seededVal(treeId, 3) * 0.24);
  const rawGrowth =
    activeDaysCount > 0 ? activeDaysCount ** 0.72 * growthRate : 0;
  const maxH = spec.maxTrunkHeight;
  return maxH > 0 ? (maxH * rawGrowth) / (maxH + rawGrowth) : 0;
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
    if (!b.isPruned && b.isTerminal)
      tips.push({ id: b.id, cx: b.x2, cy: b.y2 });
  }
  tips.push({ id: "apex", cx: apexTipX, cy: apexTipY });

  return tips.map((tip) => {
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

  // 3D → 2D projection. Pitch is elevation above horizontal (SVG y-down so
  // upward = +pitch → negative dy); azimuth is yaw around the trunk axis
  // (0 = right, π/2 = toward viewer, π = left, 3π/2 = away).
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  const dx = cosPitch * Math.cos(azimuth) * length3D;
  const dy = -sinPitch * length3D;
  // Z-depth of this tip = parent tip's z + this segment's z component.
  // Cumulative (not segment-local) so a deep terminal sitting in front of
  // a forward-facing primary inherits its primary's depth — without this,
  // terminal leaves would always have small |z| and depth tinting would
  // collapse to the primaries that have no leaves on them.
  const segmentZ = cosPitch * Math.sin(azimuth) * length3D;
  const tipZ = parentTipZ + segmentZ;
  // Clamp to exactly 0 only at the trunk root + cardinal-azimuth cases to
  // keep the all-flat branch determinism property.
  const z = Math.abs(tipZ) < 1e-10 ? 0 : tipZ;

  // 2D length is the foreshortened projection — branches facing the viewer
  // shrink toward zero, branches in the picture plane keep their length.
  // The renderer uses this to draw and to lerp the growth animation.
  const projectedLength = Math.sqrt(dx * dx + dy * dy);
  const angle2D = projectedLength < 1e-9 ? 0 : Math.atan2(dy, dx);

  const fulltipX = x1 + dx;
  const fulltipY = y1 + dy;
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

  const childCount = spec.childCountByDepth[depth] ?? 2;
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
      tipZ,
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

  // Cascade species (drooping branches): cluster branches in the upper portion of the trunk.
  // Upright species: distribute from firstBranchFrac upward using the "1/3 rule".
  const isCascade = spec.branchAngleBase < -0.05;
  const maxAttachFrac = isCascade ? 0.96 : 0.9;

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
          ? (seededVal(`${id}h${treeId}`, 0) - 0.5) * trunkHeight * 0.03
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
      const angleJitter = (seededVal(`pa${id}${treeId}`, 0) - 0.5) * 0.14;
      const pitch = branchAngleBase + angleProgression + angleJitter;

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
        const azJitter = (seededVal(`az${id}${treeId}`, 0) - 0.5) * 0.3;
        azimuth = baseAzimuth + whorlRotation + azJitter;
      } else if (phyllotaxy === "opposite") {
        // Decussate: successive pairs rotate 90° (π/2). Within each pair,
        // the two branches are diametrically opposite (+ π). Per-node jitter
        // prevents every pair landing on exactly cardinal axes — without it
        // pair 1 always projects to dx = 0, foreshortening the whole pair
        // onto the trunk centreline.
        const pairBase = (nodeIdx % 2) * (Math.PI / 2);
        const pairJitter = (seededVal(`az${id}${treeId}`, 0) - 0.5) * 0.4;
        azimuth = pairBase + pairJitter + k * Math.PI;
      } else {
        // alternate — golden-angle spiral avoids azimuth repetition
        const baseAzimuth = currentPrimary * GOLDEN_ANGLE;
        const azJitter = (seededVal(`az${id}${treeId}`, 0) - 0.5) * 0.3;
        azimuth = baseAzimuth + azJitter;
      }
      azimuth += treeAzimuthOffset;

      // Thickness from trunk width at attachment — upper branches naturally thinner
      const attachTrunkW = lerp(trunkBaseW, trunkTopW, t);
      const primaryBaseW = Math.max(
        0.5,
        attachTrunkW * spec.branchThicknessFactor,
      );

      // Length: lower branches longer (wide silhouette), upper shorter
      const lengthBase = 38 - zoneFrac * 16;
      const lengthVar = (seededVal(`pl${id}${treeId}`, 0) - 0.5) * 8;
      const primaryLength = Math.max(10, lengthBase + lengthVar);

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
  // A pair of upward-forking branches from the trunk tip crowns the tree.
  // Using the full sub-branch pipeline means they gain the same foliage
  // density as lateral branches, and their terminal tips extend visibly
  // above the topmost lateral pair — resolving the stubby-apex look.
  const finalTopBranchLen = Math.max(12, 34 - (spec.maxBranchPairs - 1) * 3);
  if (
    trunkHeight > 0 &&
    activeDaysCount >= spec.branchFrequency &&
    !isCascade
  ) {
    const apexAppearsAtDay = spec.branchFrequency;
    const apexLength = Math.max(8, finalTopBranchLen * 0.7);
    const apexBaseWidth = Math.max(0.6, trunkTopW * 1.4);
    const apexHalfSpread = spec.splitDiverge * 0.8;

    // apex-L leans left (azimuth π), apex-R leans right (azimuth 0). Pitch
    // is just under π/2 so both branches lean slightly off vertical.
    const apexPitch = Math.PI / 2 - apexHalfSpread;
    for (const [apexId, apexAzimuth] of [
      ["apex-L", Math.PI],
      ["apex-R", 0],
    ] as [string, number][]) {
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
      z: s.z,
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
      z: s.z,
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
    branches: rendered,
    apexLeaves,
    flowers,
  };
}
