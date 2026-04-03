# Flaky Test Log

Track known flaky tests here. Each entry records the symptom, affected tests, and failure count to help identify patterns and prioritise fixes.

---

## Parallel load race: activity not visible in selected-activities on beforeEach

**Symptom:** `toBeVisible` times out on an element inside `[data-testid="selected-activities"]` immediately after `goToEnergyPlannerWithSeed`. Passes reliably in isolation; only fails when multiple test workers are hammering the dev server simultaneously.

**Root cause (identified, fixed):** `waitFor({ state: 'detached' })` on `[aria-busy='true']` returns immediately if React hasn't rendered yet when the `load` event fires — the skeleton is "detached" because it was never attached. Fixed by waiting for `[data-testid="selected-activities"]` to be visible instead, which can only appear once `isLoading` is false and the real DayPlanner has rendered.

| Test | Failures |
|------|----------|
| `e2e/energy-planner/one-off-activities/complete.spec.ts` > "should allow marking an activity as complete" | 3 |

---

## Parallel load race: Energy Planner content fails to render in time

**Symptom:** Test times out waiting for Energy Planner UI to become interactive after navigation. Error context shows only the top-level nav rendered — the planner content never appeared. Passes reliably in isolation; only fails when the full 70-test suite runs in parallel.

**Root cause (suspected):** Dev server under parallel load is too slow to serve the Energy Planner page within the default timeout. Same class of problem as the entry above.

| Test | Failures |
|------|----------|
| `e2e/energy-planner/manage-activities-tab-switch.spec.ts` > "should switch to repeating tab after creating a repeating activity" | 1 |
| `e2e/energy-planner/zones/manage-zones.spec.ts` > "should allow adding, renaming, and removing zones" | 1 |

---

## Parallel load race: modal overlay intercepts pointer events in uncompleted-activities

**Symptom:** Click on "Mark as complete" (or similar action button) fails because a Radix Dialog overlay (`data-state="open"`, `aria-hidden="true"`) is still mounted and intercepting pointer events. The overlay should not be present at that point — suggests a modal from a prior test in the parallel run was not fully torn down before the next test began. Passes reliably in isolation (4/4 when run alone); only fails under the full 70-test parallel suite.

**Root cause (suspected):** Same parallel load race as the existing entry above — a previous test's dialog teardown hasn't completed before the next test's page interactions begin. May need an explicit `waitFor` on modal absence in `beforeEach`, or reduced worker concurrency for this spec file.

| Test | Failures |
|------|----------|
| `e2e/energy-planner/uncompleted-activities/workflow.spec.ts` > "should mark uncompleted activity as complete" | 2 |
| `e2e/energy-planner/uncompleted-activities/workflow.spec.ts` > "should return uncompleted activity to unplanned" | 1 |

---

## Snapshot mismatch: conversion from one-off to repeating

**Symptom:** `toMatchSnapshot` fails on the activity card after converting a one-off activity to repeating. Observed failing 1 out of 3 runs even in isolation with no parallel load — suggests a timing issue where the UI hasn't fully settled before the snapshot is taken.

**Root cause (suspected):** Async state update (storage write + re-render) not awaited before snapshot assertion. The projected activity may not yet be visible in the planner when the snapshot fires.

| Test | Failures |
|------|----------|
| `e2e/energy-planner/conversion.spec.ts` > "should persist and project when converting from one-off to repeating" | 1 |
