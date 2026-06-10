import type {
  BenefitRole,
  IngredientId,
  PetSpot,
  Posture,
  Rarity,
  SkillId,
  SpeciesId,
  TreatId,
} from "./schema";

// ─── Species ──────────────────────────────────────────────────────────────────

export interface SpeciesConfig {
  id: SpeciesId;
  name: string;
  kind: "real" | "fantastical";
  rarity: Rarity;
  benefitRole: BenefitRole;
  favouriteTreat: TreatId;
  preferredPosture: Posture;
  preferredPetSpot: PetSpot;
  /** Shown on the visitor card; hints at preferences. */
  blurb: string;
  /** Vague preference hint, readable from skill tier 1. */
  vagueHint: string;
  /** Precise preference hint, revealed at higher skill tiers. */
  clearHint: string;
}

export const SPECIES: Record<SpeciesId, SpeciesConfig> = {
  robin: {
    id: "robin",
    name: "Robin",
    kind: "real",
    rarity: "common",
    benefitRole: "muse",
    favouriteTreat: "berry-bites",
    preferredPosture: "sit-still",
    preferredPetSpot: "back",
    blurb: "A cheerful songbird whose morning tunes spark inspiration.",
    vagueHint: "Seems happiest when you keep very still.",
    clearHint: "Sit still nearby and stroke its back. Loves berry bites.",
  },
  rabbit: {
    id: "rabbit",
    name: "Rabbit",
    kind: "real",
    rarity: "common",
    benefitRole: "forager",
    favouriteTreat: "oat-cakes",
    preferredPosture: "crouch-low",
    preferredPetSpot: "behind-ears",
    blurb: "A gentle grazer with a knack for finding good food.",
    vagueHint: "Gets nervous when you tower over it.",
    clearHint: "Crouch low and scratch behind the ears. Loves oat cakes.",
  },
  squirrel: {
    id: "squirrel",
    name: "Squirrel",
    kind: "real",
    rarity: "common",
    benefitRole: "forager",
    favouriteTreat: "nut-clusters",
    preferredPosture: "sit-still",
    preferredPetSpot: "chin",
    blurb: "A busy hoarder who shares the best of its stash.",
    vagueHint: "Watches you closely; sudden moves send it darting off.",
    clearHint: "Sit still and offer a chin rub. Loves nut clusters.",
  },
  hedgehog: {
    id: "hedgehog",
    name: "Hedgehog",
    kind: "real",
    rarity: "common",
    benefitRole: "soother",
    favouriteTreat: "cream-puffs",
    preferredPosture: "crouch-low",
    preferredPetSpot: "chin",
    blurb: "A prickly-looking softie whose calm settles the whole glade.",
    vagueHint: "Curls up unless you come down to its level.",
    clearHint: "Crouch low and rub under the chin. Loves cream puffs.",
  },
  fox: {
    id: "fox",
    name: "Fox",
    kind: "real",
    rarity: "uncommon",
    benefitRole: "beacon",
    favouriteTreat: "honey-drops",
    preferredPosture: "slow-blink",
    preferredPetSpot: "behind-ears",
    blurb: "A clever wanderer whose presence draws curious creatures near.",
    vagueHint: "Meets your gaze; staring too hard feels like a challenge.",
    clearHint: "Blink slowly and scratch behind the ears. Loves honey drops.",
  },
  deer: {
    id: "deer",
    name: "Deer",
    kind: "real",
    rarity: "uncommon",
    benefitRole: "soother",
    favouriteTreat: "mint-crisps",
    preferredPosture: "sit-still",
    preferredPetSpot: "back",
    blurb: "A serene grazer whose quiet confidence reassures shy visitors.",
    vagueHint: "Startles at any movement — patience is everything.",
    clearHint: "Sit perfectly still and stroke its back. Loves mint crisps.",
  },
  owl: {
    id: "owl",
    name: "Owl",
    kind: "real",
    rarity: "uncommon",
    benefitRole: "muse",
    favouriteTreat: "nut-clusters",
    preferredPosture: "slow-blink",
    preferredPetSpot: "chin",
    blurb: "A wise night-watcher whose company sharpens your craft.",
    vagueHint: "Studies you with huge eyes; it seems to respond in kind.",
    clearHint: "Blink slowly and offer a chin scratch. Loves nut clusters.",
  },
  badger: {
    id: "badger",
    name: "Badger",
    kind: "real",
    rarity: "uncommon",
    benefitRole: "forager",
    favouriteTreat: "honey-drops",
    preferredPosture: "crouch-low",
    preferredPetSpot: "back",
    blurb: "A sturdy digger who unearths rare ingredients.",
    vagueHint: "Stands its ground; meet it low and unhurried.",
    clearHint: "Crouch low and pat its back firmly. Loves honey drops.",
  },
  mosskit: {
    id: "mosskit",
    name: "Mosskit",
    kind: "fantastical",
    rarity: "uncommon",
    benefitRole: "forager",
    favouriteTreat: "mint-crisps",
    preferredPosture: "crouch-low",
    preferredPetSpot: "behind-ears",
    blurb: "A moss-covered cat-thing that grows herbs along its spine.",
    vagueHint: "Hugs the ground; it likes company down there.",
    clearHint: "Crouch low and scratch behind the ears. Loves mint crisps.",
  },
  glimmerwing: {
    id: "glimmerwing",
    name: "Glimmerwing",
    kind: "fantastical",
    rarity: "rare",
    benefitRole: "beacon",
    favouriteTreat: "honey-drops",
    preferredPosture: "sit-still",
    preferredPetSpot: "back",
    blurb: "A tiny dragonfly-dragon whose glow is a lantern to lost creatures.",
    vagueHint: "Hovers just out of reach unless the air is utterly calm.",
    clearHint: "Sit still and smooth its wing-backs. Loves honey drops.",
  },
  puffloaf: {
    id: "puffloaf",
    name: "Puffloaf",
    kind: "fantastical",
    rarity: "rare",
    benefitRole: "soother",
    favouriteTreat: "cream-puffs",
    preferredPosture: "slow-blink",
    preferredPetSpot: "back",
    blurb: "A drowsy cloud-sheep; everything nearby breathes a little slower.",
    vagueHint: "Drifts closer when your eyes go soft and sleepy.",
    clearHint: "Blink slowly and pat its woolly back. Loves cream puffs.",
  },
  dewsprite: {
    id: "dewsprite",
    name: "Dewsprite",
    kind: "fantastical",
    rarity: "rare",
    benefitRole: "muse",
    favouriteTreat: "berry-bites",
    preferredPosture: "slow-blink",
    preferredPetSpot: "behind-ears",
    blurb: "A morning-dew spirit that whispers forgotten techniques.",
    vagueHint: "Shimmers brighter when you greet it gently, eye to eye.",
    clearHint: "Blink slowly and tickle behind its ears. Loves berry bites.",
  },
};

