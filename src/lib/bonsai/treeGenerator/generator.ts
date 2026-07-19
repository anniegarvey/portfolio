import type { PrunedBranch } from "../schema";
import type { SpeciesConfig } from "../speciesConfig";
import {
  lerp,
  r,
  seededInt,
  seededVal,
  taperedPath,
  trunkCentreX,
} from "../treeGenerator.math";
import type {
  BranchSpec,
  Leaf,
  RenderedBranch,
  TreeSVGData,
} from "../treeGenerator.types";
import {
  buildBranchTree,
  computeBranchHeights,
  effectiveRegrowthProgress,
  growProgress,
  isAncestorPruned,
  isSelfPruned,
} from "./branches";
import { generateFlowers } from "./flowers";
import {
  applyIndividualVariability,
  computeTrunkBaseWidth,
  computeTrunkHeight,
  ivSignedScalar,
} from "./growth";
import { buildNebariPaths, buildTrunkPath } from "./trunk";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 300;
// Golden angle: 137.508° in radians. Irrational ratio ensures no azimuth repeats
// across alternate-phyllotaxy primaries, producing a natural spiral.
const GOLDEN_ANGLE = 2.399193;

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
