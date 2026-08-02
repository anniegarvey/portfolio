import type {
  BenefitRole,
  IngredientId,
  PetSpot,
  Posture,
  PreferenceKind,
  Rarity,
  SkillId,
  SpeciesId,
  TreatId,
} from "./schema";

// ─── Species ──────────────────────────────────────────────────────────────────

/** Where a tamed resident settles in the glade scene: air (top — fantastical
 * fliers), tree (middle — species that perch, like birds and squirrels), or
 * ground (bottom — everything else). */
export type Habitat = "ground" | "tree" | "air";

export interface SpeciesConfig {
  id: SpeciesId;
  name: string;
  kind: "real" | "fantastical";
  rarity: Rarity;
  benefitRole: BenefitRole;
  favouriteTreat: TreatId;
  preferredPosture: Posture;
  preferredPetSpot: PetSpot;
  habitat: Habitat;
  /** Shown on the visitor card; hints at preferences. */
  blurb: string;
  /** Vague favourite-treat hint, readable from skill tier 1. Shown once the treat is discovered. */
  vagueTreatHint: string;
  /** Precise favourite-treat hint, revealed at higher skill tiers. */
  clearTreatHint: string;
  /** Vague posture hint, readable from skill tier 1. Shown once the posture is discovered. */
  vaguePostureHint: string;
  /** Precise posture hint, revealed at higher skill tiers. */
  clearPostureHint: string;
  /** Vague pet-spot hint, readable from skill tier 1. Shown once the pet spot is discovered. */
  vaguePetSpotHint: string;
  /** Precise pet-spot hint, revealed at higher skill tiers. */
  clearPetSpotHint: string;
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
    habitat: "tree",
    blurb: "A cheerful songbird whose morning tunes spark inspiration.",
    vagueTreatHint:
      "Perks up at the first whiff of something plucked fresh off a bush.",
    clearTreatHint: "Loves berry bites.",
    vaguePostureHint: "Seems happiest when you keep very still.",
    clearPostureHint: "Sit still nearby.",
    vaguePetSpotHint: "Puffs its feathers when a hand passes along its length.",
    clearPetSpotHint: "Stroke its back.",
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
    habitat: "ground",
    blurb: "A gentle grazer with a knack for finding good food.",
    vagueTreatHint: "Noses hopefully toward anything warm and grainy.",
    clearTreatHint: "Loves oat cakes.",
    vaguePostureHint: "Gets nervous when you tower over it.",
    clearPostureHint: "Crouch low.",
    vaguePetSpotHint: "Leans its head sideways toward a hand near its ears.",
    clearPetSpotHint: "Scratch behind the ears.",
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
    habitat: "tree",
    blurb: "A busy hoarder who shares the best of its stash.",
    vagueTreatHint: "Perks up at the crack of something hard-shelled nearby.",
    clearTreatHint: "Loves nut clusters.",
    vaguePostureHint: "Watches you closely; sudden moves send it darting off.",
    clearPostureHint: "Sit still.",
    vaguePetSpotHint: "Tilts its head up when you reach toward its face.",
    clearPetSpotHint: "Offer a chin rub.",
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
    habitat: "ground",
    blurb: "A prickly-looking softie whose calm settles the whole glade.",
    vagueTreatHint:
      "Uncurls slightly at the smell of something rich and creamy.",
    clearTreatHint: "Loves cream puffs.",
    vaguePostureHint: "Curls up unless you come down to its level.",
    clearPostureHint: "Crouch low.",
    vaguePetSpotHint: "Peeks out from its curl when you reach low and gentle.",
    clearPetSpotHint: "Rub under the chin.",
  },
  mouse: {
    id: "mouse",
    name: "Mouse",
    kind: "real",
    rarity: "common",
    benefitRole: "forager",
    favouriteTreat: "oat-cakes",
    preferredPosture: "crouch-low",
    preferredPetSpot: "chin",
    habitat: "ground",
    blurb: "A tiny scavenger with sharp eyes for every dropped seed.",
    vagueTreatHint: "Sniffs the air for something baked and crumbly.",
    clearTreatHint: "Loves oat cakes.",
    vaguePostureHint: "Vanishes into the grass the moment you loom.",
    clearPostureHint: "Crouch low.",
    vaguePetSpotHint: "Lifts its tiny face toward a careful fingertip.",
    clearPetSpotHint: "Offer a gentle chin rub.",
  },
  wren: {
    id: "wren",
    name: "Wren",
    kind: "real",
    rarity: "common",
    benefitRole: "muse",
    favouriteTreat: "mint-crisps",
    preferredPosture: "slow-blink",
    preferredPetSpot: "chin",
    habitat: "tree",
    blurb: "A pocket-sized singer whose bold song outsizes its body.",
    vagueTreatHint: "Perks its head at anything cool and herby.",
    clearTreatHint: "Loves mint crisps.",
    vaguePostureHint: "Flits nervously unless your gaze goes soft.",
    clearPostureHint: "Blink slowly.",
    vaguePetSpotHint: "Tips its beak up, inviting a gentle touch up close.",
    clearPetSpotHint: "Offer a chin scratch.",
  },
  mole: {
    id: "mole",
    name: "Mole",
    kind: "real",
    rarity: "common",
    benefitRole: "soother",
    favouriteTreat: "oat-cakes",
    preferredPosture: "crouch-low",
    preferredPetSpot: "back",
    habitat: "ground",
    blurb: "A velvet-coated digger whose steady calm settles the soil itself.",
    vagueTreatHint: "Snuffles blindly toward the smell of warm grain.",
    clearTreatHint: "Loves oat cakes.",
    vaguePostureHint:
      "Half-blind but keen-nosed — it trusts what stays close to the ground.",
    clearPostureHint: "Crouch low.",
    vaguePetSpotHint: "Arches slightly at a touch along its spine.",
    clearPetSpotHint: "Smooth its velvet back.",
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
    habitat: "ground",
    blurb: "A clever wanderer whose presence draws curious creatures near.",
    vagueTreatHint: "Tracks anything with a hint of sweetness on the air.",
    clearTreatHint: "Loves honey drops.",
    vaguePostureHint:
      "Meets your gaze; staring too hard feels like a challenge.",
    clearPostureHint: "Blink slowly.",
    vaguePetSpotHint: "Tilts its head when fingers stray near its ears.",
    clearPetSpotHint: "Scratch behind the ears.",
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
    habitat: "ground",
    blurb: "A serene grazer whose quiet confidence reassures shy visitors.",
    vagueTreatHint: "Noses toward anything with a sharp, green scent.",
    clearTreatHint: "Loves mint crisps.",
    vaguePostureHint: "Startles at any movement — patience is everything.",
    clearPostureHint: "Sit perfectly still.",
    vaguePetSpotHint: "Leans faintly into a hand run along its flank.",
    clearPetSpotHint: "Stroke its back.",
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
    habitat: "tree",
    blurb: "A wise night-watcher whose company sharpens your craft.",
    vagueTreatHint: "Turns its head sharply at the scent of roasted nuts.",
    clearTreatHint: "Loves nut clusters.",
    vaguePostureHint:
      "Studies you with huge eyes; it seems to respond in kind.",
    clearPostureHint: "Blink slowly.",
    vaguePetSpotHint:
      "Lowers its head slightly when you reach toward its face.",
    clearPetSpotHint: "Offer a chin scratch.",
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
    habitat: "ground",
    blurb: "A sturdy digger who unearths rare ingredients.",
    vagueTreatHint: "Digs eagerly toward the smell of something sticky-sweet.",
    clearTreatHint: "Loves honey drops.",
    vaguePostureHint: "Stands its ground; meet it low and unhurried.",
    clearPostureHint: "Crouch low.",
    vaguePetSpotHint: "Settles when a firm hand runs the length of it.",
    clearPetSpotHint: "Pat its back firmly.",
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
    habitat: "ground",
    blurb: "A moss-covered cat-thing that grows herbs along its spine.",
    vagueTreatHint: "Chews thoughtfully on anything leafy and sharp-smelling.",
    clearTreatHint: "Loves mint crisps.",
    vaguePostureHint: "Hugs the ground; it likes company down there.",
    clearPostureHint: "Crouch low.",
    vaguePetSpotHint: "Leans its mossy head toward a hand near its ears.",
    clearPetSpotHint: "Scratch behind the ears.",
  },
  otter: {
    id: "otter",
    name: "Otter",
    kind: "real",
    rarity: "uncommon",
    benefitRole: "beacon",
    favouriteTreat: "cream-puffs",
    preferredPosture: "slow-blink",
    preferredPetSpot: "back",
    habitat: "ground",
    blurb: "A playful river-dweller whose antics draw curious onlookers.",
    vagueTreatHint: "Splashes eagerly toward anything soft and creamy.",
    clearTreatHint: "Loves cream puffs.",
    vaguePostureHint:
      "Meets mischief with mischief; an eager stare spoils the game.",
    clearPostureHint: "Blink slowly.",
    vaguePetSpotHint: "Rolls to offer its length to a passing hand.",
    clearPetSpotHint: "Stroke its sleek back.",
  },
  hare: {
    id: "hare",
    name: "Hare",
    kind: "real",
    rarity: "uncommon",
    benefitRole: "muse",
    favouriteTreat: "mint-crisps",
    preferredPosture: "sit-still",
    preferredPetSpot: "behind-ears",
    habitat: "ground",
    blurb: "A long-limbed sprinter whose wild energy stirs new ideas.",
    vagueTreatHint: "Twitches its nose at anything crisp and herbal.",
    clearTreatHint: "Loves mint crisps.",
    vaguePostureHint: "Coiled to bolt — only perfect stillness reassures it.",
    clearPostureHint: "Sit still.",
    vaguePetSpotHint: "Angles its long ears toward a careful hand.",
    clearPetSpotHint: "Scratch behind those long ears.",
  },
  thistledown: {
    id: "thistledown",
    name: "Thistledown",
    kind: "fantastical",
    rarity: "uncommon",
    benefitRole: "soother",
    favouriteTreat: "honey-drops",
    preferredPosture: "sit-still",
    preferredPetSpot: "chin",
    habitat: "air",
    blurb:
      "A drifting seed-fluff spirit that settles wherever the air is calm.",
    vagueTreatHint: "Drifts toward the faintest trace of amber sweetness.",
    clearTreatHint: "Loves honey drops.",
    vaguePostureHint: "The lightest stir of air carries it away.",
    clearPostureHint: "Sit still.",
    vaguePetSpotHint: "Tilts upward toward the gentlest touch.",
    clearPetSpotHint: "Tickle under its chin.",
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
    habitat: "air",
    blurb: "A tiny dragonfly-dragon whose glow is a lantern to lost creatures.",
    vagueTreatHint: "Circles anything glistening and sweet.",
    clearTreatHint: "Loves honey drops.",
    vaguePostureHint:
      "Hovers just out of reach unless the air is utterly calm.",
    clearPostureHint: "Sit still.",
    vaguePetSpotHint: "Shivers its wings at a touch along their length.",
    clearPetSpotHint: "Smooth its wing-backs.",
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
    habitat: "air",
    blurb: "A drowsy cloud-sheep; everything nearby breathes a little slower.",
    vagueTreatHint: "Drifts toward anything light, sweet, and cloud-soft.",
    clearTreatHint: "Loves cream puffs.",
    vaguePostureHint: "Drifts closer when your eyes go soft and sleepy.",
    clearPostureHint: "Blink slowly.",
    vaguePetSpotHint: "Fluffs up when stroked along its woolly length.",
    clearPetSpotHint: "Pat its woolly back.",
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
    habitat: "air",
    blurb: "A morning-dew spirit that whispers forgotten techniques.",
    vagueTreatHint: "Brightens at the smell of dew-fresh fruit.",
    clearTreatHint: "Loves berry bites.",
    vaguePostureHint: "Shimmers brighter when you greet it gently, eye to eye.",
    clearPostureHint: "Blink slowly.",
    vaguePetSpotHint: "Shimmers when fingers stray near the base of its ears.",
    clearPetSpotHint: "Tickle behind its ears.",
  },
  emberveil: {
    id: "emberveil",
    name: "Emberveil",
    kind: "fantastical",
    rarity: "legendary",
    benefitRole: "herald",
    favouriteTreat: "honey-drops",
    preferredPosture: "slow-blink",
    preferredPetSpot: "back",
    habitat: "air",
    blurb:
      "A fire-moth of ancient warmth whose presence sharpens every tender gesture.",
    vagueTreatHint: "Warms at the scent of something golden and sweet.",
    clearTreatHint: "Loves honey drops.",
    vaguePostureHint: "Flame-shy; a soft, unhurried gaze seems to hold it.",
    clearPostureHint: "Blink slowly.",
    vaguePetSpotHint: "Glows faintly at a touch along its length.",
    clearPetSpotHint: "Stroke along its back.",
  },
  thornwhisper: {
    id: "thornwhisper",
    name: "Thornwhisper",
    kind: "fantastical",
    rarity: "legendary",
    benefitRole: "wellspring",
    favouriteTreat: "berry-bites",
    preferredPosture: "crouch-low",
    preferredPetSpot: "behind-ears",
    habitat: "ground",
    blurb:
      "An ancient root-creature that nurtures the glade with deep abundance.",
    vagueTreatHint: "Roots twitch toward the nearest bramble of fruit.",
    clearTreatHint: "Loves berry bites.",
    vaguePostureHint:
      "Tangles of root and moss — it eases when you match its low height.",
    clearPostureHint: "Crouch low.",
    vaguePetSpotHint: "Leans its thorny crown toward a hand near its ears.",
    clearPetSpotHint: "Scratch behind its ears.",
  },
  mirewing: {
    id: "mirewing",
    name: "Mirewing",
    kind: "fantastical",
    rarity: "mythic",
    benefitRole: "herald",
    favouriteTreat: "cream-puffs",
    preferredPosture: "sit-still",
    preferredPetSpot: "chin",
    habitat: "air",
    blurb:
      "A crystal-winged butterfly of perfect stillness — its every touch amplifies your patient skill.",
    vagueTreatHint: "Settles closer to anything delicate and cream-filled.",
    clearTreatHint: "Loves cream puffs.",
    vaguePostureHint:
      "Lands only in absolute calm; the faintest motion sends it aloft.",
    clearPostureHint: "Sit still.",
    vaguePetSpotHint: "Tilts its crystal wings toward a touch near its face.",
    clearPetSpotHint: "Offer a chin scratch.",
  },
  fernmother: {
    id: "fernmother",
    name: "Fernmother",
    kind: "fantastical",
    rarity: "mythic",
    benefitRole: "wellspring",
    favouriteTreat: "mint-crisps",
    preferredPosture: "crouch-low",
    preferredPetSpot: "back",
    habitat: "ground",
    blurb:
      "A primordial forest spirit whose roots run deep, filling the glade with inexhaustible gifts.",
    vagueTreatHint: "Draws slow roots toward anything green and fragrant.",
    clearTreatHint: "Loves mint crisps.",
    vaguePostureHint:
      "Ancient and slow; you need to come all the way down to meet it.",
    clearPostureHint: "Crouch low.",
    vaguePetSpotHint: "Sways gently at a touch along its mossy length.",
    clearPetSpotHint: "Stroke along its back.",
  },
};

