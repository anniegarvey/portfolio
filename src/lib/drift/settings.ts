import { z } from "zod";
import type { Rgb, StepOptions } from "./fluid";

export type Palette = {
  id: string;
  name: string;
  /** Dye colours as hex; mid-tones, so they read on light and dark water. */
  colors: readonly string[];
  /** Water colour behind the dye, for light and dark themes. */
  water: { light: string; dark: string };
  /** Seconds each colour holds while stirring; defaults to a slow drift. */
  cycleSeconds?: number;
  /** Keep mixed colours at full brightness instead of letting them dull. */
  vivid?: boolean;
};

export const PALETTES = [
  {
    id: "lagoon",
    name: "Lagoon",
    colors: ["#14b8a6", "#0ea5e9", "#6366f1"],
    water: { light: "#eaf6f7", dark: "#061418" },
  },
  {
    id: "dusk",
    name: "Dusk",
    colors: ["#ec4899", "#a855f7", "#f97316"],
    water: { light: "#fbf0f4", dark: "#140a18" },
  },
  {
    id: "meadow",
    name: "Meadow",
    colors: ["#22c55e", "#eab308", "#14b8a6"],
    water: { light: "#f1f7ea", dark: "#08140b" },
  },
  {
    id: "aurora",
    name: "Aurora",
    colors: ["#10b981", "#8b5cf6", "#06b6d4"],
    water: { light: "#eef2f8", dark: "#070b16" },
  },
  {
    id: "ember",
    name: "Ember",
    colors: ["#f43f5e", "#f59e0b", "#ef4444"],
    water: { light: "#fbf3ec", dark: "#160a07" },
  },
  {
    id: "rainbow",
    name: "Rainbow",
    // The full spectrum at full brightness, cycled in order as you stir.
    colors: [
      "#ff1f3d",
      "#ff8a00",
      "#ffd600",
      "#22e05a",
      "#00b8ff",
      "#3d5bff",
      "#b04dff",
    ],
    water: { light: "#f6f5f8", dark: "#0b0a10" },
    // Quick enough that one stroke paints a ribbon of the whole spectrum.
    cycleSeconds: 0.6,
    vivid: true,
  },
] as const satisfies readonly Palette[];

export type PaletteId = (typeof PALETTES)[number]["id"];

const PALETTE_IDS = PALETTES.map((p) => p.id) as [PaletteId, ...PaletteId[]];

export const DEFAULT_SETTINGS = {
  palette: "lagoon",
  speed: 1,
  viscosity: 0.35,
  trail: 0.6,
  brushSize: 0.5,
  swirl: 0.4,
  drift: true,
} as const satisfies DriftSettings;

/**
 * Every field falls back to its own default, so one out-of-range value in
 * storage (say, from an older version) doesn't wipe the rest.
 */
export const DriftSettingsSchema = z.object({
  palette: z.enum(PALETTE_IDS).catch(DEFAULT_SETTINGS.palette),
  /** Time multiplier, 0.25–2. */
  speed: z.number().min(0.25).max(2).catch(DEFAULT_SETTINGS.speed),
  /** 0 (thin, slippery) to 1 (thick, syrupy). */
  viscosity: z.number().min(0).max(1).catch(DEFAULT_SETTINGS.viscosity),
  /** 0 (fades fast) to 1 (lingers). */
  trail: z.number().min(0).max(1).catch(DEFAULT_SETTINGS.trail),
  /** 0 (fine) to 1 (broad). */
  brushSize: z.number().min(0).max(1).catch(DEFAULT_SETTINGS.brushSize),
  /** 0 (smooth) to 1 (curly). */
  swirl: z.number().min(0).max(1).catch(DEFAULT_SETTINGS.swirl),
  /** Gentle currents that keep the water moving on its own. */
  drift: z.boolean().catch(DEFAULT_SETTINGS.drift),
});

export type DriftSettings = {
  palette: PaletteId;
  speed: number;
  viscosity: number;
  trail: number;
  brushSize: number;
  swirl: number;
  drift: boolean;
};

const STORAGE_KEY = "drift-settings";

export function loadSettings(): DriftSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return { ...DEFAULT_SETTINGS };
    const parsed = DriftSettingsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: DriftSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode or full storage: settings just won't stick.
  }
}

export function getPalette(id: PaletteId): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** "#14b8a6" → [0.08, 0.72, 0.65] */
export function hexToRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** How much slower everything runs when the device asks for reduced motion. */
export const CALM_SPEED = 0.15;

/** Turns the panel's friendly 0–1 sliders into solver parameters. */
export function toStepOptions(
  settings: DriftSettings,
  dt: number,
  calm: boolean,
): StepOptions {
  return {
    dt: dt * settings.speed * (calm ? CALM_SPEED : 1),
    // Thin water keeps ~80% of its momentum a second; syrup keeps ~5%.
    velocityKeep: lerp(0.8, 0.05, settings.viscosity),
    // Short trails keep ~40% of their dye a second; long ones ~98%.
    dyeKeep: lerp(0.4, 0.98, settings.trail),
    swirl: settings.swirl * 30,
  };
}

/** Brush radius as a fraction of the grid's longer side. */
export function brushRadius(settings: DriftSettings): number {
  return lerp(0.015, 0.07, settings.brushSize);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
