import type { CropId, ItemId, NeighbourId, QuestId, SiteId } from "./schema";

// ─── Tuning ───────────────────────────────────────────────────────────────────

/** Plots the farm starts with. Quest rewards add more, up to MAX_PLOTS. */
export const STARTING_PLOTS = 6;
export const MAX_PLOTS = 16;

/** Forage trips available each day, refilled by the daily advance. */
export const FORAGES_PER_DAY = 3;

/** Friendship a handed-in errand earns with whoever asked for it. */
export const ERRAND_FRIENDSHIP = 8;

/** Seed packets a handed-in errand pays out. */
export const ERRAND_SEEDS = 2;

/** Friendship a gift earns: more when the neighbour likes the item. */
export const LIKED_GIFT_FRIENDSHIP = 12;
export const NEUTRAL_GIFT_FRIENDSHIP = 4;

export const MAX_FRIENDSHIP = 100;

// ─── Items ────────────────────────────────────────────────────────────────────

export interface ItemConfig {
  id: ItemId;
  name: string;
  /** Produce is harvested from a crop; materials are foraged in the wilds. */
  kind: "produce" | "material";
  glyph: string;
}

export const ITEMS: Record<ItemId, ItemConfig> = {
  "parsnip-root": {
    id: "parsnip-root",
    name: "Parsnip",
    kind: "produce",
    glyph: "🥕",
  },
  "cornflower-bloom": {
    id: "cornflower-bloom",
    name: "Cornflower",
    kind: "produce",
    glyph: "🌸",
  },
  strawberry: {
    id: "strawberry",
    name: "Strawberry",
    kind: "produce",
    glyph: "🍓",
  },
  pumpkin: { id: "pumpkin", name: "Pumpkin", kind: "produce", glyph: "🎃" },
  "moonpetal-bloom": {
    id: "moonpetal-bloom",
    name: "Moonpetal",
    kind: "produce",
    glyph: "🌙",
  },
  "wheat-sheaf": {
    id: "wheat-sheaf",
    name: "Wheat Sheaf",
    kind: "produce",
    glyph: "🌾",
  },
  "sunflower-head": {
    id: "sunflower-head",
    name: "Sunflower",
    kind: "produce",
    glyph: "🌻",
  },
  honeymelon: {
    id: "honeymelon",
    name: "Honeymelon",
    kind: "produce",
    glyph: "🍈",
  },
  acorn: { id: "acorn", name: "Acorn", kind: "material", glyph: "🌰" },
  "bramble-berry": {
    id: "bramble-berry",
    name: "Bramble Berry",
    kind: "material",
    glyph: "🫐",
  },
  feather: { id: "feather", name: "Feather", kind: "material", glyph: "🪶" },
  "river-clay": {
    id: "river-clay",
    name: "River Clay",
    kind: "material",
    glyph: "🧱",
  },
  reed: { id: "reed", name: "Reed", kind: "material", glyph: "🌾" },
  "smooth-stone": {
    id: "smooth-stone",
    name: "Smooth Stone",
    kind: "material",
    glyph: "🪨",
  },
  "wild-honey": {
    id: "wild-honey",
    name: "Wild Honey",
    kind: "material",
    glyph: "🍯",
  },
  "oak-resin": {
    id: "oak-resin",
    name: "Oak Resin",
    kind: "material",
    glyph: "🟤",
  },
  chanterelle: {
    id: "chanterelle",
    name: "Chanterelle",
    kind: "material",
    glyph: "🍄",
  },
  "crab-apple": {
    id: "crab-apple",
    name: "Crab Apple",
    kind: "material",
    glyph: "🍏",
  },
  elderflower: {
    id: "elderflower",
    name: "Elderflower",
    kind: "material",
    glyph: "💮",
  },
  walnut: { id: "walnut", name: "Walnut", kind: "material", glyph: "🥜" },
  "wild-mint": {
    id: "wild-mint",
    name: "Wild Mint",
    kind: "material",
    glyph: "🌿",
  },
  glowcap: { id: "glowcap", name: "Glowcap", kind: "material", glyph: "✨" },
  amber: { id: "amber", name: "Amber", kind: "material", glyph: "🔶" },
};

// ─── Crops ────────────────────────────────────────────────────────────────────

export interface CropConfig {
  id: CropId;
  name: string;
  /** Points charged for one seed packet in the shop. */
  seedCost: number;
  /** Calendar days from planting to ripe. */
  daysToMature: number;
  /** Produce yielded by an unwatered harvest; watering adds one per watered day. */
  baseYield: number;
  produceId: ItemId;
  glyph: string;
  blurb: string;
}

