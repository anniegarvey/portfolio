import { z } from "zod";

// ─── ID Types ─────────────────────────────────────────────────────────────────

export const SpeciesIdSchema = z.enum([
  "robin",
  "rabbit",
  "squirrel",
  "hedgehog",
  "mouse",
  "wren",
  "mole",
  "fox",
  "deer",
  "owl",
  "badger",
  "mosskit",
  "otter",
  "hare",
  "thistledown",
  "glimmerwing",
  "puffloaf",
  "dewsprite",
  "emberveil",
  "thornwhisper",
  "mirewing",
  "fernmother",
]);
export type SpeciesId = z.infer<typeof SpeciesIdSchema>;

export const SkillIdSchema = z.enum([
  "treat-cooking",
  "body-language",
  "petting-technique",
]);
export type SkillId = z.infer<typeof SkillIdSchema>;

export const IngredientIdSchema = z.enum([
  "berries",
  "oats",
  "honey",
  "mint",
  "hazelnuts",
  "cream",
]);
export type IngredientId = z.infer<typeof IngredientIdSchema>;

export const TreatIdSchema = z.enum([
  "berry-bites",
  "oat-cakes",
  "honey-drops",
  "mint-crisps",
  "nut-clusters",
  "cream-puffs",
]);
export type TreatId = z.infer<typeof TreatIdSchema>;

export const PostureSchema = z.enum(["crouch-low", "sit-still", "slow-blink"]);
export type Posture = z.infer<typeof PostureSchema>;

export const PetSpotSchema = z.enum(["chin", "back", "behind-ears"]);
export type PetSpot = z.infer<typeof PetSpotSchema>;

export const RaritySchema = z.enum([
  "common",
  "uncommon",
  "rare",
  "legendary",
  "mythic",
]);
export type Rarity = z.infer<typeof RaritySchema>;

export const BenefitRoleSchema = z.enum([
  "forager",
  "soother",
  "beacon",
  "muse",
  "herald",
  "wellspring",
]);
export type BenefitRole = z.infer<typeof BenefitRoleSchema>;

// ─── Wild Visitor ─────────────────────────────────────────────────────────────

/** Which taming actions a visitor has already received today. */
export const DailyActionsSchema = z.object({
  treat: z.boolean(),
  approach: z.boolean(),
  pet: z.boolean(),
});
export type DailyActions = z.infer<typeof DailyActionsSchema>;

export const WildVisitorSchema = z.object({
  id: z.string().uuid(),
  speciesId: SpeciesIdSchema,
  trust: z.number().min(0),
  arrivedDate: z.string(),
  actionsToday: DailyActionsSchema,
});
export type WildVisitor = z.infer<typeof WildVisitorSchema>;

// ─── Resident ─────────────────────────────────────────────────────────────────

export const GladePositionSchema = z.object({
  /** Percentage (0–100) from left edge of the glade scene. */
  x: z.number().min(0).max(100),
  /** Percentage (0–100) from top edge of the glade scene. */
  y: z.number().min(0).max(100),
});
export type GladePosition = z.infer<typeof GladePositionSchema>;

export const ResidentSchema = z.object({
  id: z.string().uuid(),
  speciesId: SpeciesIdSchema,
  /** Personal name given by the player; falls back to the species name. */
  name: z.string().min(1).max(24).optional(),
  tamedDate: z.string(),
  position: GladePositionSchema,
});
export type Resident = z.infer<typeof ResidentSchema>;

// ─── Skills ───────────────────────────────────────────────────────────────────

export const SkillStateSchema = z.object({
  /** Current tier, 1–5. */
  tier: z.number().int().min(1).max(5),
  /** XP earned within the current tier; resets on tier-up. */
  xp: z.number().int().min(0),
});
export type SkillState = z.infer<typeof SkillStateSchema>;

export const SkillsSchema = z.object({
  "treat-cooking": SkillStateSchema,
  "body-language": SkillStateSchema,
  "petting-technique": SkillStateSchema,
});
export type Skills = z.infer<typeof SkillsSchema>;

// ─── Pantry ───────────────────────────────────────────────────────────────────

export const PantrySchema = z.object({
  ingredients: z.partialRecord(IngredientIdSchema, z.number().int().min(0)),
  treats: z.partialRecord(TreatIdSchema, z.number().int().min(0)),
});
export type Pantry = z.infer<typeof PantrySchema>;

// ─── Preference Discovery ───────────────────────────────────────────────────────

/** Which of a species' three preference hints have been confirmed by a matching action. */
export const DiscoveredPreferenceSchema = z.object({
  treat: z.boolean().optional(),
  posture: z.boolean().optional(),
  petSpot: z.boolean().optional(),
});
export type DiscoveredPreference = z.infer<typeof DiscoveredPreferenceSchema>;
export type PreferenceKind = keyof DiscoveredPreference;

/** Which specific options have been tried for a species' three preference types, right or wrong. */
export const TriedPreferenceSchema = z.object({
  treat: z.array(TreatIdSchema).optional(),
  posture: z.array(PostureSchema).optional(),
  petSpot: z.array(PetSpotSchema).optional(),
});
export type TriedPreference = z.infer<typeof TriedPreferenceSchema>;

// ─── Game State ───────────────────────────────────────────────────────────────

export const GladeStateSchema = z.object({
  visitors: z.array(WildVisitorSchema),
  residents: z.array(ResidentSchema),
  skills: SkillsSchema,
  pantry: PantrySchema,
  /**
   * Trust each untamed species has built so far, kept across visits. Synced
   * from departing visitors at each daily advance; seeds the trust of that
   * species' next visit. Defaults so states saved before daily visitor
   * rotation still parse.
   */
  speciesTrust: z
    .partialRecord(SpeciesIdSchema, z.number().min(0))
    .default(() => ({})),
  /**
   * Per-species, per-preference-type discovery: each of treat/posture/pet
   * spot unlocks its own hint independently, the first time a matching
   * taming action confirms it. Defaults so states saved before hint-gating
   * still parse.
   */
  discoveredPreferences: z
    .partialRecord(SpeciesIdSchema, DiscoveredPreferenceSchema)
    .default(() => ({})),
  /**
   * Per-species, per-preference-type log of every specific option tried so
   * far (right or wrong) — an elimination aid for narrowing down a
   * preference not yet discovered. Defaults so states saved before this
   * tracking existed still parse.
   */
  triedPreferences: z
    .partialRecord(SpeciesIdSchema, TriedPreferenceSchema)
    .default(() => ({})),
  lastAdvanceDate: z.string().optional(),
});
export type GladeState = z.infer<typeof GladeStateSchema>;
