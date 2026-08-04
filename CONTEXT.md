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
One of three interactions a wild visitor accepts each day: _offer treat_, _approach_ (body language), and _pet_. Approach and pet each involve a light choice (posture / petting spot) checked against the species' preference — a matching choice earns bonus trust, a mismatch earns reduced trust, never negative. Pet and offer treat are locked at first — see **Taming skill** for the unlock order.

**Preference**
A species' favoured treat, approach posture, and petting spot. Each of the three has its own vague hint, which becomes visible once its mapped **Taming skill** reaches tier 2 — independent of whether the player has actually guessed that preference yet, so the hint helps find the answer rather than only confirming it after the fact. A single shared toggletip appears on the card once the first of the three skills reaches tier 3; within it, each preference type reveals its confirmed answer once that type's own skill reaches tier 3, then upgrades to a full log of every specific option tried (right or wrong) once that skill reaches tier 4 — an elimination aid for finding preferences not yet discovered, not just a record of ones that are (see ADR 0006).

**Taming skill**
One of three player skills: _Treat Cooking_, _Body Language_, _Petting Technique_. Skills gain XP through use and advance in tiers. They unlock sequentially: Body Language is available from the start; reaching tier 2 unlocks Petting Technique (and the pet action); reaching tier 2 in Petting Technique unlocks Treat Cooking (and cooking/offering treats). A locked skill neither earns XP nor accepts a lesson (see ADR 0005).

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

## Meadowmere

A smallholding sim in the Stardew Valley mould. The player walks a farmer around a single map, growing crops, foraging materials, and befriending three neighbours by giving them things they like. A chain of quests ties the loops together and gates every unlock. No failure states — crops never wither and friendship never decays.

### The world

**Vale**
The one map everything happens on: a grid of **Tiles** with a terrain layer and a set of **Features** standing on it. Nothing about it is persisted — it is derived from a fixed layout plus game state.

**Tile**
One square of the Vale. Its terrain decides whether the **Farmer** can stand on it.

**Farmer**
The player character. Has a position and a **Facing**.

**Facing**
Which of the four directions the farmer is looking. The tile in front is where every interaction happens.

**Feature**
Something standing on a tile that the farmer can act on: a **Plot**, a **Site**, a **Cottage**, or the **Seed stall**. Every feature blocks movement, so the rule is the same for all of them — stand beside it, face it, act on it.

**Cottage**
Where a **Neighbour** lives. Calling on one is how gifts are given and quests handed in.

**Seed stall**
Where seed packets are bought with points. The only thing points are spent on in Meadowmere (see ADR 0007).

**Interaction**
The action available on a feature given current state, plus the wording for it ("Water Parsnip in Plot 4"). Derived, never stored, so the prompt under the map and the feature's button can never disagree.

### The loops

**Crop**
A catalog definition of a plantable kind: seed cost in points, days to mature, base yield, and the **Produce** it gives. The source of truth for growing behaviour — never duplicated into game state.

**Plot**
One bed on the farm. Either bare or holding a **Planting**. The farm starts with six and grows to at most twelve through quest rewards, a row at a time.

**Planting**
A crop sown in a plot. Holds its `cropId`, `plantedDate`, and how many days it has been watered.

**Growth stage**
A label derived from days since `plantedDate`: Seed → Sprout → Budding → Ripe. Derived on every read, never counted up day by day, so time away from the game ripens crops correctly (see ADR 0007).

**Watering**
Once per plot per calendar day. Each watered day adds one to the eventual harvest — watering is a bonus that raises yield, never a requirement for growth.

**Produce**
What harvesting a ripe planting yields. Spent on **Gifts** and **Quest** deliveries; never sold.

**Material**
An item gathered from the **Wilds**. Interchangeable with produce as gift and quest currency — both are **Items** in one vocabulary.

**Item**
Anything that can sit in the **Larder**: produce or material.

**Larder**
The player's item store. (Distinct from the Creature Glade's **Pantry**, which holds ingredients and treats.)

**Wilds**
The land beyond the farm, made up of **Sites**. Named "wilds" rather than "zones" — **Zone** already means a time-of-day slot in the Energy Planner.

**Site**
A named place in the wilds (The Hedgerow, The Riverbank, Stonewood) with its own material pool. Only the hedgerow is open at the start; the rest are unlocked by quests, and stand behind a shut gate on the map until then.

**Forage trip**
One visit to an unlocked site, turning up one or two of a material. Three trips a day, refilled by the **Daily Meadowmere advance**.

**Neighbour**
One of three villagers — Nessa, Bram, Marigold — each with a set of liked **Items**, a **Friendship** meter, and a **Cottage** on the map.

**Friendship**
A per-neighbour meter from 0–100, raised by **Gifts** and quest rewards, never lowered. Crossing a threshold advances the **Friendship tier**.

**Friendship tier**
A label derived from friendship: Stranger → Acquaintance → Friend → Confidant → Dear Friend. Some quests require reaching a tier.

**Gift**
One item given to one neighbour, once per neighbour per calendar day. A liked item earns more friendship than a neutral one; nothing a neighbour receives ever loses them any.

**Quest**
An objective set by a neighbour. Auto-unlocks when its prerequisites are met — there is no accept step — and is handed in by calling on whoever set it. Only `completedQuestIds` is stored; a quest's status (_locked_ → _active_ → _ready_ → _completed_) and its progress checklist are derived from current state, so progress can't desync from the larder it is counted against.

**Quest journal**
A read-only account of the whole chain, opened from above the map. Quests are handed in at a **Cottage**, not here.

**Quest requirement**
What a quest asks for: items to hand in, and/or a friendship tier to have reached. Both are checked against current state. Handing in consumes the items; friendship is a standing relationship, not a cost.

**Quest reward**
What a quest pays out: seeds, items, a crop unlock, a site unlock, extra plots, or friendship — never points (see ADR 0003 and ADR 0007).

**Daily Meadowmere advance**
The once-per-calendar-day tick: forage trips refill and the digest reports what ripened while the player was away. Growth needs no work here because it is derived. Watering and gifting limits expire on their own, being date-stamped. Mirrors the Bonsai **Daily advance** and **Daily glade advance** pattern.

---

## Shared Infrastructure

**Points system**
The cross-cutting module that manages the points currency shared between the Energy Planner and the Playground games (Bonsai Garden, Creature Glade, Meadowmere). Handles awarding, spending, particle animations, and localStorage persistence.
