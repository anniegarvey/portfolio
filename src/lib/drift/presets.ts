import { z } from "zod";
import { type DriftSettings, DriftSettingsSchema } from "./settings";

/** A named snapshot of the settings, to come back to later. */
export type Preset = { name: string; settings: DriftSettings };

export const MAX_PRESET_NAME = 40;

const PresetSchema = z.object({
  name: z.string().trim().min(1).max(MAX_PRESET_NAME),
  settings: DriftSettingsSchema,
});

const STORAGE_KEY = "drift-presets";

/** Saved presets, skipping any entry that no longer reads as one. */
export function loadPresets(): Preset[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((entry) => {
      const parsed = PresetSchema.safeParse(entry);
      return parsed.success ? [parsed.data] : [];
    });
  } catch {
    return [];
  }
}

export function savePresets(presets: Preset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // Private mode or full storage: presets just won't stick.
  }
}

const sameName = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

/**
 * Saves settings under a name. Saving over an existing name (ignoring case
 * and surrounding spaces) updates it in place; a new name goes on the end.
 */
export function upsertPreset(
  presets: Preset[],
  name: string,
  settings: DriftSettings,
): Preset[] {
  const preset = { name: name.trim(), settings: { ...settings } };
  const index = presets.findIndex((p) => sameName(p.name, name));
  if (index === -1) return [...presets, preset];
  return presets.map((p, i) => (i === index ? preset : p));
}

export function removePreset(presets: Preset[], name: string): Preset[] {
  return presets.filter((p) => !sameName(p.name, name));
}
