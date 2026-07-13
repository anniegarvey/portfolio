// ─── Leaf Shape ───────────────────────────────────────────────────────────────

export type LeafShape =
  | "needle"
  | "oval"
  | "palmate"
  | "lobed"
  | "scale"
  | "pinnate";

// ─── Phyllotaxy ───────────────────────────────────────────────────────────────
// Arrangement of leaves (and, by extension, buds/branches) along a stem.
// Used to drive primary-branch emergence patterns and terminal leaf layout.

export type Phyllotaxy = "opposite" | "alternate" | "whorled";

// ─── Foliage Distribution ─────────────────────────────────────────────────────
// How the crown is packed with leaves. Each mode produces foliage "pads" — discs
// of leaves with a per-leaf z offset so the renderer can globally depth-sort them.
//   terminal  — one pad at each terminal tip (open canopies — cherry, oak)
//   pad       — terminal pads + interior pads on near-tip branches; fills the
//               middle of dense canopies (pine, maple, juniper, flame tree)
//   scattered — pads scattered along the branch length, biased toward tips
//   pendent   — terminal pad + hanging chains of pads below the tip (wisteria)

export type FoliageDistribution = "terminal" | "pad" | "scattered" | "pendent";

// ─── Flower Spec ──────────────────────────────────────────────────────────────

export type FlowerShape = "raceme" | "cluster" | "catkin" | "berry";

export interface FlowerSpec {
  /** activeDaysCount at which flowers first appear. */
  floweringAge: number;
  flowerShape: FlowerShape;
  /** Primary flower colour. */
  flowerColor: string;
  /** Accent colour — used for the streaked fifth petal on flame tree, catkin bumps on oak, etc. */
  flowerColorAccent?: string;
  /** Base size of an individual floret / berry in SVG units. */
  flowerSize: number;
  /** Wisteria only — length of the hanging raceme stem in SVG units. */
  racemeLength?: number;
}

// ─── Species Config ───────────────────────────────────────────────────────────

export interface SpeciesConfig {
  // Display
  label: string;
  emoji: string;
  foliageColor: string;
  foliageColorLight: string;
  trunkColor: string;

  // Gameplay
  regrowthDays: number;

  // Trunk
  maxTrunkHeight: number;
  /** 0 = perfectly straight; higher values produce a more bent trunk.
   *  Curvature direction (left/right) is randomised per individual tree. */
  trunkCurvature: number;
  /** Exponent controlling the trunk taper profile. 1 = linear; >1 = concave
   *  (base flares outward, slim above); <1 = convex. Typical 1.1–1.5. */
  trunkTaperPower: number;
  /** 0–1 — roughness/irregularity of the trunk silhouette. 0 = perfectly smooth
   *  bezier; higher values add deterministic bark/shari texture to the outline. */
  trunkJaggedness: number;
  /** 0–1+ — additional basal flare (nebari) as a fraction of base trunk width.
   *  0 = no flare; 0.5 = base ~50% wider than a straight taper would give. */
  nebariSpread: number;
  /** Multiplier on the age-driven trunk base width (see `computeTrunkBaseWidth`
   *  in treeGenerator.ts). 1 = species-neutral; >1 for naturally massive
   *  trunks (oak), <1 for slender ones (wisteria). */
  trunkWidthFactor: number;

