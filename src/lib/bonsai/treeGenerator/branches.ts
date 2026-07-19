import type { PrunedBranch } from "../schema";
import type { SpeciesConfig } from "../speciesConfig";
import { seededVal } from "../treeGenerator.math";
import type { BranchSpec } from "../treeGenerator.types";

const SPLIT_DELAY = 7; // days from parent appearing to children appearing
export const BRANCH_GROW_DURATION = 6; // days from first appearance to full length

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

export function isSelfPruned(
  id: string,
  prunedMap: Map<string, PrunedBranch>,
  day: number,
  regrowth: number,
): boolean {
  const e = prunedMap.get(id);
  return !!e && day < e.prunedAtDay + regrowth;
}

export function isAncestorPruned(
  id: string,
  prunedMap: Map<string, PrunedBranch>,
  day: number,
  regrowth: number,
): boolean {
  return buildAncestors(id).some((a) =>
    isSelfPruned(a, prunedMap, day, regrowth),
  );
}

export function growProgress(appearsAt: number, day: number): number {
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
export function computeBranchHeights(
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
export function effectiveRegrowthProgress(
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

export function buildBranchTree(
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
