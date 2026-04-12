import type { FertiliserId, ShopItemId } from "./schema";

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

// ─── Shop Catalog ─────────────────────────────────────────────────────────────

export type ShopCategory =
  | "species"
  | "tool"
  | "fertiliser"
  | "pot"
  | "stand"
  | "background";

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
  // Backgrounds (1000 each)
  {
    id: "zen-garden",
    label: "Zen Garden",
    category: "background",
    cost: 1000,
    description:
      "Raked sand patterns and smooth stones invite stillness and focus.",
  },
  {
    id: "misty-mountain",
    label: "Misty Mountain",
    category: "background",
    cost: 1000,
    description: "Layered peaks dissolve into cool mist. Serene and vast.",
  },
  {
    id: "night-garden",
    label: "Night Garden",
    category: "background",
    cost: 1000,
    description: "Warm lantern glow and a moonlit sky. Best tended after dark.",
  },
  {
    id: "autumn-forest",
    label: "Autumn Forest",
    category: "background",
    cost: 1000,
    description: "Falling leaves and warm amber light. A garden turning gold.",
  },
];
