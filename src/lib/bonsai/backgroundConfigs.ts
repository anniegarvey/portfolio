import type { BackgroundId } from "./schema";

// ─── Background Config ────────────────────────────────────────────────────────

export interface BackgroundConfig {
  id: BackgroundId;
  label: string;
  description: string;
  cost: number; // 0 = always free
  /** CSS background-image value (gradients). Uses light-dark() for light/dark mode. */
  backgroundImage: string;
  /** CSS background-color fallback. Uses light-dark(). */
  backgroundColor: string;
  /** CSS border-color value. Uses light-dark(). */
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
    backgroundImage: [
      // Grass tufts near the ground
      "radial-gradient(ellipse at 12% 84%, light-dark(#92c060, #1c3414) 0%, transparent 26%)",
      "radial-gradient(ellipse at 38% 90%, light-dark(#9ec86a, #1e3816) 0%, transparent 20%)",
      "radial-gradient(ellipse at 63% 86%, light-dark(#96c262, #1a3012) 0%, transparent 24%)",
      "radial-gradient(ellipse at 88% 82%, light-dark(#90be5c, #182e10) 0%, transparent 22%)",
      // Stone path — warm oval at mid-ground
      "radial-gradient(ellipse 28% 7% at 50% 74%, light-dark(#ccc2a0, #2c2418) 0%, transparent 100%)",
      // Sky-to-ground gradient
      "linear-gradient(to bottom, light-dark(#dce8c4, #192a18) 0%, light-dark(#d0e2ae, #152216) 55%, light-dark(#c4d49c, #131c10) 55%, light-dark(#cad8a4, #161e12) 100%)",
    ].join(", "),
    backgroundColor: "light-dark(#cad8a4, #161e12)",
    borderColor: "light-dark(#b8d4a0, #3a5a30)",
  },

  "zen-garden": {
    id: "zen-garden",
    label: "Zen Garden",
    description:
      "Raked sand patterns and smooth stones invite stillness and focus.",
    cost: 1000,
    backgroundImage: [
      // Raked sand lines
      "repeating-linear-gradient(90deg, transparent 0px, transparent 22px, light-dark(rgba(160,140,90,0.18), rgba(80,70,40,0.22)) 22px, light-dark(rgba(160,140,90,0.18), rgba(80,70,40,0.22)) 23px)",
      // Stones at ground level
      "radial-gradient(ellipse 5% 8% at 22% 70%, light-dark(#b0a890, #262014) 0%, transparent 100%)",
      "radial-gradient(ellipse 4% 6% at 68% 74%, light-dark(#a8a088, #1e1a10) 0%, transparent 100%)",
      "radial-gradient(ellipse 3% 5% at 46% 62%, light-dark(#b4ac98, #221e12) 0%, transparent 100%)",
      "radial-gradient(ellipse 3% 4% at 82% 66%, light-dark(#aca498, #201c10) 0%, transparent 100%)",
      // Subtle horizon line
      "linear-gradient(to bottom, light-dark(#ede6d0, #1c1810) 0%, light-dark(#ede6d0, #1c1810) 60%, light-dark(#e4dcc4, #181408) 60%, light-dark(#e8e0ca, #1a1608) 100%)",
    ].join(", "),
    backgroundColor: "light-dark(#ede6d0, #1c1810)",
    borderColor: "light-dark(#c8bea0, #3a3220)",
  },

  "misty-mountain": {
    id: "misty-mountain",
    label: "Misty Mountain",
    description: "Layered peaks dissolve into cool mist. Serene and vast.",
    cost: 1000,
    backgroundImage: [
      // Distant mountains — soft wide ellipses
      "radial-gradient(ellipse 90% 30% at 20% 62%, light-dark(#bdc8d8, #1c2030) 0%, transparent 100%)",
      "radial-gradient(ellipse 80% 28% at 75% 58%, light-dark(#c4ceda, #1e2438) 0%, transparent 100%)",
      // Mid mountains — slightly more defined
      "radial-gradient(ellipse 70% 25% at 50% 72%, light-dark(#a8b4c8, #141828) 0%, transparent 100%)",
      "radial-gradient(ellipse 50% 20% at 15% 76%, light-dark(#b0bcc8, #161c2c) 0%, transparent 100%)",
      "radial-gradient(ellipse 55% 22% at 85% 74%, light-dark(#a4b2c4, #121620) 0%, transparent 100%)",
      // Misty ground
      "radial-gradient(ellipse 100% 20% at 50% 100%, light-dark(rgba(220,228,238,0.7), rgba(20,24,36,0.8)) 0%, transparent 100%)",
      // Sky gradient
      "linear-gradient(to bottom, light-dark(#d8e4f0, #0c1020) 0%, light-dark(#ccd8ec, #0e1426) 100%)",
    ].join(", "),
    backgroundColor: "light-dark(#ccd8ec, #0e1426)",
    borderColor: "light-dark(#a0b0c8, #2a3048)",
  },

  "night-garden": {
    id: "night-garden",
    label: "Night Garden",
    description: "Warm lantern glow and a moonlit sky. Best tended after dark.",
    cost: 1000,
    backgroundImage: [
      // Stars (small bright ellipses high in the sky)
      "radial-gradient(ellipse 1% 1.5% at 12% 14%, light-dark(rgba(255,255,255,0.7), rgba(255,255,255,0.9)) 0%, transparent 100%)",
      "radial-gradient(ellipse 1% 1.5% at 38% 8%, light-dark(rgba(255,255,255,0.55), rgba(255,255,255,0.8)) 0%, transparent 100%)",
      "radial-gradient(ellipse 1% 1.5% at 58% 18%, light-dark(rgba(255,255,255,0.6), rgba(255,255,255,0.85)) 0%, transparent 100%)",
      "radial-gradient(ellipse 1% 1.5% at 78% 10%, light-dark(rgba(255,255,255,0.5), rgba(255,255,255,0.75)) 0%, transparent 100%)",
      "radial-gradient(ellipse 1% 1.5% at 92% 22%, light-dark(rgba(255,255,255,0.45), rgba(255,255,255,0.7)) 0%, transparent 100%)",
      // Moon glow
      "radial-gradient(ellipse at 82% 12%, light-dark(rgba(220,240,255,0.45), rgba(200,225,255,0.2)) 0%, transparent 38%)",
      // Lantern glows at ground level
      "radial-gradient(ellipse 16% 22% at 26% 72%, light-dark(rgba(255,210,80,0.38), rgba(255,185,50,0.28)) 0%, transparent 100%)",
      "radial-gradient(ellipse 12% 18% at 74% 76%, light-dark(rgba(255,218,90,0.32), rgba(255,195,60,0.22)) 0%, transparent 100%)",
      // Ground / sky split
      "linear-gradient(to bottom, light-dark(#1c1a32, #080610) 0%, light-dark(#1c1a32, #080610) 58%, light-dark(#1a1814, #0c0a08) 58%, light-dark(#1e1a12, #100c08) 100%)",
    ].join(", "),
    backgroundColor: "light-dark(#1e1a12, #100c08)",
    borderColor: "light-dark(#38365a, #28264a)",
  },

  "autumn-forest": {
    id: "autumn-forest",
    label: "Autumn Forest",
    description: "Falling leaves and warm amber light. A garden turning gold.",
    cost: 1000,
    backgroundImage: [
      // Warm sun glow upper left
      "radial-gradient(ellipse at 16% 12%, light-dark(rgba(240,200,80,0.5), rgba(200,140,30,0.38)) 0%, transparent 44%)",
      // Drifting leaf hints in sky area
      "radial-gradient(ellipse 8% 12% at 28% 24%, light-dark(rgba(210,100,30,0.38), rgba(180,70,15,0.28)) 0%, transparent 100%)",
      "radial-gradient(ellipse 6% 9% at 65% 18%, light-dark(rgba(225,130,40,0.32), rgba(200,95,18,0.22)) 0%, transparent 100%)",
      "radial-gradient(ellipse 7% 11% at 85% 30%, light-dark(rgba(215,90,25,0.3), rgba(185,65,10,0.22)) 0%, transparent 100%)",
      "radial-gradient(ellipse 5% 8% at 48% 10%, light-dark(rgba(220,115,35,0.28), rgba(195,85,15,0.2)) 0%, transparent 100%)",
      // Ground — amber/rust floor
      "linear-gradient(to bottom, light-dark(#e8c880, #221208) 0%, light-dark(#e0b870, #1c0e06) 44%, light-dark(#c88e50, #180c04) 44%, light-dark(#cc9658, #1c0e06) 100%)",
    ].join(", "),
    backgroundColor: "light-dark(#cc9658, #1c0e06)",
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
