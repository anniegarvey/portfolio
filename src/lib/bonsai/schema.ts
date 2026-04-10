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
  "watering-can",
  "pruning-shears",
  "garden-hose",
]);
export type ToolId = z.infer<typeof ToolIdSchema>;

export const FertiliserIdSchema = z.enum([
  "growth-tonic-small",
  "growth-tonic-medium",
  "growth-tonic-large",
  "moisture-keeper-small",
  "moisture-keeper-medium",
  "moisture-keeper-large",
]);
export type FertiliserId = z.infer<typeof FertiliserIdSchema>;

export const PotIdSchema = z.enum([
  "simple-clay-small",
  "simple-clay-medium",
  "simple-clay-large",
  "glazed-ceramic-small",
  "glazed-ceramic-medium",
  "glazed-ceramic-large",
  "stone-basin-small",
  "stone-basin-medium",
  "stone-basin-large",
  "lacquered-wood-small",
  "lacquered-wood-medium",
  "lacquered-wood-large",
]);
export type PotId = z.infer<typeof PotIdSchema>;

export const StandIdSchema = z.enum([
  "bamboo-mat-small",
  "bamboo-mat-medium",
  "bamboo-mat-large",
  "wooden-stand-small",
  "wooden-stand-medium",
  "wooden-stand-large",
  "carved-stone-small",
  "carved-stone-medium",
  "carved-stone-large",
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

// ─── Active Fertilisers ───────────────────────────────────────────────────────

export const ActiveGrowthTonicSchema = z.object({
  /** activeDaysCount at which the effect expires. */
  expiresAtDay: z.number(),
  /** Extra active days added per growth tick (0.5, 1, or 2). */
  bonusPerTick: z.number(),
});
export type ActiveGrowthTonic = z.infer<typeof ActiveGrowthTonicSchema>;

export const ActiveMoistureKeeperSchema = z.object({
  /** activeDaysCount at which the effect expires. */
  expiresAtDay: z.number(),
  /** Tree grows if activeDaysCount - lastWateredDay <= retentionDays (1, 2, or 4). */
  retentionDays: z.number().int(),
});
export type ActiveMoistureKeeper = z.infer<typeof ActiveMoistureKeeperSchema>;

export const ActiveFertilisersSchema = z.object({
  growthTonic: ActiveGrowthTonicSchema.optional(),
  moistureKeeper: ActiveMoistureKeeperSchema.optional(),
});
export type ActiveFertilisers = z.infer<typeof ActiveFertilisersSchema>;

// ─── Tree ─────────────────────────────────────────────────────────────────────

export const BonsaiTreeSchema = z.object({
  id: z.string().uuid(),
  speciesId: SpeciesIdSchema,
  name: z.string().optional(),
  /** Can be fractional when growth tonic is active. */
  activeDaysCount: z.number().min(0),
  lastGrownDate: z.string().optional(),
  lastWateredDay: z.number().min(0).optional(),
  acquiredAt: z.string(),
  equippedPotId: PotIdSchema.optional(),
  equippedStandId: StandIdSchema.optional(),
  activeFertilisers: ActiveFertilisersSchema.optional(),
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

// ─── Fertiliser Effects ───────────────────────────────────────────────────────

export type FertiliserType = "growth-tonic" | "moisture-keeper";

export interface GrowthTonicEffect {
  type: "growth-tonic";
  bonusPerTick: number;
  duration: number;
}

export interface MoistureKeeperEffect {
  type: "moisture-keeper";
  retentionDays: number;
  duration: number;
}

export type FertiliserEffect = GrowthTonicEffect | MoistureKeeperEffect;

export const FERTILISER_EFFECTS: Record<FertiliserId, FertiliserEffect> = {
  "growth-tonic-small": {
    type: "growth-tonic",
    bonusPerTick: 0.5,
    duration: 7,
  },
  "growth-tonic-medium": {
    type: "growth-tonic",
    bonusPerTick: 1,
    duration: 14,
  },
  "growth-tonic-large": { type: "growth-tonic", bonusPerTick: 2, duration: 30 },
  "moisture-keeper-small": {
    type: "moisture-keeper",
    retentionDays: 1,
    duration: 7,
  },
  "moisture-keeper-medium": {
    type: "moisture-keeper",
    retentionDays: 2,
    duration: 14,
  },
  "moisture-keeper-large": {
    type: "moisture-keeper",
    retentionDays: 4,
    duration: 30,
  },
};

// ─── Pot Visual Config ────────────────────────────────────────────────────────

export type PotStyle =
  | "simple-clay"
  | "glazed-ceramic"
  | "stone-basin"
  | "lacquered-wood";
export type ItemSize = "small" | "medium" | "large";

export function parsePotId(potId: PotId): { style: PotStyle; size: ItemSize } {
  const lastDash = potId.lastIndexOf("-");
  return {
    style: potId.slice(0, lastDash) as PotStyle,
    size: potId.slice(lastDash + 1) as ItemSize,
  };
}

export type StandStyle = "bamboo-mat" | "wooden-stand" | "carved-stone";

export function parseStandId(standId: StandId): {
  style: StandStyle;
  size: ItemSize;
} {
  const lastDash = standId.lastIndexOf("-");
  return {
    style: standId.slice(0, lastDash) as StandStyle,
    size: standId.slice(lastDash + 1) as ItemSize,
  };
}

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
    id: "juniper",
    label: "Juniper Seed",
    category: "species",
    cost: 200,
    description:
      "Hardy and compact, with deep green foliage and slow, deliberate growth.",
  },
  {
    id: "maple",
    label: "Maple Seed",
    category: "species",
    cost: 500,
    description: "Brilliant red foliage and graceful spreading branches.",
  },
  {
    id: "oak",
    label: "Oak Seed",
    category: "species",
    cost: 1200,
    description: "A broad, majestic canopy with wide-spreading branches.",
  },
  {
    id: "cherry-blossom",
    label: "Cherry Blossom Seed",
    category: "species",
    cost: 2500,
    description:
      "Soft pink blooms and gentle arching branches. A timeless favourite.",
  },
  {
    id: "wisteria",
    label: "Wisteria Seed",
    category: "species",
    cost: 5000,
    description:
      "Cascading purple blooms on twisted, gnarled branches. Hauntingly beautiful.",
  },
  {
    id: "flame-tree",
    label: "Flame Tree Seed",
    category: "species",
    cost: 10000,
    description: "Blazing red-orange canopy. A rare and dramatic showpiece.",
  },
  // Tools
  {
    id: "watering-can",
    label: "Watering Can",
    category: "tool",
    cost: 30,
    description: "A fine-spout can for gentle, even watering.",
  },
  {
    id: "pruning-shears",
    label: "Pruning Shears",
    category: "tool",
    cost: 500,
    description:
      "Sharp blades for clean cuts. Shape and refine your tree once it has grown.",
  },
  {
    id: "garden-hose",
    label: "Garden Hose",
    category: "tool",
    cost: 4000,
    description:
      "Water every tree in your garden at once. A luxury for the dedicated gardener.",
  },
  // Fertiliser — Growth Tonic (60/180/480)
  {
    id: "growth-tonic-small",
    label: "Growth Tonic (Small)",
    category: "fertiliser",
    cost: 60,
    description:
      "A concentrated tonic that boosts daily growth. Lasts 7 growth days.",
  },
  {
    id: "growth-tonic-medium",
    label: "Growth Tonic (Medium)",
    category: "fertiliser",
    cost: 180,
    description: "A generous dose of growth tonic. Lasts 14 growth days.",
  },
  {
    id: "growth-tonic-large",
    label: "Growth Tonic (Large)",
    category: "fertiliser",
    cost: 480,
    description:
      "A potent growth tonic for rapid development. Lasts 30 growth days.",
  },
  // Fertiliser — Moisture Keeper (40/120/320)
  {
    id: "moisture-keeper-small",
    label: "Moisture Keeper (Small)",
    category: "fertiliser",
    cost: 40,
    description:
      "Retains moisture so a missed day doesn't stop growth. Lasts 7 growth days.",
  },
  {
    id: "moisture-keeper-medium",
    label: "Moisture Keeper (Medium)",
    category: "fertiliser",
    cost: 120,
    description:
      "Retains moisture for up to 2 days without watering. Lasts 14 growth days.",
  },
  {
    id: "moisture-keeper-large",
    label: "Moisture Keeper (Large)",
    category: "fertiliser",
    cost: 320,
    description:
      "Retains moisture for up to 4 days without watering. Lasts 30 growth days.",
  },
  // Pots — Simple Clay (40/120/320)
  {
    id: "simple-clay-small",
    label: "Simple Clay Pot (Small)",
    category: "pot",
    cost: 40,
    description: "A small unglazed terracotta pot. Traditional and breathable.",
  },
  {
    id: "simple-clay-medium",
    label: "Simple Clay Pot (Medium)",
    category: "pot",
    cost: 120,
    description:
      "A medium unglazed terracotta pot. Traditional and breathable.",
  },
  {
    id: "simple-clay-large",
    label: "Simple Clay Pot (Large)",
    category: "pot",
    cost: 320,
    description: "A large unglazed terracotta pot. Traditional and breathable.",
  },
  // Pots — Glazed Ceramic (80/240/640)
  {
    id: "glazed-ceramic-small",
    label: "Glazed Ceramic Pot (Small)",
    category: "pot",
    cost: 80,
    description: "A small, richly glazed pot with a deep cobalt sheen.",
  },
  {
    id: "glazed-ceramic-medium",
    label: "Glazed Ceramic Pot (Medium)",
    category: "pot",
    cost: 240,
    description: "A medium, richly glazed pot with a deep cobalt sheen.",
  },
  {
    id: "glazed-ceramic-large",
    label: "Glazed Ceramic Pot (Large)",
    category: "pot",
    cost: 640,
    description: "A large, richly glazed pot with a deep cobalt sheen.",
  },
  // Pots — Stone Basin (120/360/960)
  {
    id: "stone-basin-small",
    label: "Stone Basin (Small)",
    category: "pot",
    cost: 120,
    description: "A small carved stone tray. Heavy and natural.",
  },
  {
    id: "stone-basin-medium",
    label: "Stone Basin (Medium)",
    category: "pot",
    cost: 360,
    description: "A medium carved stone tray. Heavy and natural.",
  },
  {
    id: "stone-basin-large",
    label: "Stone Basin (Large)",
    category: "pot",
    cost: 960,
    description: "A large carved stone tray. Heavy and natural.",
  },
  // Pots — Lacquered Wood (150/450/1200)
  {
    id: "lacquered-wood-small",
    label: "Lacquered Wood Pot (Small)",
    category: "pot",
    cost: 150,
    description: "A small handcrafted pot with a deep lacquer finish.",
  },
  {
    id: "lacquered-wood-medium",
    label: "Lacquered Wood Pot (Medium)",
    category: "pot",
    cost: 450,
    description: "A medium handcrafted pot with a deep lacquer finish.",
  },
  {
    id: "lacquered-wood-large",
    label: "Lacquered Wood Pot (Large)",
    category: "pot",
    cost: 1200,
    description: "A large handcrafted pot with a deep lacquer finish.",
  },
  // Stands — Bamboo Mat (100/300/800)
  {
    id: "bamboo-mat-small",
    label: "Bamboo Mat (Small)",
    category: "stand",
    cost: 100,
    description: "A small woven bamboo display mat. Simple and elegant.",
  },
  {
    id: "bamboo-mat-medium",
    label: "Bamboo Mat (Medium)",
    category: "stand",
    cost: 300,
    description: "A medium woven bamboo display mat. Simple and elegant.",
  },
  {
    id: "bamboo-mat-large",
    label: "Bamboo Mat (Large)",
    category: "stand",
    cost: 800,
    description: "A large woven bamboo display mat. Simple and elegant.",
  },
  // Stands — Wooden Stand (500/1500/4000)
  {
    id: "wooden-stand-small",
    label: "Wooden Stand (Small)",
    category: "stand",
    cost: 500,
    description: "A small raised hardwood stand with carved legs.",
  },
  {
    id: "wooden-stand-medium",
    label: "Wooden Stand (Medium)",
    category: "stand",
    cost: 1500,
    description: "A medium raised hardwood stand with carved legs.",
  },
  {
    id: "wooden-stand-large",
    label: "Wooden Stand (Large)",
    category: "stand",
    cost: 4000,
    description: "A large raised hardwood stand with carved legs.",
  },
  // Stands — Carved Stone (2500/7500/20000)
  {
    id: "carved-stone-small",
    label: "Carved Stone Stand (Small)",
    category: "stand",
    cost: 2500,
    description:
      "A small sculpted stone pedestal. Reserved for the finest trees.",
  },
  {
    id: "carved-stone-medium",
    label: "Carved Stone Stand (Medium)",
    category: "stand",
    cost: 7500,
    description:
      "A medium sculpted stone pedestal. Reserved for the finest trees.",
  },
  {
    id: "carved-stone-large",
    label: "Carved Stone Stand (Large)",
    category: "stand",
    cost: 20000,
    description:
      "A large sculpted stone pedestal. Reserved for the finest trees.",
  },
];
