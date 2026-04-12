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

// ─── Pot / Stand ID Parsers ───────────────────────────────────────────────────

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

// ─── Re-exports ───────────────────────────────────────────────────────────────
// Keep all existing importers working without changes.

export type {
  FertiliserEffect,
  FertiliserType,
  GrowthTonicEffect,
  MoistureKeeperEffect,
  ShopCategory,
  ShopItem,
} from "./catalog";
export { FERTILISER_EFFECTS, SHOP_CATALOG } from "./catalog";
export type {
  LeafShape,
  SpeciesConfig,
} from "./speciesConfig";
export { SPECIES_CONFIG } from "./speciesConfig";
