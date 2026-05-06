# Domain Context

Shared vocabulary for this codebase. Use these terms when discussing architecture, naming modules, writing ADRs, and briefing agents.

---

## Energy Planner

An interactive planner for managing daily activities based on energy/spoon theory. Users track one-off and repeating activities with energy costs across configurable energy types and time-of-day zones.

### Terms

**Activity**
A user-defined task with a title, energy cost, and optional repeat configuration. The source of truth for what a task is — never duplicated into day plans.

**One-off activity**
An activity with no `repeatConfig`. Can be manually added to a single day plan. Once scheduled or completed anywhere, it is no longer available to plan again.

**Repeating activity**
An activity with a `repeatConfig` specifying a frequency, unit, and `nextDueDate`. Automatically appears on days it is due via projection. Completing or skipping advances `nextDueDate`.

**Planned instance**
A lightweight reference linking an activity to a day plan. Holds only `sourceActivityId`, optional `zoneId`, and `completed` state. Activity data (title, energy cost) is resolved live from the activity store.

**Projected instance**
A transient planned instance generated at runtime for a repeating activity that is due on a given date. Never persisted — recreated on load. Distinguished by `isProjected: true`. Solidifies into a concrete instance on any user interaction (complete, skip, zone assign).

**Repeating activity projection lifecycle**
The full sequence of states a projected instance moves through: _due check_ → _projection_ → _complete_ (advances `nextDueDate` from the scheduled due date) or _skip_ (advances `nextDueDate` from the current date, records the source activity ID in `skippedSourceActivityIds`). Owned by `useProjectedActivities`.

**Day plan**
The persisted record for a single date. Contains concrete planned instances, daily capacity, persisted activity order, and skipped source activity IDs. Projected instances are merged in at runtime and excluded from storage.

**Daily capacity**
A per-energy-type limit set by the user for a given day. Used to calculate whether the day's activities exceed the user's energy budget.

**Energy type**
A user-configurable dimension of energy cost (e.g. Physical, Social, Executive). Each activity carries a cost per energy type; each day plan carries a capacity per energy type.

**Zone**
A named time-of-day slot (e.g. Morning, Afternoon, Evening). Activities and projected instances can be assigned a default zone; users can reassign zones per instance.

**Uncompleted activity**
A one-off activity that was planned on a past date but never marked complete. Surfaced across all stored day plans by `fetchOneOffPlanningState`.

---

## Bonsai Garden

An idle-game-style tree collection. Users grow trees by watering daily, buy equipment and species with points, apply fertilizers, and prune branches.

### Terms

**Bonsai tree**
A single tree in the garden. Has a species, active-days count (growth stage), equipped pot/stand, applied fertilizers, pruned branches, and a garden position.

**Growth stage**
A label derived from a tree's `activeDaysCount`: Seed → Sapling → Young Tree → Mature → Ancient.

**Daily advance**
The action of ticking the game forward one day. Triggers growth for watered trees, cleans expired fertilizers, and updates `lastGrowthCheckDate`.

**Points**
A cross-cutting reward currency. Awarded by the Energy Planner (completing activities) and spent in the Bonsai shop.

---

## Shared Infrastructure

**Points system**
The cross-cutting module that manages the points currency shared between the Energy Planner and the Bonsai Garden. Handles awarding, spending, particle animations, and localStorage persistence.
