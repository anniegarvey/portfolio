import { z } from "zod";

// ─── ID Types ─────────────────────────────────────────────────────────────────

export const SpeciesIdSchema = z.enum([
  "pine",
  "maple",
  "cherry-blossom",
  "juniper",
  "oak",
  "wisteria",
  "flame-tree",
]);
export type SpeciesId = z.infer<typeof SpeciesIdSchema>;

export const ToolIdSchema = z.enum([
  "pruning-shears",
  "watering-can",
  "misting-bottle",
]);
export type ToolId = z.infer<typeof ToolIdSchema>;

export const FertiliserIdSchema = z.enum(["basic", "organic", "slow-release"]);
export type FertiliserId = z.infer<typeof FertiliserIdSchema>;

export const PotIdSchema = z.enum([
  "simple-clay",
  "glazed-ceramic",
  "stone-basin",
  "lacquered-wood",
]);
export type PotId = z.infer<typeof PotIdSchema>;

export const StandIdSchema = z.enum([
  "bamboo-mat",
  "wooden-stand",
  "carved-stone",
]);
export type StandId = z.infer<typeof StandIdSchema>;

export type ShopItemId = SpeciesId | ToolId | FertiliserId | PotId | StandId;

// ─── Pruned Branch ─────────────────────────────────────────────────────────────

export const PrunedBranchSchema = z.object({
  branchId: z.string(),
  prunedAtDay: z.number().int(),
});
export type PrunedBranch = z.infer<typeof PrunedBranchSchema>;

// ─── Garden Position ──────────────────────────────────────────────────────────

export const GardenPositionSchema = z.object({
  /** Percentage (0–100) from left edge of the garden canvas. */
  x: z.number().min(0).max(100),
  /** Percentage (0–100) from top edge of the garden canvas. */
  y: z.number().min(0).max(100),
});
export type GardenPosition = z.infer<typeof GardenPositionSchema>;

// ─── Tree ─────────────────────────────────────────────────────────────────────

export const BonsaiTreeSchema = z.object({
  id: z.string().uuid(),
  speciesId: SpeciesIdSchema,
  activeDaysCount: z.number().int().min(0),
  lastGrownDate: z.string().optional(),
  lastWateredDay: z.number().int().min(0).optional(),
  acquiredAt: z.string(),
  equippedPotId: PotIdSchema.optional(),
  equippedStandId: StandIdSchema.optional(),
  prunedBranches: z.array(PrunedBranchSchema),
  gardenPosition: GardenPositionSchema.optional(),
});
export type BonsaiTree = z.infer<typeof BonsaiTreeSchema>;

// ─── Inventory ────────────────────────────────────────────────────────────────

export const BonsaiInventorySchema = z.object({
  ownedSpeciesIds: z.array(SpeciesIdSchema),
  ownedToolIds: z.array(ToolIdSchema),
  ownedFertiliserIds: z.array(FertiliserIdSchema),
  ownedPotIds: z.array(PotIdSchema),
  ownedStandIds: z.array(StandIdSchema),
});
export type BonsaiInventory = z.infer<typeof BonsaiInventorySchema>;

// ─── Game State ───────────────────────────────────────────────────────────────

export const BonsaiGameStateSchema = z.object({
  trees: z.array(BonsaiTreeSchema),
  inventory: BonsaiInventorySchema,
  lastGrowthCheckDate: z.string().optional(),
});
export type BonsaiGameState = z.infer<typeof BonsaiGameStateSchema>;

// ─── Growth Labels ────────────────────────────────────────────────────────────

const GROWTH_LABEL_THRESHOLDS = [
  { minDays: 100, label: "Ancient Tree" },
  { minDays: 50, label: "Mature Tree" },
  { minDays: 25, label: "Young Tree" },
  { minDays: 10, label: "Sapling" },
  { minDays: 3, label: "Seedling" },
  { minDays: 0, label: "Seed" },
] as const;

export function getGrowthLabel(activeDaysCount: number): string {
  for (const { minDays, label } of GROWTH_LABEL_THRESHOLDS) {
    if (activeDaysCount >= minDays) return label;
  }
  return "Seed";
}

/** Returns [currentThreshold, nextThreshold] for a progress bar */
export function getGrowthProgress(activeDaysCount: number): {
  label: string;
  nextLabel: string | null;
  currentMin: number;
  nextMin: number | null;
} {
  // Iterate descending so the first match is the highest threshold reached.
  // i - 1 is the next (higher) threshold the tree is growing towards.
  for (let i = 0; i < GROWTH_LABEL_THRESHOLDS.length; i++) {
    if (activeDaysCount >= GROWTH_LABEL_THRESHOLDS[i].minDays) {
      const next = GROWTH_LABEL_THRESHOLDS[i - 1] ?? null;
      return {
        label: GROWTH_LABEL_THRESHOLDS[i].label,
        nextLabel: next?.label ?? null,
        currentMin: GROWTH_LABEL_THRESHOLDS[i].minDays,
        nextMin: next?.minDays ?? null,
      };
    }
  }
  return { label: "Seed", nextLabel: null, currentMin: 0, nextMin: null };
}

