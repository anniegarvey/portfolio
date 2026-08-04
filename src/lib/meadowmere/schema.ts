import { z } from "zod";

// ─── ID Types ─────────────────────────────────────────────────────────────────

export const CropIdSchema = z.enum([
  "parsnip",
  "cornflower",
  "strawberry",
  "pumpkin",
  "moonpetal",
]);
export type CropId = z.infer<typeof CropIdSchema>;

/**
 * Everything that can sit in the larder. Produce comes from harvesting a crop;
 * materials come from foraging the wilds. One union so gifts, quest
 * requirements and rewards can all reference a single item vocabulary.
 */
export const ItemIdSchema = z.enum([
  // Produce
  "parsnip-root",
  "cornflower-bloom",
  "strawberry",
  "pumpkin",
  "moonpetal-bloom",
  // Materials
  "acorn",
  "bramble-berry",
  "feather",
  "river-clay",
  "reed",
  "smooth-stone",
  "wild-honey",
  "oak-resin",
  "chanterelle",
]);
export type ItemId = z.infer<typeof ItemIdSchema>;

export const SiteIdSchema = z.enum(["hedgerow", "riverbank", "stonewood"]);
export type SiteId = z.infer<typeof SiteIdSchema>;

export const NeighbourIdSchema = z.enum(["nessa", "bram", "marigold"]);
export type NeighbourId = z.infer<typeof NeighbourIdSchema>;

export const QuestIdSchema = z.enum([
  "a-bed-for-parsnips",
  "down-to-the-riverbank",
  "clay-for-the-kiln",
  "sweet-on-you",
  "the-harvest-table",
  "three-good-friends",
]);
export type QuestId = z.infer<typeof QuestIdSchema>;

// ─── Plots ────────────────────────────────────────────────────────────────────

export const PlantingSchema = z.object({
  cropId: CropIdSchema,
  /** Local date the seed went in. Growth is derived from this — never a counter. */
  plantedDate: z.string(),
  /** How many separate days this planting has been watered; raises yield. */
  wateredDays: z.number().int().min(0),
  /** Guards watering to once per calendar day. */
  lastWateredDate: z.string().optional(),
});
export type Planting = z.infer<typeof PlantingSchema>;

export const PlotSchema = z.object({
  id: z.string().uuid(),
  planting: PlantingSchema.nullable(),
});
export type Plot = z.infer<typeof PlotSchema>;

// ─── Neighbours ───────────────────────────────────────────────────────────────

export const NeighbourStateSchema = z.object({
  /** Friendship points, 0–100. Tier thresholds live in the catalog. */
  friendship: z.number().min(0).max(100),
  /** Local date this neighbour last received a gift; one gift per day. */
  lastGiftDate: z.string().optional(),
});
export type NeighbourState = z.infer<typeof NeighbourStateSchema>;

// ─── Game State ───────────────────────────────────────────────────────────────

export const MeadowmereStateSchema = z.object({
  plots: z.array(PlotSchema),
  /** Unplanted seed packets, bought with points or given as quest rewards. */
  seeds: z.partialRecord(CropIdSchema, z.number().int().min(0)),
  /** The larder: harvested produce and foraged materials. */
  inventory: z.partialRecord(ItemIdSchema, z.number().int().min(0)),
  /**
   * Partial so a save written before a neighbour existed still parses — read
   * it through `neighbourState` rather than indexing directly.
   */
  neighbours: z.partialRecord(NeighbourIdSchema, NeighbourStateSchema),
  unlockedCropIds: z.array(CropIdSchema),
  unlockedSiteIds: z.array(SiteIdSchema),
  completedQuestIds: z.array(QuestIdSchema),
  /** Forage trips already spent today; reset by the daily advance. */
  foragesToday: z.number().int().min(0),
  lastAdvanceDate: z.string().optional(),
});
export type MeadowmereState = z.infer<typeof MeadowmereStateSchema>;