export const CROPS: Record<CropId, CropConfig> = {
  parsnip: {
    id: "parsnip",
    name: "Parsnip",
    seedCost: 4,
    daysToMature: 2,
    baseYield: 1,
    produceId: "parsnip-root",
    glyph: "🥕",
    blurb: "Quick, forgiving, and happy in cold soil. Every farm starts here.",
  },
  cornflower: {
    id: "cornflower",
    name: "Cornflower",
    seedCost: 6,
    daysToMature: 3,
    baseYield: 1,
    produceId: "cornflower-bloom",
    glyph: "🌸",
    blurb: "A field-edge blue that the whole village seems fond of.",
  },
  strawberry: {
    id: "strawberry",
    name: "Strawberry",
    seedCost: 10,
    daysToMature: 4,
    baseYield: 2,
    produceId: "strawberry",
    glyph: "🍓",
    blurb: "Thirsty and worth it — rewards a diligent watering can.",
  },
  pumpkin: {
    id: "pumpkin",
    name: "Pumpkin",
    seedCost: 14,
    daysToMature: 5,
    baseYield: 2,
    produceId: "pumpkin",
    glyph: "🎃",
    blurb: "Slow to swell, but nothing else fills a harvest table so well.",
  },
  moonpetal: {
    id: "moonpetal",
    name: "Moonpetal",
    seedCost: 22,
    daysToMature: 7,
    baseYield: 3,
    produceId: "moonpetal-bloom",
    glyph: "🌙",
    blurb: "Opens only after dark. Nobody agrees on where the seeds came from.",
  },
  wheat: {
    id: "wheat",
    name: "Golden Wheat",
    seedCost: 5,
    daysToMature: 3,
    baseYield: 2,
    produceId: "wheat-sheaf",
    glyph: "🌾",
    blurb: "Wren swears by it. Cheap, cheerful, and the mill is always hungry.",
  },
  sunflower: {
    id: "sunflower",
    name: "Sunflower",
    seedCost: 12,
    daysToMature: 4,
    baseYield: 2,
    produceId: "sunflower-head",
    glyph: "🌻",
    blurb:
      "Turns to follow you down the row. Marigold says that’s a good sign.",
  },
  honeymelon: {
    id: "honeymelon",
    name: "Honeymelon",
    seedCost: 18,
    daysToMature: 6,
    baseYield: 2,
    produceId: "honeymelon",
    glyph: "🍈",
    blurb: "Sweet as the name. Wants all the water you can give it.",
  },
};

export const ALL_CROP_IDS = Object.keys(CROPS) as CropId[];

/** Stage labels, in order. The last is the only harvestable one. */
export const GROWTH_STAGES = ["Seed", "Sprout", "Budding", "Ripe"] as const;
export type GrowthStage = (typeof GROWTH_STAGES)[number];

// ─── Wild sites ───────────────────────────────────────────────────────────────

export interface SiteConfig {
  id: SiteId;
  name: string;
  blurb: string;
  glyph: string;
  /** Materials a forage trip here can turn up, drawn uniformly. */
  materials: readonly ItemId[];
}

export const SITES: Record<SiteId, SiteConfig> = {
  hedgerow: {
    id: "hedgerow",
    name: "The Hedgerow",
    blurb:
      "The tangled boundary at the top of the field. Always something in it.",
    glyph: "🌳",
    materials: ["acorn", "bramble-berry", "feather"],
  },
  riverbank: {
    id: "riverbank",
    name: "The Riverbank",
    blurb: "Slow water, soft banks, and clay worth carrying home.",
    glyph: "🏞️",
    materials: ["river-clay", "reed", "smooth-stone"],
  },
  stonewood: {
    id: "stonewood",
    name: "Stonewood",
    blurb: "Old trees over older rocks. The best foraging in the valley.",
    glyph: "🪵",
    materials: ["wild-honey", "oak-resin", "chanterelle"],
  },
  orchard: {
    id: "orchard",
    name: "The Old Orchard",
    blurb:
      "Wren’s gran planted it. Nobody has pruned it since, and it doesn’t mind.",
    glyph: "🍎",
    materials: ["crab-apple", "elderflower", "walnut"],
  },
  fen: {
    id: "fen",
    name: "Misty Fen",
    blurb: "Where the river forgets which way it was going. Things glow here.",
    glyph: "🌫️",
    materials: ["wild-mint", "glowcap", "amber"],
  },
};

export const ALL_SITE_IDS = Object.keys(SITES) as SiteId[];

