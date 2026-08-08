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

---

## Parallel load race: Bonsai garden tree button not interactive in time

**Symptom:** `openTendingModal` times out at 30s waiting for `getByRole("button", { name: /pine.*click to tend/i })` to be clickable after `goToBonsaiWithSeed`. Passes in 1.9s when run in isolation; only fails when the full `e2e/bonsai` suite runs in parallel.

**Root cause (suspected):** Same parallel-load class as the Energy Planner entries above — the bonsai page hasn't finished hydrating under contention, so the tree button is rendered but not yet wired to its click handler when the test attempts to click.

| Test | Failures |
|------|----------|
| `e2e/bonsai/bonsai.spec.ts` > "locked stand button navigates to shop Stands tab" | 1 |
| `e2e/bonsai/bonsai.spec.ts` > "watering can tool shows hint and marks tree as watered" | 1 |

---

## Load race: Glade reset reverted by the mount load

**Symptom:** After confirming "Reset glade", the page shows a Robin at `Trust 0/60` but the Skills tab still shows the *seeded* tiers (Body Language 3/5, Petting Technique 2/5, Treat Cooking 1/5). The test then fails on `getByRole("tabpanel", { name: "Skills" }).getByText("Unlocks at Body Language tier 2")`. Only failed under `pnpm validate`, which runs vitest, Playwright and tsc concurrently.

**Root cause (identified, fixed):** Not a partial write — the *whole* seeded save was restored. The state looked half-reset only because three of the four earlier assertions couldn't tell the two saves apart (the seed's own visitor is a robin at trust 0), and they ran during the brief window before the revert landed.

`GladeProvider`'s mount effect reads localStorage into a local `result`, then dispatches it. The reset's write can land in between — and because `setState` persists *inside* its updater (at render time, not dispatch time), the effect's read can still see the pre-reset save even when the reset was dispatched first. Its snapshot then restores that save wholesale, to React state and localStorage alike. Reproduced by deferring the effect's dispatch by 1.5s: the reset applies, then at t=1200ms the rabbit resident and the tier-3 skills both come back. The exact browser-level trigger under contention was not isolated — slow hydration is the obvious candidate, but the ordering, not its cause, is what the fix addresses.

Fixed in `src/lib/glade/context.tsx`: a `stateWritten` ref, set by the first real write, makes the mount load bail out entirely when something has already replaced the SSR placeholder — state *and* daily report, so a reset can't be followed by a digest for the day it discarded.

Covered by `does not let a stale mount load revert a reset that landed first` in `src/lib/glade/context.test.tsx`, which reproduces the ordering deterministically (a child resetting from `useLayoutEffect`, plus a stale `loadGladeState`) and fails without the fix. The e2e test now waits for the seeded save to render before resetting, and asserts the empty-scene message rather than facts true of both saves.

| Test | Failures |
|------|----------|
| `e2e/glade/glade.spec.ts` > "resetting the glade wipes progress back to a fresh start" | 4 |

---

## Parallel load race: Meadowmere clicks swallowed before hydration

**Symptom:** `getByRole("dialog")` never appears after clicking a map hotspot — the error context shows the button `[active]` and the prompt naming it, but no dialog. Passes in 2s in isolation; failed 3/3 under the full `e2e/meadowmere` run once the phone spec added six more tests to the same parallel batch.

**Root cause (identified, fixed):** `MeadowmereProvider` server-renders `EMPTY_STATE` and fills the real save in on mount. `valeFeatures` draws the stall, the cottages and the sites from constants, so those hotspots exist in the SSR markup — a real `<button>` with no React handler behind it until hydration. A click dispatched into that window is silently swallowed, which is why only the tests that go straight for the stall or a door failed, and never the ones that reach for a plot first.

Fixed in `e2e/utils/seed-meadowmere.ts`: `goToMeadowmereWithSeed` now waits for a Plot 1 button after the reload. Plots come from the loaded save and cannot render before hydration, so waiting for one is waiting for the map to be live. 3/3 clean runs at 5 workers afterwards.

| Test | Failures |
|------|----------|
| `e2e/meadowmere/meadowmere.spec.ts` > "seeds are bought with points at the stall" | 3 |
| `e2e/meadowmere/meadowmere.spec.ts` > "a liked gift moves a neighbour up a friendship tier" | 1 |

---

## Parallel load starvation: TreeSVG unit test hits the 5s timeout

**Symptom:** `Test timed out in 5000ms` on the whole `it` block, before any assertion. The same test passes in 400ms in isolation, and the file's other 33 tests pass alongside it. Only seen under `pnpm validate`, which runs vitest and Playwright concurrently — the same contention class as the entries above, but starving a unit test rather than racing a browser.

**Root cause (suspected):** Not a race in the component. `mapleAt50` renders a full maple with every branch as an interactive button, which is the heaviest render in the bonsai suite; `vitest.config.ts` sets a flat `testTimeout: 5000`, so under a saturated box the render alone can exceed it. Nothing was investigated beyond confirming it passes in isolation — noting it here rather than raising the global timeout, since a timeout that absorbs full contention would stop catching real hangs.

| Test | Failures |
|------|----------|
| `src/components/bonsai/TreeSVG/TreeSVG.test.tsx` > "renders interactive branch buttons when activeTool is pruning-shears" | 1 |
