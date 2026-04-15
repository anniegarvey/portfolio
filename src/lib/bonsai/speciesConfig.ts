// ─── Leaf Shape ───────────────────────────────────────────────────────────────

export type LeafShape =
  | "needle"
  | "oval"
  | "palmate"
  | "lobed"
  | "scale"
  | "pinnate";

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
  /** Base thickness of primary branches as a fraction of trunk width at the attachment point. */
  branchThicknessFactor: number;
  /** Max lateral midpoint offset (SVG units) applied randomly per branch for natural curvature. */
  branchCurvature: number;

  // Leaves
  leafShape: LeafShape;
  /** [min, max] number of leaf elements per terminal cluster. */
  leavesPerCluster: [number, number];
  /** Base size in SVG viewbox units. Interpretation varies by leafShape:
   *  needle = half-length of needle; oval = half-width; palmate/lobed/pinnate = overall scale; scale = radius. */
  leafSize: number;
  /** When true, leaf clusters are also generated at intervals along the branch, not just the tip. */
  leavesAlongBranch?: boolean;

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
    branchAngleBase: 0.35,
    branchAngleRamp: 0.45,
    firstBranchFrac: 0.28,
    branchFrequency: 6,
    maxBranchPairs: 7,
    splitDiverge: 0.28,
    branchThicknessFactor: 0.4,
    branchCurvature: 1.5,
    leafShape: "needle",
    leavesPerCluster: [8, 12],
    leafSize: 7.5,
    leavesAlongBranch: true,
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
    branchAngleBase: 0.62,
    branchAngleRamp: 0.2,
    firstBranchFrac: 0.32,
    branchFrequency: 3,
    maxBranchPairs: 6,
    splitDiverge: 0.42,
    branchThicknessFactor: 0.46,
    branchCurvature: 3.5,
    leafShape: "palmate",
    leavesPerCluster: [3, 5],
    leafSize: 5.0,
    flowers: {
      // Small reddish-purple hanging umbel clusters, appear with the new spring leaves.
      floweringAge: 35,
      flowerShape: "cluster",
      flowerColor: "#a0375a",
      flowerSize: 2.2,
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
    branchAngleBase: 0.5,
    branchAngleRamp: 0.18,
    firstBranchFrac: 0.3,
    branchFrequency: 4,
    maxBranchPairs: 6,
    splitDiverge: 0.35,
    branchThicknessFactor: 0.38,
    branchCurvature: 2.5,
    leafShape: "oval",
    leavesPerCluster: [4, 6],
    leafSize: 4.5,
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
    maxTrunkHeight: 160,
    trunkCurvature: 0.65,
    branchAngleBase: -0.2,
    branchAngleRamp: -0.1,
    firstBranchFrac: 0.62,
    branchFrequency: 5,
    maxBranchPairs: 8,
    splitDiverge: 0.22,
    branchThicknessFactor: 0.5,
    branchCurvature: 5.0,
    leafShape: "scale",
    leavesPerCluster: [12, 18],
    leafSize: 2.0,
    leavesAlongBranch: true,
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
    branchAngleBase: 0.42,
    branchAngleRamp: 0.28,
    firstBranchFrac: 0.3,
    branchFrequency: 7,
    maxBranchPairs: 6,
    splitDiverge: 0.45,
    branchThicknessFactor: 0.42,
    branchCurvature: 2.0,
    leafShape: "lobed",
    leavesPerCluster: [3, 5],
    leafSize: 6.0,
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
    foliageColor: "#9b59b6",
    foliageColorLight: "#c39bd3",
    trunkColor: "#6b5040",
    regrowthDays: 12,
    maxTrunkHeight: 145,
    trunkCurvature: 0.55,
    branchAngleBase: -0.3,
    branchAngleRamp: 0.1,
    firstBranchFrac: 0.58,
    branchFrequency: 3,
    maxBranchPairs: 7,
    splitDiverge: 0.4,
    branchThicknessFactor: 0.32,
    branchCurvature: 5.5,
    leafShape: "pinnate",
    leavesPerCluster: [5, 8],
    leafSize: 4.0,
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
    branchAngleBase: 0.18,
    branchAngleRamp: 0.06,
    firstBranchFrac: 0.25,
    branchFrequency: 3,
    maxBranchPairs: 8,
    splitDiverge: 0.55,
    branchThicknessFactor: 0.4,
    branchCurvature: 2.5,
    leafShape: "palmate",
    leavesPerCluster: [4, 7],
    leafSize: 5.5,
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