export const ALL_SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];

// ─── Trust ────────────────────────────────────────────────────────────────────

/**
 * Trust required to tame, by rarity. Tuned for long-term daily play: a
 * day's matched actions earn ~30 trust at tier-1 skills and ~75 at tier 5,
 * so commons tame in a couple of days (onboarding), uncommons in roughly a
 * week, and rares are a multi-week project even with strong skills and
 * soother support.
 */
export const TAME_THRESHOLD: Record<Rarity, number> = {
  common: 60,
  uncommon: 250,
  rare: 900,
};

export function tameThresholdFor(speciesId: SpeciesId): number {
  return TAME_THRESHOLD[SPECIES[speciesId].rarity];
}

// ─── Ingredients ──────────────────────────────────────────────────────────────

export interface IngredientConfig {
  id: IngredientId;
  name: string;
  /** Points cost to buy one. */
  cost: number;
}

export const INGREDIENTS: Record<IngredientId, IngredientConfig> = {
  berries: { id: "berries", name: "Berries", cost: 3 },
  oats: { id: "oats", name: "Oats", cost: 3 },
  honey: { id: "honey", name: "Honey", cost: 5 },
  mint: { id: "mint", name: "Mint", cost: 4 },
  hazelnuts: { id: "hazelnuts", name: "Hazelnuts", cost: 5 },
  cream: { id: "cream", name: "Cream", cost: 6 },
};