// ─── Neighbours ───────────────────────────────────────────────────────────────

export interface NeighbourConfig {
  id: NeighbourId;
  name: string;
  role: string;
  blurb: string;
  glyph: string;
  /** Items this neighbour is especially pleased to receive. */
  likedItemIds: readonly ItemId[];
}

export const NEIGHBOURS: Record<NeighbourId, NeighbourConfig> = {
  nessa: {
    id: "nessa",
    name: "Nessa",
    role: "Cook at the Hollow Inn",
    blurb: "Runs the inn kitchen and judges a valley entirely by its produce.",
    glyph: "🧑‍🍳",
    likedItemIds: [
      "parsnip-root",
      "strawberry",
      "pumpkin",
      "chanterelle",
      "honeymelon",
      "wild-mint",
    ],
  },
  bram: {
    id: "bram",
    name: "Bram",
    role: "Woodsman",
    blurb:
      "Knows every path in the wilds and will happily tell you all of them.",
    glyph: "🧑‍🌾",
    likedItemIds: [
      "acorn",
      "oak-resin",
      "smooth-stone",
      "feather",
      "walnut",
      "amber",
    ],
  },
  marigold: {
    id: "marigold",
    name: "Marigold",
    role: "Beekeeper and potter",
    blurb:
      "Keeps bees at the top of the lane and fires pots when the mood takes her.",
    glyph: "🧑‍🎨",
    likedItemIds: [
      "wild-honey",
      "cornflower-bloom",
      "river-clay",
      "reed",
      "sunflower-head",
      "glowcap",
    ],
  },
  wren: {
    id: "wren",
    name: "Wren",
    role: "Miller at the old mill",
    blurb:
      "Took on the mill at the bottom of the lane and bakes whatever it grinds.",
    glyph: "👩‍🦰",
    likedItemIds: [
      "bramble-berry",
      "wheat-sheaf",
      "elderflower",
      "walnut",
      "sunflower-head",
    ],
  },
};

export const ALL_NEIGHBOUR_IDS = Object.keys(NEIGHBOURS) as NeighbourId[];

/** Friendship tier names, paired with the friendship value that unlocks them. */
export const FRIENDSHIP_TIERS = [
  { threshold: 0, name: "Stranger" },
  { threshold: 20, name: "Acquaintance" },
  { threshold: 40, name: "Friend" },
  { threshold: 60, name: "Confidant" },
  { threshold: 85, name: "Dear Friend" },
] as const;

// ─── Keepsakes ────────────────────────────────────────────────────────────────

/**
 * Something a neighbour gives the farm to keep, which then stands in the Vale
 * for good. Never stored: a keepsake is on the map exactly when the quest that
 * gives it is in `completedQuestIds`.
 */
export type KeepsakeId =
  | "scarecrow"
  | "beehive"
  | "well"
  | "lanterns"
  | "birdbath"
  | "urns"
  | "bunting"
  | "picnic-table"
  | "herb-box"
  | "bench"
  | "rose-arch"
  | "windmill"
  | "maypole";

export interface KeepsakeConfig {
  id: KeepsakeId;
  name: string;
  glyph: string;
  /** Shown under the prompt when the farmer walks up to it. */
  remark: string;
}

export const KEEPSAKES: Record<KeepsakeId, KeepsakeConfig> = {
  scarecrow: {
    id: "scarecrow",
    name: "Scarecrow",
    glyph: "🧑‍🌾",
    remark: "Bram stuffed it. It looks a little like Bram.",
  },
  beehive: {
    id: "beehive",
    name: "Beehive",
    glyph: "🐝",
    remark: "A swarm of Marigold’s bees, humming about their business.",
  },
  well: {
    id: "well",
    name: "Well",
    glyph: "🪣",
    remark: "Deep, cold and sweet. The bucket squeaks on the way up.",
  },
  lanterns: {
    id: "lanterns",
    name: "Pumpkin lanterns",
    glyph: "🏮",
    remark: "Carved grins, lit every evening from the fair onwards.",
  },
  birdbath: {
    id: "birdbath",
    name: "Birdbath",
    glyph: "🐦",
    remark: "Never empty of sparrows for more than a minute.",
  },
  urns: {
    id: "urns",
    name: "Glowing urns",
    glyph: "🏺",
    remark: "Marigold’s glowcap glaze. They shine faintly after dark.",
  },
  bunting: {
    id: "bunting",
    name: "Festival bunting",
    glyph: "🎏",
    remark: "Left up after the harvest festival. Nobody has the heart.",
  },
  "picnic-table": {
    id: "picnic-table",
    name: "Picnic table",
    glyph: "🧺",
    remark: "Room for four good friends, and a fifth if they squeeze.",
  },
  "herb-box": {
    id: "herb-box",
    name: "Herb box",
    glyph: "🌱",
    remark: "Nessa’s own cuttings. She checks on them when she visits.",
  },
  bench: {
    id: "bench",
    name: "Oak bench",
    glyph: "🪑",
    remark: "Bram carved it from a fallen Stonewood oak. It’s very sturdy.",
  },
  "rose-arch": {
    id: "rose-arch",
    name: "Rose arch",
    glyph: "🌹",
    remark: "Marigold trained the roses herself. They smell of summer.",
  },
  windmill: {
    id: "windmill",
    name: "Little windmill",
    glyph: "🌬️",
    remark: "A small cousin of Wren’s mill. The sails turn in any breeze.",
  },
  maypole: {
    id: "maypole",
    name: "Maypole",
    glyph: "🎀",
    remark: "The whole valley danced round it until dark. You were there.",
  },
};