export const ALL_SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[];

// ─── Trust ────────────────────────────────────────────────────────────────────

/**
 * Trust required to tame, by rarity. Tuned for long-term daily play: a
 * day's matched actions earn ~30 trust at tier-1 skills and ~75 at tier 5,
 * so commons tame in a couple of days (onboarding), uncommons in roughly a
 * week, rares are a multi-week project, legendaries take roughly a month at
 * optimal play, and mythics are a two-month aspiration.
 */
export const TAME_THRESHOLD: Record<Rarity, number> = {
  common: 60,
  uncommon: 250,
  rare: 900,
  legendary: 2000,
  mythic: 5000,
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
  legendary: ALL_INGREDIENT_IDS,
  mythic: ALL_INGREDIENT_IDS,
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

// ─── Benefit Roles ────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<BenefitRole, string> = {
  forager: "Forager",
  soother: "Soother",
  beacon: "Beacon",
  muse: "Muse",
  herald: "Herald",
  wellspring: "Wellspring",
};

/** What each role contributes, shown wherever a resident's benefit appears. */
export const ROLE_DESCRIPTIONS: Record<BenefitRole, string> = {
  forager: "Gathers an ingredient each day",
  soother: "Calms wild visitors each day",
  beacon: "Attracts rarer visitors",
  muse: "Boosts skill XP",
  herald: "Strengthens well-matched taming actions",
  wellspring: "Unearths two ingredients each day",
};

