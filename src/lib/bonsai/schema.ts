import { z } from "zod";

// ─── ID Types ─────────────────────────────────────────────────────────────────

export const SpeciesIdSchema = z.enum([
  "pine",
  "maple",
  "cherry-blossom",
  "juniper",
  "oak",
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

// ─── Tree ─────────────────────────────────────────────────────────────────────

export const BonsaiTreeSchema = z.object({
  id: z.string().uuid(),
  speciesId: SpeciesIdSchema,
  activeDaysCount: z.number().int().min(0),
  lastGrownDate: z.string().optional(),
  acquiredAt: z.string(),
  equippedPotId: PotIdSchema.optional(),
  equippedStandId: StandIdSchema.optional(),
  prunedBranches: z.array(PrunedBranchSchema),
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
  activePlantedTreeId: z.string().uuid().optional(),
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
   *  Negative values produce drooping branches. */
  branchAngleBase: number;
  /** Per-pair-index droop adjustment (radians). Positive → lower branches more horizontal/drooping,
   *  upper branches more upward. Use a negative value to invert this (e.g. maple ascending). */
  branchAngleDroop: number;
  /** Days between new primary branch pairs appearing. */
  branchFrequency: number;
  /** Maximum number of primary branch pairs. */
  maxBranchPairs: number;
  /** Angle divergence (radians) when a branch forks into two children. */
  splitDiverge: number;

  // Leaves
  leafShape: LeafShape;
  /** [min, max] number of leaf elements per terminal cluster. */
  leavesPerCluster: [number, number];
  /** Base size in SVG viewbox units. Interpretation varies by leafShape:
   *  needle = half-length of needle; oval = half-width; palmate/lobed = overall scale; scale = radius. */
  leafSize: number;
}

export const SPECIES_CONFIG: Record<SpeciesId, SpeciesConfig> = {
  pine: {
    // Pinus thunbergii — Japanese Black Pine
    label: "Pine",
    emoji: "🌲",
    foliageColor: "#1e5c1e",
    foliageColorLight: "#2d7a2d",
    trunkColor: "#5a3d1e",
    regrowthDays: 14,
    maxTrunkHeight: 155,
    trunkCurvature: 0.12, // mostly straight; slight natural lean
    branchAngleBase: 0.35, // ~20° above horizontal; wide-spreading
    branchAngleDroop: 0.06, // lower branches nearly horizontal, upper ascending
    branchFrequency: 5, // whorled nodes; regular internode spacing
    maxBranchPairs: 6,
    splitDiverge: 0.28, // tight forking, stays compact
    leafShape: "needle",
    leavesPerCluster: [8, 12], // dense needle fascicles (pairs in nature, represented as cluster)
    leafSize: 7.5, // needle half-length in viewbox units
  },
  maple: {
    // Acer palmatum — Japanese Maple
    label: "Maple",
    emoji: "🍁",
    foliageColor: "#c0392b",
    foliageColorLight: "#e74c3c",
    trunkColor: "#7d5a3c",
    regrowthDays: 12,
    maxTrunkHeight: 150,
    trunkCurvature: 0.3, // distinctly curved, muscular-looking trunk
    branchAngleBase: 0.65, // ~37° above horizontal; ascending branches
    branchAngleDroop: 0.05, // gradual layering effect; upper branches more upward
    branchFrequency: 4, // relatively frequent branching
    maxBranchPairs: 5,
    splitDiverge: 0.42, // wide fork gives layered vase shape
    leafShape: "palmate",
    leavesPerCluster: [3, 5], // individual palmate leaves clearly visible
    leafSize: 5.0,
  },
  "cherry-blossom": {
    // Prunus serrulata — Japanese Flowering Cherry
    label: "Cherry Blossom",
    emoji: "🌸",
    foliageColor: "#e8a0bf",
    foliageColorLight: "#f4c2d8",
    trunkColor: "#8b6b4a",
    regrowthDays: 10,
    maxTrunkHeight: 140,
    trunkCurvature: 0.2, // gentle natural curve; relatively upright
    branchAngleBase: 0.52, // ~30° above horizontal; ascending to slightly vase-shaped
    branchAngleDroop: 0.04, // mild variation across the crown
    branchFrequency: 5,
    maxBranchPairs: 5,
    splitDiverge: 0.35,
    leafShape: "oval",
    leavesPerCluster: [4, 6], // oval-lanceolate leaves; clusters of 2–5 in nature
    leafSize: 4.5,
  },
  juniper: {
    // Juniperus procumbens / chinensis — Garden/Chinese Juniper
    label: "Juniper",
    emoji: "🌿",
    foliageColor: "#2d6b3a",
    foliageColorLight: "#3d8b4a",
    trunkColor: "#4a2e18",
    regrowthDays: 16,
    maxTrunkHeight: 160,
    trunkCurvature: 0.45, // highly dramatic curve; jin/shari deadwood character
    branchAngleBase: -0.18, // slightly below horizontal (drooping); procumbens naturally prostrate
    branchAngleDroop: 0.07, // lower branches droop significantly; tips may recurve upward
    branchFrequency: 4, // dense compact branching
    maxBranchPairs: 7,
    splitDiverge: 0.22, // tight splits; creates dense layered pads
    leafShape: "scale",
    leavesPerCluster: [12, 18], // dense scale or needle foliage; 6–8 mm per scale in nature
    leafSize: 2.0, // tiny scale-like leaves
  },
  oak: {
    // Quercus robur — English/Pedunculate Oak
    label: "Oak",
    emoji: "🌳",
    foliageColor: "#3a6b2a",
    foliageColorLight: "#4a8b3a",
    trunkColor: "#6b4a2a",
    regrowthDays: 18,
    maxTrunkHeight: 158,
    trunkCurvature: 0.08, // powerful straight trunk; excellent natural taper
    branchAngleBase: 0.45, // ~26° above horizontal; lower branches more horizontal
    branchAngleDroop: 0.07, // lower branches sweep outward, upper branches ascend
    branchFrequency: 6, // slower-growing; less frequent branching
    maxBranchPairs: 5,
    splitDiverge: 0.45, // wide-spreading; broad rounded crown
    leafShape: "lobed",
    leavesPerCluster: [3, 5], // individual lobed leaves clearly visible
    leafSize: 6.0, // 5–15 cm in nature; reduces on bonsai
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