export const ALL_INGREDIENT_IDS = Object.keys(INGREDIENTS) as IngredientId[];

/**
 * Ingredients a forager can gather, by the forager's rarity. Common foragers
 * find everyday ingredients; uncommon and rarer ones also unearth the
 * premium ingredients, so each forager is a distinct upgrade.
 */
export const FORAGE_POOLS: Record<Rarity, readonly IngredientId[]> = {
  common: ["berries", "oats", "mint"],
  uncommon: ALL_INGREDIENT_IDS,
  rare: ALL_INGREDIENT_IDS,
};

// ─── Recipes ──────────────────────────────────────────────────────────────────

export interface RecipeConfig {
  treatId: TreatId;
  name: string;
  /** Treat Cooking tier required to cook this recipe. */
  requiredTier: number;
  ingredients: Partial<Record<IngredientId, number>>;
  /** Base trust gained when offered (doubled for a favourite treat). */
  potency: number;
}

export const RECIPES: Record<TreatId, RecipeConfig> = {
  "berry-bites": {
    treatId: "berry-bites",
    name: "Berry Bites",
    requiredTier: 1,
    ingredients: { berries: 2 },
    potency: 5,
  },
  "oat-cakes": {
    treatId: "oat-cakes",
    name: "Oat Cakes",
    requiredTier: 1,
    ingredients: { oats: 2 },
    potency: 5,
  },
  "honey-drops": {
    treatId: "honey-drops",
    name: "Honey Drops",
    requiredTier: 2,
    ingredients: { honey: 1, oats: 1 },
    potency: 8,
  },
  "mint-crisps": {
    treatId: "mint-crisps",
    name: "Mint Crisps",
    requiredTier: 2,
    ingredients: { mint: 1, berries: 1 },
    potency: 8,
  },
  "nut-clusters": {
    treatId: "nut-clusters",
    name: "Nut Clusters",
    requiredTier: 3,
    ingredients: { hazelnuts: 2, honey: 1 },
    potency: 12,
  },
  "cream-puffs": {
    treatId: "cream-puffs",
    name: "Cream Puffs",
    requiredTier: 4,
    ingredients: { cream: 1, berries: 1, honey: 1 },
    potency: 16,
  },
};

export const ALL_TREAT_IDS = Object.keys(RECIPES) as TreatId[];

// ─── Skills ───────────────────────────────────────────────────────────────────

export const SKILL_NAMES: Record<SkillId, string> = {
  "treat-cooking": "Treat Cooking",
  "body-language": "Body Language",
  "petting-technique": "Petting Technique",
};

export const MAX_TIER = 5;

/**
 * XP needed to fill the bar at each tier (index = tier - 1; no entry for max
 * tier). The curve roughly doubles per tier so each level feels harder than
 * the last even with stacked muse residents boosting XP per action (up to
 * 4 XP/action with all three muses).
 */
export const XP_THRESHOLDS = [5, 12, 25, 45] as const;

/** Points cost of the lesson advancing to each tier (index = current tier - 1). */
export const LESSON_COSTS = [15, 30, 60, 100] as const;

/** XP needed to complete the given tier's bar, or null at max tier. */
export function xpThresholdFor(tier: number): number | null {
  return XP_THRESHOLDS[tier - 1] ?? null;
}

/** Points cost of the lesson out of the given tier, or null at max tier. */
export function lessonCostFor(tier: number): number | null {
  return LESSON_COSTS[tier - 1] ?? null;
}

// ─── Choice Labels ────────────────────────────────────────────────────────────

export const POSTURE_LABELS: Record<Posture, string> = {
  "crouch-low": "Crouch low",
  "sit-still": "Sit still",
  "slow-blink": "Slow blink",
};

export const PET_SPOT_LABELS: Record<PetSpot, string> = {
  chin: "Under the chin",
  back: "Along the back",
  "behind-ears": "Behind the ears",
};

// ─── Visitor Spawning ─────────────────────────────────────────────────────────

export const MAX_VISITORS = 3;

/** Relative spawn weight per rarity, before beacon bonuses. */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 70,
  uncommon: 25,
  rare: 5,
};

/** Each beacon resident shifts this much weight from common to rare. */
export const BEACON_RARE_BONUS = 10;
