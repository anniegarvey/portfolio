import type { SpeciesConfig } from "../speciesConfig";
import { seededVal } from "../treeGenerator.math";

// ─── Phase 8 — Individual Variability ─────────────────────────────────────────

/** Per-tree signed scalar in [-1, +1], deterministic from treeId + slot. */
export function ivSignedScalar(treeId: string, slot: number): number {
  return seededVal(treeId, 4000 + slot) * 2 - 1;
}

/**
 * Phase 8 — derives a per-tree "effective" spec by perturbing a few
 * silhouette-shaping fields by amounts proportional to the species'
 * `individualVariability`. The same species + treeId always produces the same
 * effective spec, so determinism is preserved.
 *
 * Multipliers chosen so iv = 0 leaves every field at its species default
 * (zero variability between seeds), and the magnitudes stay bounded enough
 * at iv = 1 to keep the silhouette recognisable as the same species.
 */
export function applyIndividualVariability(
  spec: SpeciesConfig,
  treeId: string,
): SpeciesConfig {
  const iv = spec.individualVariability;
  if (iv <= 0) return spec;
  const s = (slot: number) => ivSignedScalar(treeId, slot);
  return {
    ...spec,
    branchAngleBase: spec.branchAngleBase + s(0) * iv * 0.3,
    branchCurvature: spec.branchCurvature * (1 + s(1) * iv * 0.8),
    branchWander: spec.branchWander * (1 + s(2) * iv * 1.0),
    padRadius: spec.padRadius * (1 + s(3) * iv * 0.5),
    splitDiverge: spec.splitDiverge * (1 + s(4) * iv * 0.6),
  };
}

/** Days at which the growth curve reaches half of `maxTrunkHeight` (before
 *  per-tree growth-rate jitter). Smaller = faster early growth. */
const TRUNK_GROWTH_HALFLIFE_DAYS = 12;

/** Returns the trunk height (in SVG units) for a given tree — this is the
 *  single source of truth for the growth curve; generateTree calls this
 *  directly so callers can also compute glow sizes etc. without running the
 *  full generator.
 *
 *  Height climbs steeply in the first few weeks (sapling growth spurt) then
 *  flattens smoothly toward `maxTrunkHeight` — day 10 reaches ~40-49% of
 *  maxTrunkHeight, day 100 reaches ~89%. */
export function computeTrunkHeight(
  activeDaysCount: number,
  spec: SpeciesConfig,
  treeId: string,
): number {
  const iv = spec.individualVariability;
  // Per-tree growth rate variation — magnitude scales with species'
  // individualVariability. iv=0 → all seeds reach identical heights; iv=0.4
  // → ±32% spread on the effective day count (and thus on height).
  const growthRateMultiplier = 1 + ivSignedScalar(treeId, 5) * iv * 0.8;
  const scaledDays = activeDaysCount * growthRateMultiplier;
  const maxH = spec.maxTrunkHeight;
  return maxH > 0 && scaledDays > 0
    ? (maxH * scaledDays) / (scaledDays + TRUNK_GROWTH_HALFLIFE_DAYS)
    : 0;
}

/** SVG units — trunk base width at germination, before any age-driven growth. */
const TRUNK_WIDTH_BASE = 2;
/** SVG units — the asymptotic width gain (on top of `TRUNK_WIDTH_BASE`) as
 *  `activeDaysCount` → ∞, before the species' `trunkWidthFactor`. */
const TRUNK_WIDTH_GAIN = 20;
/** Days at which the width gain reaches half of `TRUNK_WIDTH_GAIN`. Deliberately
 *  much larger than `TRUNK_GROWTH_HALFLIFE_DAYS` (12) — real trunks keep
 *  thickening for decades after height growth has effectively stopped, which
 *  is how mature/ancient trees keep reading as "older" long after their
 *  height has plateaued. */
const TRUNK_WIDTH_GROWTH_HALFLIFE_DAYS = 95;

/** Returns the trunk base width (in SVG units) for a given tree — the single
 *  source of truth for trunk-mass growth, times the species' `trunkWidthFactor`.
 *  Unlike `computeTrunkHeight`, which plateaus by ~day 50, width keeps
 *  thickening visibly well past day 100, so long-lived trees continue to read
 *  as more massive with age instead of looking identical past maturity.
 *
 *  At trunkWidthFactor = 1: day 10 ≈ 3.9, day 25 ≈ 6.2, day 50 ≈ 8.9,
 *  day 100 ≈ 12.3, day 200 ≈ 15.6. */
export function computeTrunkBaseWidth(
  activeDaysCount: number,
  spec: SpeciesConfig,
): number {
  const gain =
    activeDaysCount > 0
      ? (TRUNK_WIDTH_GAIN * activeDaysCount) /
        (activeDaysCount + TRUNK_WIDTH_GROWTH_HALFLIFE_DAYS)
      : 0;
  return (TRUNK_WIDTH_BASE + gain) * spec.trunkWidthFactor;
}