// ─── Skills ───────────────────────────────────────────────────────────────────

// Ordered to match the unlock sequence (see SKILL_UNLOCK_REQUIREMENT below),
// since SkillsPanel renders skill cards in this key order.
export const SKILL_NAMES: Record<SkillId, string> = {
  "body-language": "Body Language",
  "petting-technique": "Petting Technique",
  "treat-cooking": "Treat Cooking",
};

/**
 * Skills unlock in sequence so the tree can't be maxed out in a couple of
 * weeks: Body Language is available from the start, Petting Technique
 * unlocks once Body Language reaches the given tier, and Treat Cooking
 * unlocks once Petting Technique does. Null means always unlocked.
 */
export const SKILL_UNLOCK_REQUIREMENT: Record<
  SkillId,
  { skillId: SkillId; tier: number } | null
> = {
  "body-language": null,
  "petting-technique": { skillId: "body-language", tier: 2 },
  "treat-cooking": { skillId: "petting-technique", tier: 2 },
};

/** Which taming skill governs each preference type's hint progression. */
export const PREFERENCE_SKILL: Record<PreferenceKind, SkillId> = {
  treat: "treat-cooking",
  posture: "body-language",
  petSpot: "petting-technique",
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
  legendary: 2,
  mythic: 1,
};

/** Each beacon resident shifts this much weight from common to rare. */
export const BEACON_RARE_BONUS = 10;

/**
 * How strongly taming progress draws a species back: a species one action
 * from tame is (1 + this)× as likely to visit as an untouched one of the
 * same rarity.
 */
export const TRUST_VISIT_BONUS = 3;

/** Flat trust bonus added per herald resident on any matched approach or pet action. */
export const HERALD_TRUST_BONUS = 5;

// ─── Resident Placement ──────────────────────────────────────────────────────

/**
 * Vertical placement band for a newly-tamed resident, as a percentage of the
 * glade scene's height, keyed by habitat: air residents settle near the top
 * (above the treeline), tree residents around the mid-scene treeline, and
 * ground residents in the near meadow at the bottom.
 */
export const HABITAT_Y_RANGE: Record<Habitat, { min: number; max: number }> = {
  air: { min: 14, max: 30 },
  tree: { min: 38, max: 58 },
  ground: { min: 66, max: 85 },
};
