import type { BackgroundId } from "./schema";

// ─── Background Config ────────────────────────────────────────────────────────

export interface BackgroundConfig {
  id: BackgroundId;
  label: string;
  description: string;
  cost: number; // 0 = always free
  /** CSS border-color for the garden/tend-view container. Uses light-dark(). */
  borderColor: string;
}

// ─── Configs ─────────────────────────────────────────────────────────────────

export const BACKGROUND_CONFIGS: Record<BackgroundId, BackgroundConfig> = {
  garden: {
    id: "garden",
    label: "Garden",
    description:
      "A peaceful garden floor with soft grass patches and a worn stone path.",
    cost: 0,
    borderColor: "light-dark(#b8d4a0, #3a5a30)",
  },

  "zen-garden": {
    id: "zen-garden",
    label: "Zen Garden",
    description:
      "Raked sand patterns and smooth stones invite stillness and focus.",
    cost: 1000,
    borderColor: "light-dark(#c8bea0, #3a3220)",
  },

  "misty-mountain": {
    id: "misty-mountain",
    label: "Misty Mountain",
    description: "Layered peaks dissolve into cool mist. Serene and vast.",
    cost: 1000,
    borderColor: "light-dark(#a0b0c8, #2a3048)",
  },

  "night-garden": {
    id: "night-garden",
    label: "Night Garden",
    description: "Warm lantern glow and a moonlit sky. Best tended after dark.",
    cost: 1000,
    borderColor: "light-dark(#38365a, #28264a)",
  },

  "autumn-forest": {
    id: "autumn-forest",
    label: "Autumn Forest",
    description: "Falling leaves and warm amber light. A garden turning gold.",
    cost: 1000,
    borderColor: "light-dark(#c0903c, #3a2010)",
  },
};

/** Backgrounds that can be purchased from the shop. */
export const PURCHASABLE_BACKGROUND_IDS: BackgroundId[] = [
  "zen-garden",
  "misty-mountain",
  "night-garden",
  "autumn-forest",
];