  // Branches
  /** Angle above horizontal for a mid-height primary branch (radians, positive = above horizontal).
   *  Negative values produce drooping/cascade branches. */
  branchAngleBase: number;
  /** Total angle ramp (radians) from bottom branch to top branch.
   *  Positive → upper branches more vertical; negative → upper branches droop less (cascade). */
  branchAngleRamp: number;
  /** Height of the first (lowest) branch as a fraction of trunk height. ~0.28–0.33 for upright;
   *  0.58–0.68 for cascade/semi-cascade styles where branches cluster near the top. */
  firstBranchFrac: number;
  /** Days between new primary branches appearing. Lower = faster growing species. */
  branchFrequency: number;
  /** Maximum number of primary branches (each is a single branch, not a pair). */
  maxBranchPairs: number;
  /** Angle divergence (radians) when a branch forks into two children. */
  splitDiverge: number;
  /** Length of the lowest primary branch as a fraction of the tree's CURRENT
   *  trunk height, before child branches extend the reach. Higher = broader
   *  crown spread relative to trunk height. */
  crownSpreadFactor: number;
  /** Base thickness of primary branches as a fraction of trunk width at the attachment point. */
  branchThicknessFactor: number;
  /** Max lateral midpoint offset (SVG units) applied randomly per branch for natural curvature. */
  branchCurvature: number;
  /** Phyllotaxy — controls primary-branch emergence pattern around the trunk. */
  phyllotaxy: Phyllotaxy;
  /** When `phyllotaxy === "whorled"`, number of branches per whorl node.
   *  Ignored for opposite/alternate species. */
  whorlSize?: number;
  /** Maximum branching depth (0 = primary only). Deeper values produce finer
   *  ramification at the cost of more branches to render. */
  maxDepth: number;
  /** Number of child branches produced when a parent forks, indexed by parent depth.
   *  e.g. [3, 2, 2] = primary forks 3 ways, secondaries fork 2 ways, tertiaries fork 2 ways. */
  childCountByDepth: number[];
  /** 0–1 — strength of apical dominance. 1 = strong leader species with a
   *  markedly thicker/longer apex; 0 = weak apex (cascade / vase-shaped). */
  apicalDominance: number;
  /** 0–1+ — random per-branch angle deviation added along the branch length,
   *  producing kinks/wander. 0 = perfectly straight branches. */
  branchWander: number;
  /** Radians — range of yaw angles (around trunk vertical axis) across which
   *  primary branches can emerge. PI*2 = full 360° sweep; smaller = one-sided
   *  crown (e.g. cascade junipers lean toward a viewing side). */
  azimuthSpread: number;
  /** 0–1 — crown depth along the viewer's z-axis. 0 = flat 2D silhouette;
   *  1 = roughly spherical crown. Drives depth-sort and atmospheric-tint magnitude. */
  crownDepthFactor: number;
  /** Tip behaviour for final-depth twigs. Twigs bend by `(π/2)·tipDroop` over
   *  their last 30% of length. Negative = weeping (wisteria, flame tree);
   *  0 = horizontal; positive = upturn (pine candles). |tipDroop| ≤ 1 keeps
   *  the bend bounded to a quarter-turn. */
  tipDroop: number;

  // Leaves
  leafShape: LeafShape;
  /** Base size in SVG viewbox units. Interpretation varies by leafShape:
   *  needle = half-length of needle; oval = half-width; palmate/lobed/pinnate = overall scale; scale = radius. */
  leafSize: number;
  /** Where leaves cluster in the crown — see `FoliageDistribution` doc. */
  foliageDistribution: FoliageDistribution;
  /** SVG units — radius of a single foliage pad disc. Larger = more spread-out
   *  pads that overlap their neighbours and the trunk. */
  padRadius: number;
  /** 0–1 — for `foliageDistribution === "pad"`: probability that a near-tip
   *  non-terminal branch gets an extra interior pad. Fills the bare crown
   *  centre. Ignored by `terminal`. */
  interiorPadDensity: number;
  /** [min, max] — leaves placed within each pad disc. */
  leavesPerPad: [number, number];

  // Per-individual variability
  /** 0–1 — scale of per-tree parameter scatter applied to any randomised
   *  visual (trunk angle, branch spacing, leaf count). Higher values produce
   *  more visible individuality across trees of the same species. */
  individualVariability: number;

  // Flowers
  /** Omit for species with no ornamental flowers (pine). */
  flowers?: FlowerSpec;
}

import type { SpeciesId } from "./schema";

