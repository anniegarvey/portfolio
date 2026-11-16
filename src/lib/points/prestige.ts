import { useSyncExternalStore } from "react";
import { z } from "zod";
import { PRESTIGE_STORAGE_KEY } from "./keys";

/**
 * Restarts: trading in a game's progress for a lasting bonus on every point
 * the Energy Planner awards. Each game's restarts add to one shared
 * multiplier, because points are one wallet shared by every game (ADR 0009).
 */

export const RestartGameSchema = z.enum(["meadowmere", "glade"]);
export type RestartGame = z.infer<typeof RestartGameSchema>;

const GameRestartsSchema = z.object({
  restarts: z.number().int().min(0),
  /** Every restart's bonus so far, added up, in whole percent. */
  bonusPercent: z.number().int().min(0),
});

export const PrestigeStateSchema = z.object({
  meadowmere: GameRestartsSchema,
  glade: GameRestartsSchema,
});
export type PrestigeState = z.infer<typeof PrestigeStateSchema>;

const NO_RESTARTS: PrestigeState = {
  meadowmere: { restarts: 0, bonusPercent: 0 },
  glade: { restarts: 0, bonusPercent: 0 },
};

/** Fired on this page when a restart changes the multiplier. */
const CHANGE_EVENT = "points-multiplier-change";

export function loadPrestigeState(): PrestigeState {
  if (typeof window === "undefined") return NO_RESTARTS;
  const raw = localStorage.getItem(PRESTIGE_STORAGE_KEY);
  if (raw === null) return NO_RESTARTS;
  try {
    const result = PrestigeStateSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : NO_RESTARTS;
  } catch {
    return NO_RESTARTS;
  }
}

/** One plus every restart bonus, from both games. */
export function multiplierOf(state: PrestigeState): number {
  return 1 + (state.meadowmere.bonusPercent + state.glade.bonusPercent) / 100;
}

export function loadPointsMultiplier(): number {
  return multiplierOf(loadPrestigeState());
}

/** What an Energy Planner award is worth after the multiplier. */
export function multiplyAward(amount: number, multiplier: number): number {
  return Math.round(amount * multiplier);
}

/** Banks a restart's bonus. The game resets its own progress. */
export function recordRestart(game: RestartGame, bonusPercent: number): void {
  const state = loadPrestigeState();
  const next: PrestigeState = {
    ...state,
    [game]: {
      restarts: state[game].restarts + 1,
      bonusPercent: state[game].bonusPercent + bonusPercent,
    },
  };
  localStorage.setItem(PRESTIGE_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The current points multiplier, kept up to date as restarts happen. */
export function usePointsMultiplier(): number {
  return useSyncExternalStore(subscribe, loadPointsMultiplier, () => 1);
}

/** How many times a game has been restarted. */
export function useRestartCount(game: RestartGame): number {
  return useSyncExternalStore(
    subscribe,
    () => loadPrestigeState()[game].restarts,
    () => 0,
  );
}

/** "×1.8", "×2", for showing the multiplier. */
export function formatMultiplier(multiplier: number): string {
  return `×${Number(multiplier.toFixed(2))}`;
}