export const ALL_KEEPSAKE_IDS = Object.keys(KEEPSAKES) as KeepsakeId[];

// ─── Quests ───────────────────────────────────────────────────────────────────

/** A friendship level a neighbour must have reached. */
export interface FriendshipCondition {
  neighbourId: NeighbourId;
  level: number;
}

/**
 * What the player must have to hand in. Both parts are checked against current
 * state, never against a stored counter — so progress can't desync.
 */
export interface QuestRequirement {
  items?: Partial<Record<ItemId, number>>;
  friendship?: readonly FriendshipCondition[];
}

/** When a quest appears on the board. Omit both parts for a starting quest. */
export interface QuestUnlock {
  afterQuestIds?: readonly QuestId[];
  friendship?: readonly FriendshipCondition[];
}

/**
 * Quest payouts stay inside the game — seeds, items, land and goodwill.
 * Points are never awarded (see ADR 0003 and ADR 0005).
 */
export interface QuestReward {
  seeds?: Partial<Record<CropId, number>>;
  items?: Partial<Record<ItemId, number>>;
  unlockCropId?: CropId;
  unlockSiteId?: SiteId;
  extraPlots?: number;
  /** Something for the farm to keep, which stands in the Vale from then on. */
  keepsakeId?: KeepsakeId;
  /** Friendship granted to the quest giver on completion. */
  friendship?: number;
}

export interface QuestConfig {
  id: QuestId;
  giverId: NeighbourId;
  title: string;
  description: string;
  unlock: QuestUnlock;
  requirement: QuestRequirement;
  reward: QuestReward;
  /** Shown once the quest is completed. */
  thanks: string;
}

