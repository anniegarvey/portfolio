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

## Wellness Check

A periodic self-tracking prompt within the Energy Planner. The user configures how often it appears and which subjective metrics it captures, building a longitudinal record of personal warning signs (tiredness, irritability, poor sleep, etc.). Distinct from an **Activity** — it captures structured data rather than being completed/skipped, and does not consume **Daily capacity** or award **Points** the same way.

### Terms

**Wellness check**
The single, user-configurable prompt. Holds a calendar-anchored schedule (`anchorDate`, `frequency`, `unit`) and an ordered list of **Metrics**. Unlike a **Repeating activity**, it has no mutable `nextDueDate` — due-ness is *derived* from the schedule plus the **Wellness entry** history. Borrows the frequency/unit vocabulary but not the projection machinery.

**Period**
One occurrence window in the check's schedule (e.g. each Mon–Sun for a weekly check), defined by the anchor date and frequency. The check is **pending** whenever the period containing today has no **Wellness entry**; the prompt carries forward through the whole period until filled, then closes when the next period begins. There is no skip action — an unfilled period simply ends with no entry.

**Metric**
A named dimension the user rates each check, on a fixed 1–5 scale, with optional free-text labels for the low and high ends (e.g. "1 = Exhausted … 5 = Energised"). User-defined; the source of truth for what is asked. Raw values only — no "good/bad direction" semantics.

**Wellness entry**
The captured record for one filled check, dated to the day it was filled in (the actual report day, even if the period started earlier). Snapshots each configured metric's id, label, and value at capture time (value may be null for an unanswered metric), plus an optional free-text note — making entries self-describing, immutable historical records that survive later edits or deletion of a **Metric**. Must contain at least one answered metric or a note to count as filled.

_Avoid_: "mood log", "journal entry" (a wellness entry is structured ratings, not prose).

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
A cross-cutting reward currency. Awarded by the Energy Planner (completing activities) and spent in the Bonsai shop and Creature Glade. Playground games never generate points (see ADR 0003).

---

## Creature Glade

A peaceful creature-collecting game. Wild creatures visit the glade; the player builds trust through real-life-inspired taming actions until each creature settles as a resident, growing an ecosystem where every resident contributes a daily benefit. No failure states — low skill means slower taming, never loss.

### Terms

**Species**
A catalog definition of a creature kind: name, rarity, real or fantastical, favourite treat, approach/petting preferences, and benefit role. The source of truth for creature behaviour — never duplicated into game state.

**Wild visitor**
An untamed creature visiting the glade today. Accepts a limited set of taming actions per day. Visitors rotate daily: each **Daily glade advance** draws a fresh set of one to three species, weighted by rarity and by banked **Trust** (see ADR 0004).

**Trust**
A per-species meter raised by taming actions, with the threshold set by rarity. When a visitor departs, its trust is banked and resumes on its next visit — progress is never lost, and higher banked trust makes the species more likely to return. Reaching full trust tames the visitor, converting it into a **Resident**.

**Resident**
A tamed creature living in the glade. Contributes its species' benefit each **Daily glade advance**.

**Taming action**
One of three interactions a wild visitor accepts each day: _offer treat_, _approach_ (body language), and _pet_. Approach and pet each involve a light choice (posture / petting spot) checked against the species' preference — a matching choice earns bonus trust, a mismatch earns reduced trust, never negative.

**Preference**
A species' favoured approach posture and petting spot. Hinted at in the visitor's description; hints get clearer at higher skill tiers.

**Taming skill**
One of three player skills: _Treat Cooking_, _Body Language_, _Petting Technique_. Skills gain XP through use and advance in tiers.

**Skill tier**
A skill's level. Advancing requires both a full XP bar and buying a **Lesson** with points. Higher tiers raise trust gains, sharpen preference hints, and unlock recipes.

**Lesson**
A points purchase that advances a skill to its next tier once the XP threshold is met. The primary points sink alongside ingredients.

**Ingredient**
A cooking input, bought with points or foraged by resident creatures.

**Recipe**
A combination of ingredients producing a **Treat**. Unlocked by Treat Cooking tier.

**Treat**
A cooked consumable offered to a wild visitor for trust. A species' **favourite treat** earns bonus trust.

**Benefit role**
The daily contribution a species makes as a resident: _Forager_ (gathers ingredients), _Soother_ (passively builds trust with wild visitors), _Beacon_ (attracts rarer visitors), or _Muse_ (boosts skill XP gains).

**Daily glade advance**
The once-per-calendar-day tick: yesterday's wild visitors depart (banking trust), a fresh set of one to three visitors is drawn, and resident benefits apply. Mirrors the Bonsai **Daily advance** pattern.

---

## Shared Infrastructure

**Points system**
The cross-cutting module that manages the points currency shared between the Energy Planner and the Playground games (Bonsai Garden, Creature Glade). Handles awarding, spending, particle animations, and localStorage persistence.