// ─── Species Config ───────────────────────────────────────────────────────────

export type LeafShape = "needle" | "oval" | "palmate" | "lobed" | "scale";

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
   *  needle = half-length of needle; oval = half-width; palmate/lobed = overall scale; scale = radius. */
  leafSize: number;
  /** When true, leaf clusters are also generated at intervals along the branch, not just the tip. */
  leavesAlongBranch?: boolean;
}

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
    leafShape: "oval",
    leavesPerCluster: [5, 8],
    leafSize: 4.0,
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
  },
};

// ─── Shop Catalog ─────────────────────────────────────────────────────────────

export type ShopCategory = "species" | "tool" | "fertiliser" | "pot" | "stand";

export interface ShopItem {
  id: ShopItemId;
  label: string;
  category: ShopCategory;
  cost: number;
  description: string;
}

export const SHOP_CATALOG: ShopItem[] = [
  // Species seeds
  {
    id: "pine",
    label: "Pine Seed",
    category: "species",
    cost: 50,
    description:
      "A classic bonsai. Tight, vertical growth with dark evergreen needles.",
  },
  {
    id: "maple",
    label: "Maple Seed",
    category: "species",
    cost: 75,
    description: "Brilliant red foliage and graceful spreading branches.",
  },
  {
    id: "cherry-blossom",
    label: "Cherry Blossom Seed",
    category: "species",
    cost: 90,
    description:
      "Soft pink blooms and gentle arching branches. A timeless favourite.",
  },
  {
    id: "juniper",
    label: "Juniper Seed",
    category: "species",
    cost: 60,
    description:
      "Hardy and compact, with deep green foliage and slow, deliberate growth.",
  },
  {
    id: "oak",
    label: "Oak Seed",
    category: "species",
    cost: 80,
    description: "A broad, majestic canopy with wide-spreading branches.",
  },
  {
    id: "wisteria",
    label: "Wisteria Seed",
    category: "species",
    cost: 80,
    description:
      "Cascading purple blooms on twisted, gnarled branches. Hauntingly beautiful.",
  },
  {
    id: "flame-tree",
    label: "Flame Tree Seed",
    category: "species",
    cost: 95,
    description: "Blazing red-orange canopy. A rare and dramatic showpiece.",
  },
  // Tools
  {
    id: "pruning-shears",
    label: "Pruning Shears",
    category: "tool",
    cost: 30,
    description:
      "Sharp blades for clean cuts. Improves the look of pruned branch stubs.",
  },
  {
    id: "watering-can",
    label: "Watering Can",
    category: "tool",
    cost: 20,
    description: "A fine-spout can for gentle, even watering.",
  },
  {
    id: "misting-bottle",
    label: "Misting Bottle",
    category: "tool",
    cost: 25,
    description: "Keeps foliage humid and healthy between waterings.",
  },
  // Fertiliser
  {
    id: "basic",
    label: "Basic Fertiliser",
    category: "fertiliser",
    cost: 15,
    description: "A balanced blend to keep your tree growing steadily.",
  },
  {
    id: "organic",
    label: "Organic Fertiliser",
    category: "fertiliser",
    cost: 35,
    description:
      "Slow-release nutrients from natural sources. Gentle and effective.",
  },
  {
    id: "slow-release",
    label: "Slow-Release Fertiliser",
    category: "fertiliser",
    cost: 45,
    description: "Pellets that feed your tree consistently over many weeks.",
  },
  // Pots
  {
    id: "simple-clay",
    label: "Simple Clay Pot",
    category: "pot",
    cost: 40,
    description: "An unglazed terracotta pot. Traditional and breathable.",
  },
  {
    id: "glazed-ceramic",
    label: "Glazed Ceramic Pot",
    category: "pot",
    cost: 80,
    description: "A smooth, richly coloured pot with a subtle sheen.",
  },
  {
    id: "stone-basin",
    label: "Stone Basin",
    category: "pot",
    cost: 120,
    description: "A heavy, carved stone tray for a natural, rugged aesthetic.",
  },
  {
    id: "lacquered-wood",
    label: "Lacquered Wood Pot",
    category: "pot",
    cost: 150,
    description: "A handcrafted wooden pot with a deep lacquer finish.",
  },
  // Stands
  {
    id: "bamboo-mat",
    label: "Bamboo Mat",
    category: "stand",
    cost: 30,
    description: "A woven bamboo display mat. Simple and elegant.",
  },
  {
    id: "wooden-stand",
    label: "Wooden Stand",
    category: "stand",
    cost: 60,
    description: "A raised hardwood stand that puts your tree at eye level.",
  },
  {
    id: "carved-stone",
    label: "Carved Stone Stand",
    category: "stand",
    cost: 100,
    description:
      "A sculpted stone pedestal for displaying your most prized tree.",
  },
];