export const QUESTS: Record<QuestId, QuestConfig> = {
  "a-bed-for-parsnips": {
    id: "a-bed-for-parsnips",
    giverId: "nessa",
    title: "A Bed for Parsnips",
    description:
      "Nessa needs three parsnips for the inn’s soup pot. Plant, water and harvest them.",
    unlock: {},
    requirement: { items: { "parsnip-root": 3 } },
    reward: {
      unlockCropId: "cornflower",
      seeds: { cornflower: 3 },
      friendship: 10,
    },
    thanks:
      '"Perfect. Here — cornflower seeds. Marigold’s mad for them, if you’re looking to make friends."',
  },
  "down-to-the-riverbank": {
    id: "down-to-the-riverbank",
    giverId: "bram",
    title: "Down to the Riverbank",
    description:
      "Bram will show you the river path — once you prove you can forage the hedgerow. Bring two acorns and two bramble berries.",
    unlock: { afterQuestIds: ["a-bed-for-parsnips"] },
    requirement: { items: { acorn: 2, "bramble-berry": 2 } },
    reward: { unlockSiteId: "riverbank", friendship: 10 },
    thanks:
      '"You’ve a good eye. Follow the lane past the stile — the riverbank’s yours to forage now."',
  },
  "clay-for-the-kiln": {
    id: "clay-for-the-kiln",
    giverId: "marigold",
    title: "Clay for the Kiln",
    description:
      "Marigold is firing a batch of pots and is short on clay. Four river clay and two reeds should do it.",
    unlock: { afterQuestIds: ["down-to-the-riverbank"] },
    requirement: { items: { "river-clay": 4, reed: 2 } },
    reward: { extraPlots: 3, friendship: 12 },
    thanks:
      '"Wonderful. And I had Bram clear the old beds behind your barn — three more plots, no arguing."',
  },
  "sweet-on-you": {
    id: "sweet-on-you",
    giverId: "marigold",
    title: "Sweet on You",
    description:
      "Marigold keeps the Stonewood path to herself, and only walks it with people she trusts. Become a Friend to her first.",
    unlock: { afterQuestIds: ["clay-for-the-kiln"] },
    requirement: { friendship: [{ neighbourId: "marigold", level: 45 }] },
    reward: {
      unlockCropId: "strawberry",
      seeds: { strawberry: 3 },
      unlockSiteId: "stonewood",
    },
    thanks:
      '"Come on then. Stonewood’s through the top gate — and take these strawberry seeds, they do well by you."',
  },
  "the-harvest-table": {
    id: "the-harvest-table",
    giverId: "nessa",
    title: "The Harvest Table",
    description:
      "The inn’s autumn supper needs a centrepiece. Nessa asks for four strawberries and three jars of wild honey.",
    unlock: { afterQuestIds: ["sweet-on-you"] },
    requirement: { items: { strawberry: 4, "wild-honey": 3 } },
    reward: {
      unlockCropId: "pumpkin",
      seeds: { pumpkin: 2 },
      friendship: 12,
    },
    thanks:
      '"That’s the supper saved. Take these pumpkin seeds — I want the biggest one you can grow."',
  },
  "three-good-friends": {
    id: "three-good-friends",
    giverId: "bram",
    title: "Three Good Friends",
    description:
      "Bram reckons the valley only really opens up to someone the whole village knows. Become a Confidant to Nessa, Bram and Marigold.",
    unlock: { afterQuestIds: ["the-harvest-table"] },
    requirement: {
      friendship: [
        { neighbourId: "nessa", level: 60 },
        { neighbourId: "bram", level: 60 },
        { neighbourId: "marigold", level: 60 },
      ],
    },
    reward: {
      unlockCropId: "moonpetal",
      seeds: { moonpetal: 3 },
      extraPlots: 3,
    },
    thanks:
      '"Told you. Now — nobody knows where moonpetal comes from, and nobody plants it but friends. Off you go."',
  },

  // ─── Chapter one: new faces ──────────────────────────────────────────────
  "a-new-face-at-the-mill": {
    id: "a-new-face-at-the-mill",
    giverId: "wren",
    title: "A New Face at the Mill",
    description:
      "Wren has just taken on the old mill at the bottom of the lane and her pantry is bare. Two parsnips and two bramble berries would see her through the week.",
    unlock: { afterQuestIds: ["a-bed-for-parsnips"] },
    requirement: { items: { "parsnip-root": 2, "bramble-berry": 2 } },
    reward: { unlockCropId: "wheat", seeds: { wheat: 4 }, friendship: 10 },
    thanks:
      '"You’re a lifesaver. Here — wheat seed from the mill loft. Grow me some and I’ll show you what it’s for."',
  },
  "a-scarecrow-for-the-field": {
    id: "a-scarecrow-for-the-field",
    giverId: "bram",
    title: "A Scarecrow for the Field",
    description:
      "The rooks have found your seed beds. Bram will knock up a scarecrow if you bring three feathers for its hat and two reeds for stuffing.",
    unlock: { afterQuestIds: ["down-to-the-riverbank"] },
    requirement: { items: { feather: 3, reed: 2 } },
    reward: { keepsakeId: "scarecrow", seeds: { parsnip: 3 }, friendship: 8 },
    thanks:
      '"There. Handsome fellow, isn’t he? I’ve stood him by your beds — the rooks won’t trouble you now."',
  },
  "first-loaves": {
    id: "first-loaves",
    giverId: "wren",
    title: "First Loaves",
    description:
      "The millstones haven’t turned in years. Wren wants four sheaves of wheat to grind the first flour and bake the first loaves.",
    unlock: { afterQuestIds: ["a-new-face-at-the-mill"] },
    requirement: { items: { "wheat-sheaf": 4 } },
    reward: { seeds: { wheat: 3, cornflower: 2 }, friendship: 12 },
    thanks:
      '"Listen to that — the stones are singing. The first loaf is yours. So is the second, actually."',
  },
  "a-posy-for-the-inn": {
    id: "a-posy-for-the-inn",
    giverId: "nessa",
    title: "A Posy for the Inn",
    description:
      "The inn’s tables look bare. Nessa asks for three cornflowers and two bramble berries to brighten them up.",
    unlock: { afterQuestIds: ["clay-for-the-kiln"] },
    requirement: { items: { "cornflower-bloom": 3, "bramble-berry": 2 } },
    reward: { seeds: { parsnip: 4, cornflower: 2 }, friendship: 10 },
    thanks:
      '"Oh, that’s lovely. The regulars won’t say anything, but they’ll notice. Take these seeds for your trouble."',
  },

  // ─── Chapter two: the orchard ────────────────────────────────────────────
  "honey-for-the-hives": {
    id: "honey-for-the-hives",
    giverId: "marigold",
    title: "Honey for the Hives",
    description:
      "One of Marigold’s colonies wants a new home. Bring two jars of wild honey to coax them and three cornflowers to keep them happy.",
    unlock: { afterQuestIds: ["sweet-on-you"] },
    requirement: { items: { "wild-honey": 2, "cornflower-bloom": 3 } },
    reward: { keepsakeId: "beehive", friendship: 10 },
    thanks:
      '"They’ve taken to it! The hive’s on your farm now — look after them and they’ll look after your flowers."',
  },
  "the-orchard-gate": {
    id: "the-orchard-gate",
    giverId: "wren",
    title: "The Orchard Gate",
    description:
      "Wren’s gran planted an orchard by the north hedge, and its gate has rusted shut. Two lumps of oak resin will ease the hinge; three smooth stones will prop it open.",
    unlock: { afterQuestIds: ["first-loaves", "sweet-on-you"] },
    requirement: { items: { "oak-resin": 2, "smooth-stone": 3 } },
    reward: { unlockSiteId: "orchard", friendship: 10 },
    thanks:
      '"It moved! Gran would be so pleased. The Old Orchard’s yours to forage — mind the walnuts, they drop without warning."',
  },
  "bramble-jelly": {
    id: "bramble-jelly",
    giverId: "nessa",
    title: "Bramble Jelly",
    description:
      "Nessa’s famous jelly needs crab apples to set. Three crab apples, three bramble berries and a jar of wild honey.",
    unlock: { afterQuestIds: ["the-orchard-gate"] },
    requirement: {
      items: { "crab-apple": 3, "bramble-berry": 3, "wild-honey": 1 },
    },
    reward: { seeds: { strawberry: 3 }, friendship: 10 },
    thanks:
      '"It’s setting beautifully. You’ll get the first jar — and some strawberry seed, because the next batch wants them."',
  },
  "a-sunny-disposition": {
    id: "a-sunny-disposition",
    giverId: "marigold",
    title: "A Sunny Disposition",
    description:
      "Marigold is brewing elderflower cordial for the bees’ helpers. Three elderflowers and two strawberries, please.",
    unlock: { afterQuestIds: ["the-orchard-gate"] },
    requirement: { items: { elderflower: 3, strawberry: 2 } },
    reward: {
      unlockCropId: "sunflower",
      seeds: { sunflower: 3 },
      friendship: 10,
    },
    thanks:
      '"Here’s to you. And here — sunflower seeds. Plant them where they can see you working."',
  },
  "a-well-for-the-farm": {
    id: "a-well-for-the-farm",
    giverId: "bram",
    title: "A Well for the Farm",
    description:
      "Carrying water up from the river is no way to live. Bram will dig you a well if you bring five smooth stones and three river clay.",
    unlock: {
      afterQuestIds: ["a-scarecrow-for-the-field", "clay-for-the-kiln"],
    },
    requirement: { items: { "smooth-stone": 5, "river-clay": 3 } },
    reward: { keepsakeId: "well", friendship: 10 },
    thanks:
      '"Struck water at twelve feet. Sweetest in the valley, I reckon — don’t tell Marigold I said so."',
  },
  "walnut-bread": {
    id: "walnut-bread",
    giverId: "wren",
    title: "Walnut Bread",
    description:
      "Wren wants to try her gran’s walnut loaf. Three walnuts from the orchard and four sheaves of wheat.",
    unlock: { afterQuestIds: ["the-orchard-gate"] },
    requirement: { items: { walnut: 3, "wheat-sheaf": 4 } },
    reward: { extraPlots: 2, friendship: 12 },
    thanks:
      '"Just like hers. I had a word with Bram — there’s two more beds dug at the end of your rows."',
  },
  "lanterns-for-the-fair": {
    id: "lanterns-for-the-fair",
    giverId: "nessa",
    title: "Lanterns for the Fair",
    description:
      "The autumn fair needs lighting, and Nessa has decided pumpkins are the answer. Three pumpkins to carve.",
    unlock: { afterQuestIds: ["the-harvest-table"] },
    requirement: { items: { pumpkin: 3 } },
    reward: { keepsakeId: "lanterns", seeds: { pumpkin: 1 }, friendship: 10 },
    thanks:
      '"Look at their little faces! I saved the best ones for your farm. They’ll light your way home."',
  },
  "birds-of-a-feather": {
    id: "birds-of-a-feather",
    giverId: "bram",
    title: "Birds of a Feather",
    description:
      "With the scarecrow up, the songbirds have nowhere to go. Bram wants four feathers and two river clay to make them a bath.",
    unlock: { afterQuestIds: ["a-well-for-the-farm"] },
    requirement: { items: { feather: 4, "river-clay": 2 } },
    reward: { keepsakeId: "birdbath", friendship: 10 },
    thanks:
      '"Fair’s fair — the rooks get a scarecrow, the sparrows get a bath. Listen to them."',
  },

  // ─── Chapter three: the fen ──────────────────────────────────────────────
  "into-the-fen": {
    id: "into-the-fen",
    giverId: "bram",
    title: "Into the Fen",
    description:
      "Misty Fen swallows the path after dark. Bram will take you in if you bring a moonpetal to light the way and two oak resin for torches.",
    unlock: { afterQuestIds: ["three-good-friends"] },
    requirement: { items: { "moonpetal-bloom": 1, "oak-resin": 2 } },
    reward: { unlockSiteId: "fen", friendship: 10 },
    thanks:
      '"Stay on the stones and follow the glow. The fen’s open to you now — not many can say that."',
  },
  "mint-tea": {
    id: "mint-tea",
    giverId: "nessa",
    title: "Mint Tea",
    description:
      "The inn’s regulars have caught a cold, all at once, as usual. Nessa needs three sprigs of wild mint and two jars of wild honey.",
    unlock: { afterQuestIds: ["into-the-fen"] },
    requirement: { items: { "wild-mint": 3, "wild-honey": 2 } },
    reward: { seeds: { pumpkin: 2, strawberry: 2 }, friendship: 12 },
    thanks:
      '"That’ll have them back on their feet and complaining in no time. Bless you."',
  },
  "glowcap-glaze": {
    id: "glowcap-glaze",
    giverId: "marigold",
    title: "Glowcap Glaze",
    description:
      "Marigold has heard that ground glowcap makes a glaze that shines after dark. Three glowcaps and four river clay to find out.",
    unlock: { afterQuestIds: ["into-the-fen"] },
    requirement: { items: { glowcap: 3, "river-clay": 4 } },
    reward: { keepsakeId: "urns", friendship: 10 },
    thanks:
      '"It works! Look at them glow. The best pair are on your farm — I couldn’t think of anyone better."',
  },
  "amber-for-the-mill": {
    id: "amber-for-the-mill",
    giverId: "wren",
    title: "Amber for the Mill",
    description:
      "The old mill’s bearings are wearing thin. Wren says fen amber makes the best bushing, and sunflower oil the best grease: two amber, three sunflowers.",
    unlock: {
      afterQuestIds: ["into-the-fen", "walnut-bread", "a-sunny-disposition"],
    },
    requirement: { items: { amber: 2, "sunflower-head": 3 } },
    reward: {
      unlockCropId: "honeymelon",
      seeds: { honeymelon: 2 },
      friendship: 12,
    },
    thanks:
      '"Smooth as silk. Gran kept honeymelon seed in the mill loft for a special occasion. I think this is one."',
  },
  "the-harvest-festival": {
    id: "the-harvest-festival",
    giverId: "nessa",
    title: "The Harvest Festival",
    description:
      "The whole valley is coming to the festival, and the inn is doing the feast. Nessa needs two pumpkins, two honeymelons, four sheaves of wheat and three strawberries.",
    unlock: { afterQuestIds: ["amber-for-the-mill", "lanterns-for-the-fair"] },
    requirement: {
      items: {
        pumpkin: 2,
        honeymelon: 2,
        "wheat-sheaf": 4,
        strawberry: 3,
      },
    },
    reward: { keepsakeId: "bunting", extraPlots: 2, friendship: 15 },
    thanks:
      '"Best feast the Hollow Inn has ever put on, and half of it was yours. The bunting’s on your farm, and Bram’s cleared you two more beds."',
  },
  "four-good-friends": {
    id: "four-good-friends",
    giverId: "wren",
    title: "Four Good Friends",
    description:
      "Wren wants a picnic with everyone who made her welcome. Become a Confidant to Nessa, Bram, Marigold and Wren.",
    unlock: { afterQuestIds: ["three-good-friends", "first-loaves"] },
    requirement: {
      friendship: [
        { neighbourId: "nessa", level: 60 },
        { neighbourId: "bram", level: 60 },
        { neighbourId: "marigold", level: 60 },
        { neighbourId: "wren", level: 60 },
      ],
    },
    reward: { keepsakeId: "picnic-table", seeds: { wheat: 4 } },
    thanks:
      '"Everyone came! The table’s staying at yours — it’s the only farm with room for all of us."',
  },

  // ─── Dear friends ────────────────────────────────────────────────────────
  "the-innkeepers-recipe": {
    id: "the-innkeepers-recipe",
    giverId: "nessa",
    title: "The Innkeeper’s Recipe",
    description:
      "Nessa has one recipe she has never written down. She’ll teach it to a Dear Friend — bring three chanterelles and two pumpkins and she’ll cook it with you.",
    unlock: { afterQuestIds: ["four-good-friends"] },
    requirement: {
      items: { chanterelle: 3, pumpkin: 2 },
      friendship: [{ neighbourId: "nessa", level: 85 }],
    },
    reward: { keepsakeId: "herb-box", seeds: { pumpkin: 3 } },
    thanks:
      '"Now you know it, it’s half yours. I’ve planted you a herb box so you’ll never be short of the green bits."',
  },
  "the-oldest-path": {
    id: "the-oldest-path",
    giverId: "bram",
    title: "The Oldest Path",
    description:
      "There’s one path Bram has never shown anyone. He’ll walk it with a Dear Friend — bring three walnuts and a piece of amber for the old waymarker.",
    unlock: {
      afterQuestIds: ["four-good-friends", "into-the-fen", "the-orchard-gate"],
    },
    requirement: {
      items: { walnut: 3, amber: 1 },
      friendship: [{ neighbourId: "bram", level: 85 }],
    },
    reward: { keepsakeId: "bench", seeds: { moonpetal: 2 } },
    thanks:
      '"It ends at the oak my father planted. It came down in the spring, so I made you something from it."',
  },
  "the-finest-pot": {
    id: "the-finest-pot",
    giverId: "marigold",
    title: "The Finest Pot",
    description:
      "Marigold wants to throw the best pot of her life, and only a Dear Friend can help. Two glowcaps for the glaze and two moonpetals to press into the clay.",
    unlock: { afterQuestIds: ["four-good-friends", "glowcap-glaze"] },
    requirement: {
      items: { glowcap: 2, "moonpetal-bloom": 2 },
      friendship: [{ neighbourId: "marigold", level: 85 }],
    },
    reward: { keepsakeId: "rose-arch", seeds: { cornflower: 4 } },
    thanks:
      '"It came out of the kiln perfect. I’m keeping the pot — but I’ve grown you a rose arch, which is better."',
  },
  "the-sails-turn": {
    id: "the-sails-turn",
    giverId: "wren",
    title: "The Sails Turn",
    description:
      "Wren has been building something in secret, and she wants a Dear Friend to see it first. Six sheaves of wheat and three sunflowers to finish it.",
    unlock: { afterQuestIds: ["four-good-friends", "amber-for-the-mill"] },
    requirement: {
      items: { "wheat-sheaf": 6, "sunflower-head": 3 },
      friendship: [{ neighbourId: "wren", level: 85 }],
    },
    reward: { keepsakeId: "windmill", seeds: { wheat: 4, honeymelon: 2 } },
    thanks:
      '"A windmill of your own! Only a little one. It can’t grind anything, but it turns, and that’s the point."',
  },
  "the-heart-of-the-vale": {
    id: "the-heart-of-the-vale",
    giverId: "bram",
    title: "The Heart of the Vale",
    description:
      "The valley wants to thank you properly. Bring one of everything your farm can grow, and the whole village will be waiting.",
    unlock: {
      afterQuestIds: [
        "the-innkeepers-recipe",
        "the-oldest-path",
        "the-finest-pot",
        "the-sails-turn",
        "the-harvest-festival",
      ],
    },
    requirement: {
      items: {
        "parsnip-root": 1,
        "cornflower-bloom": 1,
        strawberry: 1,
        pumpkin: 1,
        "moonpetal-bloom": 1,
        "wheat-sheaf": 1,
        "sunflower-head": 1,
        honeymelon: 1,
      },
    },
    reward: { keepsakeId: "maypole", seeds: { moonpetal: 3 } },
    thanks:
      '"Everyone’s here, and it’s all for you. Meadowmere wouldn’t be Meadowmere without your farm in it."',
  },
};

export const ALL_QUEST_IDS = Object.keys(QUESTS) as QuestId[];
