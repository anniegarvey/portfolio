# Flaky Test Log

Track known flaky tests here. Each entry records the symptom, affected tests, and failure count to help identify patterns and prioritise fixes.

---

## Parallel load race: activity not visible in selected-activities on beforeEach

**Symptom:** `toBeVisible` times out on an element inside `[data-testid="selected-activities"]` immediately after `goToEnergyPlannerWithSeed`. Passes reliably in isolation; only fails when multiple test workers are hammering the dev server simultaneously.

**Root cause (suspected):** Dev server under parallel load responds slowly enough that the app's IndexedDB read completes after the first assertion fires, even though the `DayPlannerSkeleton` has already detached.

| Test | Failures |
|------|----------|
| `e2e/energy-planner/one-off-activities/complete.spec.ts` > "should allow marking an activity as complete" | 1 |
