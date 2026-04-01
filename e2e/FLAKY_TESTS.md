# Flaky Test Log

Track known flaky tests here. Each entry records the symptom, affected tests, and failure count to help identify patterns and prioritise fixes.

---

## Parallel load race: activity not visible in selected-activities on beforeEach

**Symptom:** `toBeVisible` times out on an element inside `[data-testid="selected-activities"]` immediately after `goToEnergyPlannerWithSeed`. Passes reliably in isolation; only fails when multiple test workers are hammering the dev server simultaneously.

**Root cause (identified, fixed):** `waitFor({ state: 'detached' })` on `[aria-busy='true']` returns immediately if React hasn't rendered yet when the `load` event fires — the skeleton is "detached" because it was never attached. Fixed by waiting for `[data-testid="selected-activities"]` to be visible instead, which can only appear once `isLoading` is false and the real DayPlanner has rendered.

| Test | Failures |
|------|----------|
| `e2e/energy-planner/one-off-activities/complete.spec.ts` > "should allow marking an activity as complete" | 3 |
