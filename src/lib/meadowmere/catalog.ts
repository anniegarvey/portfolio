import type { CropId, ItemId, NeighbourId, QuestId, SiteId } from "./schema";

// ─── Tuning ───────────────────────────────────────────────────────────────────

/** Plots the farm starts with. Quest rewards add more, up to MAX_PLOTS. */
export const STARTING_PLOTS = 6;
export const MAX_PLOTS = 12;

/** Forage trips available each day, refilled by the daily advance. */
export const FORAGES_PER_DAY = 3;

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
    likedItemIds: ["parsnip-root", "strawberry", "pumpkin", "chanterelle"],
  },
  bram: {
    id: "bram",
    name: "Bram",
    role: "Woodsman",
    blurb:
      "Knows every path in the wilds and will happily tell you all of them.",
    glyph: "🧑‍🌾",
    likedItemIds: ["acorn", "oak-resin", "smooth-stone", "feather"],
  },
  marigold: {
    id: "marigold",
    name: "Marigold",
    role: "Beekeeper and potter",
    blurb:
      "Keeps bees at the top of the lane and fires pots when the mood takes her.",
    glyph: "🧑‍🎨",
    likedItemIds: ["wild-honey", "cornflower-bloom", "river-clay", "reed"],
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
      "Bram reckons the valley only really opens up to someone the whole village knows. Become a Confidant to all three neighbours.",
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
};

export const ALL_QUEST_IDS = Object.keys(QUESTS) as QuestId[];