export const SPECIES_CONFIG: Record<SpeciesId, SpeciesConfig> = {
  pine: {
    // Pinus thunbergii — Japanese Black Pine. Slow grower; formal/informal upright.
    // Classic conical silhouette: nearly horizontal base branches, increasingly upright toward apex.
    label: "Pine",
    emoji: "🌲",
    foliageColor: "#1e5c1e",
    foliageColorLight: "#2d7a2d",
    trunkColor: "#4a3018",
    regrowthDays: 14,
    maxTrunkHeight: 155,
    trunkCurvature: 0.22,
    trunkTaperPower: 1.4,
    trunkJaggedness: 0.2,
    nebariSpread: 0.4,
    trunkWidthFactor: 1.1,
    branchAngleBase: 0.35,
    branchAngleRamp: 0.45,
    firstBranchFrac: 0.28,
    branchFrequency: 6,
    maxBranchPairs: 7,
    splitDiverge: 0.28,
    crownSpreadFactor: 0.27,
    branchThicknessFactor: 0.4,
    branchCurvature: 1.5,
    // Whorled growth — new buds emerge in evenly spaced rings (nodes) up the trunk.
    phyllotaxy: "whorled",
    whorlSize: 5,
    maxDepth: 3,
    childCountByDepth: [3, 2, 2],
    apicalDominance: 0.8,
    branchWander: 0.15,
    azimuthSpread: Math.PI * 2,
    crownDepthFactor: 0.7,
    // Pine candles flick upward at the tip — characteristic conifer growth.
    tipDroop: 0.3,
    leafShape: "needle",
    leafSize: 7.5,
    foliageDistribution: "pad",
    padRadius: 10,
    interiorPadDensity: 0.7,
    leavesPerPad: [10, 14],
    individualVariability: 0.2,
    // Pine has no ornamental flowers — only inconspicuous pollen cones.
  },
  maple: {
    // Acer palmatum — Japanese Maple. Moderate-fast; informal upright, vase-shaped crown.
    label: "Maple",
    emoji: "🍁",
    foliageColor: "#c0392b",
    foliageColorLight: "#e74c3c",
    trunkColor: "#7d5a3c",
    regrowthDays: 12,
    maxTrunkHeight: 150,
    trunkCurvature: 0.45,
    trunkTaperPower: 1.3,
    trunkJaggedness: 0.3,
    nebariSpread: 0.5,
    trunkWidthFactor: 1.0,
    branchAngleBase: 0.62,
    branchAngleRamp: 0.2,
    firstBranchFrac: 0.32,
    branchFrequency: 3,
    maxBranchPairs: 6,
    splitDiverge: 0.42,
    crownSpreadFactor: 0.36,
    branchThicknessFactor: 0.46,
    branchCurvature: 3.5,
    // Opposite buds — pairs of branches emerge at each node, alternating 90° between nodes.
    phyllotaxy: "opposite",
    maxDepth: 3,
    childCountByDepth: [2, 2, 2],
    apicalDominance: 0.4,
    branchWander: 0.4,
    azimuthSpread: Math.PI * 2,
    crownDepthFactor: 0.8,
    tipDroop: 0,
    leafShape: "palmate",
    leafSize: 5.0,
    foliageDistribution: "pad",
    padRadius: 8,
    interiorPadDensity: 0.4,
    leavesPerPad: [6, 10],
    individualVariability: 0.3,
    flowers: {
      // Small reddish-purple hanging umbel clusters, appear with the new spring leaves.
      floweringAge: 35,
      flowerShape: "cluster",
      flowerColor: "#a0375a",
      flowerSize: 0.5,
    },
  },
  "cherry-blossom": {
    // Prunus serrulata — Japanese Flowering Cherry. Moderate; spreading informal upright.
    label: "Cherry Blossom",
    emoji: "🌸",
    foliageColor: "#e8a0bf",
    foliageColorLight: "#f4c2d8",
    trunkColor: "#9b7355",
    regrowthDays: 10,
    maxTrunkHeight: 140,
    trunkCurvature: 0.3,
    trunkTaperPower: 1.2,
    trunkJaggedness: 0.15,
    nebariSpread: 0.35,
    trunkWidthFactor: 0.95,
    branchAngleBase: 0.5,
    branchAngleRamp: 0.18,
    firstBranchFrac: 0.3,
    branchFrequency: 4,
    maxBranchPairs: 6,
    splitDiverge: 0.35,
    crownSpreadFactor: 0.33,
    branchThicknessFactor: 0.38,
    branchCurvature: 2.5,
    // Alternate buds along the stem — spiral arrangement with ~137° phyllotactic offset.
    phyllotaxy: "alternate",
    maxDepth: 3,
    // Depth-3 single-child entry continues a final twig without re-forking,
    // adding visible finer ramification without doubling terminal count.
    childCountByDepth: [2, 2, 1],
    apicalDominance: 0.6,
    branchWander: 0.2,
    azimuthSpread: Math.PI * 2,
    crownDepthFactor: 0.7,
    // Slight upturn at the cherry's twig tips — keeps the canopy from feeling
    // flat without making it look like a weeping cultivar.
    tipDroop: 0.1,
    leafShape: "oval",
    leafSize: 4.5,
    foliageDistribution: "terminal",
    padRadius: 5,
    interiorPadDensity: 0.2,
    leavesPerPad: [4, 7],
    individualVariability: 0.25,
    flowers: {
      // Iconic 5-petal blossoms in clusters; pale pink to white. Appear with leaves.
      floweringAge: 15,
      flowerShape: "cluster",
      flowerColor: "#f5d0e0",
      flowerColorAccent: "#e8a0bf",
      flowerSize: 3.5,
    },
  },
  juniper: {
    // Juniperus — dramatic cascade/semi-cascade. Branches cluster in upper trunk, cascade down.
    label: "Juniper",
    emoji: "🌿",
    foliageColor: "#2d6b3a",
    foliageColorLight: "#3d8b4a",
    trunkColor: "#3a2010",
    regrowthDays: 16,
    // Cascade bonsai are short-trunked — the visual mass hangs below/beside
    // the trunk rather than stacking above it.
    maxTrunkHeight: 90,
    trunkCurvature: 0.65,
    trunkTaperPower: 1.5,
    trunkJaggedness: 0.7,
    nebariSpread: 0.8,
    trunkWidthFactor: 1.15,
    branchAngleBase: -0.2,
    branchAngleRamp: -0.1,
    firstBranchFrac: 0.62,
    branchFrequency: 5,
    maxBranchPairs: 8,
    splitDiverge: 0.22,
    crownSpreadFactor: 0.34,
    branchThicknessFactor: 0.5,
    branchCurvature: 5.0,
    // Whorled scale foliage in 3-leaf rings on adult growth.
    phyllotaxy: "whorled",
    whorlSize: 3,
    maxDepth: 3,
    childCountByDepth: [3, 2, 2],
    apicalDominance: 0.2,
    branchWander: 0.7,
    // Cascade junipers are typically displayed from a single viewing side — narrow the yaw sweep.
    azimuthSpread: Math.PI * 1.6,
    crownDepthFactor: 0.5,
    // Juniper foliage pads spread laterally — twigs read horizontal, not bent.
    tipDroop: 0,
    leafShape: "scale",
    leafSize: 2.0,
    foliageDistribution: "pad",
    padRadius: 14,
    interiorPadDensity: 0.8,
    leavesPerPad: [18, 26],
    individualVariability: 0.4,
    flowers: {
      // Waxy blue-black seed cones (berry-like); ornamental once mature.
      floweringAge: 30,
      flowerShape: "berry",
      flowerColor: "#2e2450",
      flowerColorAccent: "#8878c0",
      flowerSize: 2.2,
    },
  },
  oak: {
    // Quercus robur — slow, broad-spreading crown with heavy branches.
    label: "Oak",
    emoji: "🌳",
    foliageColor: "#3a6b2a",
    foliageColorLight: "#4a8b3a",
    trunkColor: "#5a3c1c",
    regrowthDays: 18,
    maxTrunkHeight: 158,
    trunkCurvature: 0.18,
    trunkTaperPower: 1.5,
    trunkJaggedness: 0.5,
    nebariSpread: 0.6,
    trunkWidthFactor: 1.25,
    branchAngleBase: 0.42,
    branchAngleRamp: 0.28,
    firstBranchFrac: 0.3,
    branchFrequency: 7,
    maxBranchPairs: 6,
    splitDiverge: 0.45,
    crownSpreadFactor: 0.35,
    branchThicknessFactor: 0.42,
    branchCurvature: 2.0,
    phyllotaxy: "alternate",
    // Phase-9 bump from 2 → 3: oak's three-way crown scaffolds split once
    // more into finer twigs at depth 3 (the [2, 3, 2] entry was already in
    // place from the §4 design but was unused at maxDepth 2).
    maxDepth: 3,
    childCountByDepth: [2, 3, 2],
    apicalDominance: 0.7,
    branchWander: 0.25,
    azimuthSpread: Math.PI * 2,
    crownDepthFactor: 0.9,
    tipDroop: 0,
    leafShape: "lobed",
    leafSize: 6.0,
    foliageDistribution: "terminal",
    padRadius: 6,
    interiorPadDensity: 0.2,
    leavesPerPad: [4, 6],
    individualVariability: 0.2,
    flowers: {
      // Pendulous yellow-green catkins; rare — reflects 20–40 year real-world maturity.
      floweringAge: 90,
      flowerShape: "catkin",
      flowerColor: "#b8b040",
      flowerColorAccent: "#e8d860",
      flowerSize: 1.8,
    },
  },
  wisteria: {
    // Wisteria sinensis — fast-growing; cascade/semi-cascade. Drooping from upper trunk.
    label: "Wisteria",
    emoji: "🪻",
    foliageColor: "#4a7a32",
    foliageColorLight: "#6a9a48",
    trunkColor: "#6b5040",
    regrowthDays: 12,
    // Semi-cascade — short trunk; the draped canes carry the visual height.
    maxTrunkHeight: 88,
    trunkCurvature: 0.55,
    trunkTaperPower: 1.2,
    trunkJaggedness: 0.6,
    nebariSpread: 0.7,
    trunkWidthFactor: 0.9,
    branchAngleBase: -0.3,
    branchAngleRamp: 0.1,
    firstBranchFrac: 0.58,
    branchFrequency: 3,
    maxBranchPairs: 7,
    splitDiverge: 0.4,
    crownSpreadFactor: 0.36,
    branchThicknessFactor: 0.32,
    branchCurvature: 5.5,
    phyllotaxy: "alternate",
    // Phase-9 bump 2 → 3: gives the pendent racemes a finer attachment
    // structure so each drape hangs off a fork rather than a primary tip.
    maxDepth: 3,
    childCountByDepth: [2, 2, 1],
    apicalDominance: 0.3,
    branchWander: 0.6,
    azimuthSpread: Math.PI * 1.6,
    crownDepthFactor: 0.5,
    // Wisteria's signature weep: tips plunge nearly straight down at the
    // ends of the racemes, complementing the pendent foliage distribution.
    tipDroop: -0.9,
    leafShape: "pinnate",
    leafSize: 4.0,
    // Pendent: hanging chains of pinnate leaf clusters below each tip — the
    // defining drape of mature wisteria.
    foliageDistribution: "pendent",
    padRadius: 5,
    interiorPadDensity: 0.1,
    leavesPerPad: [3, 5],
    individualVariability: 0.35,
    flowers: {
      // Drooping violet racemes, 20–30 cm in nature — the defining visual of wisteria bonsai.
      floweringAge: 55,
      flowerShape: "raceme",
      flowerColor: "#8b60c8",
      flowerColorAccent: "#c8a0f0",
      flowerSize: 2.0,
      racemeLength: 28,
    },
  },
  "flame-tree": {
    // Delonix regia — fast-growing; flat umbrella crown. Branches nearly horizontal at all heights.
    label: "Flame Tree",
    emoji: "🌺",
    foliageColor: "#e74c3c",
    foliageColorLight: "#ff6b47",
    trunkColor: "#3d2610",
    regrowthDays: 14,
    maxTrunkHeight: 165,
    trunkCurvature: 0.12,
    trunkTaperPower: 1.1,
    trunkJaggedness: 0.15,
    nebariSpread: 0.3,
    trunkWidthFactor: 1.0,
    branchAngleBase: 0.18,
    branchAngleRamp: 0.06,
    firstBranchFrac: 0.25,
    branchFrequency: 3,
    maxBranchPairs: 8,
    splitDiverge: 0.55,
    crownSpreadFactor: 0.38,
    branchThicknessFactor: 0.4,
    branchCurvature: 2.5,
    phyllotaxy: "alternate",
    maxDepth: 3,
    childCountByDepth: [2, 3, 2],
    apicalDominance: 0.2,
    branchWander: 0.15,
    azimuthSpread: Math.PI * 2,
    // Flat umbrella crown — compressed z-axis depth.
    crownDepthFactor: 0.3,
    // Mild downward tilt on tips so the umbrella canopy droops at the edges
    // rather than reading as flat-cut.
    tipDroop: -0.2,
    leafShape: "palmate",
    leafSize: 5.5,
    foliageDistribution: "pad",
    padRadius: 16,
    interiorPadDensity: 0.6,
    leavesPerPad: [6, 10],
    individualVariability: 0.15,
    flowers: {
      // Large scarlet corymbs at branch tips; vivid red-orange with a streaked accent petal.
      floweringAge: 45,
      flowerShape: "cluster",
      flowerColor: "#e8400a",
      flowerColorAccent: "#f5c030",
      flowerSize: 4.5,
    },
  },
};
