# Bonsai Species Research

This document explains how the growth parameters in `SPECIES_CONFIG` (speciesConfig.ts) were derived,
to assist with adding new species in future.

---

## Parameter Reference

The redesigned generator (phases 0–9) reads every field below. Older "Reserved
for phase X" placeholders are now active.

### Gameplay

| Parameter | Type | Meaning |
|---|---|---|
| `regrowthDays` | number | Days for a pruned branch to regrow |

### Trunk

| Parameter | Type | Meaning |
|---|---|---|
| `maxTrunkHeight` | number | SVG units (200×300 viewBox) approached asymptotically as the tree ages — see the growth-curve note below the table. |
| `trunkCurvature` | 0–1+ | 0 = straight; higher = more lateral bend. Applied as a bezier offset of `curvature × height × 0.4`. |
| `trunkTaperPower` | exponent | Trunk taper profile. 1 = linear; >1 = concave (flared base, slim top); <1 = convex. |
| `trunkJaggedness` | 0–1 | Roughness added to the trunk silhouette. 0 = smooth bezier; higher = bark/shari texture. |
| `nebariSpread` | 0–1+ | Basal flare as a fraction of base trunk width — drives visible surface roots. |
| `trunkWidthFactor` | number | Multiplier on the age-driven trunk base width (see `computeTrunkBaseWidth` in `treeGenerator.ts`). 1 = species-neutral; >1 for naturally massive trunks (oak); <1 for slender ones (wisteria). |

**Growth curve**: trunk height follows `maxTrunkHeight × d / (d + 12)`, where
`d` is `activeDaysCount` scaled by the tree's per-individual growth-rate
jitter (`computeTrunkHeight` in `treeGenerator.ts`). It climbs steeply in the
first few weeks and flattens smoothly toward `maxTrunkHeight` — roughly 20% of
max by day 3, 45% by day 10, 68% by day 25, 81% by day 50, 89%+ by day 100 —
never quite reaching the asymptote. `individualVariability` perturbs the
scaling of `d`, so higher-iv species show visible height spread across seeds
at the same day.

**Age signals**: since height plateaus early, four other signals keep a tree
reading as "older" well past day 100 (`generateTree` in `treeGenerator.ts`):
- **Trunk mass** — base width follows `2 + 20 × d / (d + 95)` (times
  `trunkWidthFactor`), a much slower asymptote than height's — real trunks
  keep thickening for decades after they stop getting taller. At factor 1:
  ~3.9 by day 10, ~6.2 by day 25, ~8.9 by day 50, ~12.3 by day 100, ~15.6 by
  day 200, still rising slowly beyond that.
- **Bark character** — effective trunk jaggedness ramps from 60% of
  `trunkJaggedness` on a fresh sapling up toward 120% as the tree approaches
  its height asymptote, so bark reads smooth when young and gnarled when old.
- **Foliage density** — leaves per pad scale from 75% of the species'
  `leavesPerPad` range on a fresh sapling up toward ~120% as the tree matures,
  so old crowns read visibly denser than young ones at the same branch count.
- **Lower-branch sag** — on upright (non-cascade) species, the lowest
  primaries' pitch droops by up to 0.1 rad once the tree is well past
  maturity (ramping in from ~day 30, full strength by ~day 90), scaled by how
  low the branch sits on the trunk. Cascade species are already drooping by
  design and are unaffected.

### Branch architecture

| Parameter | Type | Meaning |
|---|---|---|
| `branchAngleBase` | radians | Angle above horizontal for a mid-height primary branch. Negative = drooping below horizontal. |
| `branchAngleRamp` | radians | Total angle ramp from bottom branch to top branch. Positive → upper branches more vertical (typical upright); negative → upper branches droop more (cascade). |
| `firstBranchFrac` | 0–1 | Height of the lowest branch as a fraction of trunk height. ~0.28–0.33 for upright styles; 0.58–0.68 for cascade/semi-cascade where branches cluster near the apex. |
| `branchFrequency` | days | Days between new primary branches appearing. Lower = faster-growing species. |
| `maxBranchPairs` | number | Cap on primary branches (single branches, not pairs) |
| `splitDiverge` | radians | Angle divergence when a branch forks. Smaller = tight columnar; larger = wide spreading. |
| `crownSpreadFactor` | number | Length of the lowest primary branch as a fraction of the tree's *current* trunk height, before child branches extend the reach. Higher = broader crown spread relative to trunk height. |
| `branchThicknessFactor` | 0–1 | Base thickness of primary branches as a fraction of trunk width at the attachment point. |
| `branchCurvature` | SVG units | Max lateral midpoint offset applied randomly per branch for natural curvature. Higher = wispier, more arching branches. |
| `phyllotaxy` | enum | `opposite` / `alternate` / `whorled` — primary-branch emergence pattern around the trunk. |
| `whorlSize` | number | Branches per whorl node when `phyllotaxy === "whorled"`. Ignored otherwise. |
| `maxDepth` | number | Max branching depth (0 = primary only). Higher values enable finer ramification. |
| `childCountByDepth` | number[] | Children per fork at each depth. e.g. `[3, 2, 2]` = primary forks 3 ways, deeper forks 2. The array length should be ≥ `maxDepth`; out-of-range depths default to 2. A trailing `1` produces an unforked twig segment at the deepest level. |
| `apicalDominance` | 0–1 | Strength of the apex shoot. 1 = strong leader (pine, oak); 0 = weak (cascade, vase). |
| `branchWander` | 0–1+ | Random per-branch angle deviation producing kinks. 0 = perfectly straight. |
| `azimuthSpread` | radians | Yaw range around the trunk axis across which branches emerge. `PI*2` = full 360°. |
| `crownDepthFactor` | 0–1 | Crown depth along the z-axis. 0 = flat silhouette; 1 = roughly spherical. |
| `tipDroop` | -1 to 1 | Tip behaviour on final-depth twigs. `(π/2)·tipDroop` over the last 30% of length. Negative = weeping; 0 = horizontal; positive = upturn. |

### Foliage

| Parameter | Type | Meaning |
|---|---|---|
| `leafShape` | enum | `needle` / `oval` / `palmate` / `lobed` / `scale` / `pinnate` — controls SVG leaf renderer |
| `leafSize` | SVG units | Base size. Interpretation varies by shape (see below). |
| `foliageDistribution` | enum | `terminal` / `pad` / `scattered` / `pendent` — see Foliage Distribution doc in `speciesConfig.ts`. |
| `padRadius` | SVG units | Radius of a single foliage pad disc. Larger pads overlap their neighbours and the trunk for closed canopies. |
| `interiorPadDensity` | 0–1 | Chance a non-terminal branch grows extra foliage beyond its tip pad. `pad` mode: a near-tip interior pad, filling the bare crown centre. `terminal` mode: a smaller spur pad partway along the branch, keeping the crown outline continuous instead of bare sticks with a puff at each tip. |
| `leavesPerPad` | [min, max] | Randomised leaf count placed within each pad. |

### Per-individual variation

| Parameter | Type | Meaning |
|---|---|---|
| `individualVariability` | 0–1 | Scale of per-tree parameter scatter — higher = more visible differences between same-species trees. Drives jitter on azimuth, pitch, child count, branch wander, and pad radius. |

### Flowers (optional)

| Parameter | Type | Meaning |
|---|---|---|
| `flowers.floweringAge` | days | `activeDaysCount` at which flowers first appear. |
| `flowers.flowerDensity` | 0–1 | Fraction of eligible terminal tips that carry a flower/fruit; 1 = every tip. Keeps bloom/fruit-set sparse and scattered rather than covering the whole crown at once. |
| `flowers.flowerShape` | enum | `raceme` / `cluster` / `catkin` / `berry` |
| `flowers.flowerColor` | hex | Primary flower colour. |
| `flowers.flowerColorAccent` | hex | Optional accent (streaked petal, catkin bumps). |
| `flowers.flowerSize` | SVG units | Base size of an individual floret / berry. |
| `flowers.racemeLength` | SVG units | Wisteria-only — length of the hanging raceme stem. |

### `leafSize` interpretation by shape

- **needle** — half-length of each needle (thin radiating ellipses, rx fixed at 0.4)
- **oval** — half-width of the ellipse (ry = leafSize × 0.6, giving a landscape oval)
- **palmate** — overall scale applied to the normalized maple-leaf path
- **lobed** — overall scale applied to the normalized oak-leaf path
- **scale** — radius of each tiny circular scale

---

## Species Notes

### Pine — *Pinus thunbergii* (Japanese Black Pine)

**Trunk**: Japanese Black Pine has a notably curved trunk — traditional bonsai training exaggerates
the natural lean into a graceful *moyogi* (informal upright) form. `trunkCurvature: 0.22`.

**Branches**: Whorled growth — new buds emerge in evenly spaced rings (nodes) up the trunk.
Lower branches extend nearly horizontally; upper branches angle steeply upward, creating the
classic conical silhouette. `branchAngleBase: 0.35` rad ≈ 20° above horizontal;
`branchAngleRamp: 0.45` drives a strong spread from horizontal at the base to near-vertical
at the apex. `firstBranchFrac: 0.28` — first branch emerges low on the trunk, consistent with
the species' formal-upright proportions.

**Foliage**: Paired needles 6–12 cm long in nature, grouped in dense fascicles at each node.
Rendered as needle pads — each terminal carries a disc of radiating needles, and near-tip
non-terminal branches add interior pads to fill the conical interior.
`foliageDistribution: "pad"` with `padRadius: 10`, `leavesPerPad: [10, 14]`,
`interiorPadDensity: 0.7`, `leafSize: 7.5`.

**Redesign params**: `phyllotaxy: "whorled"` with `whorlSize: 5` reflects pine's signature
candle-whorl growth. Strong `apicalDominance: 0.8` drives the conical leader; `maxDepth: 3`
and `childCountByDepth: [3, 2, 2]` support the horticultural pad structure. Moderate
`crownDepthFactor: 0.7`.

**Pruning speed**: Moderate — pine is vigorous but back-budding takes time. `regrowthDays: 14`.

**Sources**: Bonsai Empire pine guide; *The Complete Book of Bonsai* (Tomlinson).

---

### Maple — *Acer palmatum* (Japanese Maple)

**Trunk**: One of the most curved trunks in bonsai, with a muscular sinuous form highly
valued in *moyogi* (informal upright) style. `trunkCurvature: 0.45`.

**Branches**: Maple grows in alternating opposite pairs with an ascending vase shape.
Upper branches angle significantly upward. `branchAngleBase: 0.62` rad ≈ 35°.
`branchAngleRamp: 0.20` gives a gentle layering. `splitDiverge: 0.42` produces the
broad, open-crowned form characteristic of the species. High `branchCurvature: 3.5`
gives the naturally graceful arching of mature maple limbs.

**Foliage**: Classic 5-lobed palmate leaf. Rendered as a normalized 5-point path.
Small terminal pads of 6–10 leaves with moderate interior pad fill so the maple's vase
crown reads dense without losing the crossing-branch visibility.
`foliageDistribution: "pad"` with `padRadius: 8`, `leavesPerPad: [6, 10]`,
`interiorPadDensity: 0.4`, `leafSize: 5.0`.

**Redesign params**: `phyllotaxy: "opposite"` captures maple's paired-bud habit
(adjacent nodes rotate 90° to produce the crossing-branch look). Weak
`apicalDominance: 0.4` and high `branchWander: 0.4` give the vase-shaped,
sinuous crown. `crownDepthFactor: 0.8` gives a rounded silhouette.

**Pruning speed**: Fast — maple back-buds readily. `regrowthDays: 12`.

**Sources**: Bonsai Tonight; *Acer palmatum* cultivation guides; Kokufu album observations.

---

### Cherry Blossom — *Prunus serrulata* (Japanese Flowering Cherry)

**Trunk**: Relatively upright with a gentle natural curve. Less dramatically bent than
maple or juniper. `trunkCurvature: 0.30`.

**Branches**: Ascending branches with a mild vase shape. `branchAngleBase: 0.50` rad ≈ 29°.
Low `branchAngleRamp: 0.18` gives only a subtle variation across the crown height — cherry
maintains a fairly even spreading silhouette from base to apex. `firstBranchFrac: 0.30`.

**Foliage**: Oval-lanceolate leaves 6–13 cm in nature, shown as landscape ovals.
Light terminal pads of 5–9 ovals keep the airy, see-through canopy that cherries
are known for, while smaller spur pads along non-terminal twigs
(`interiorPadDensity: 0.45`) keep the crown outline continuous rather than a
ring of isolated puffs. `foliageDistribution: "terminal"` with `padRadius: 6.5`,
`leavesPerPad: [5, 9]`, `leafSize: 4.5`.

**Redesign params**: `phyllotaxy: "alternate"` for cherry's spiral bud arrangement.
Moderate `apicalDominance: 0.6` and low `branchWander: 0.2` produce a tidy
spreading crown. `maxDepth: 3` with `childCountByDepth: [2, 2, 1]` adds a
non-forking depth-3 twig segment so terminal pads sit on visibly finer
sub-branches without doubling pad count.

**Pruning speed**: Moderate-fast — cherry heals quickly. `regrowthDays: 10`.

**Sources**: Bonsai4me cherry blossom guide; RHS *Prunus serrulata* cultivation notes.

---

### Juniper — *Juniperus procumbens / chinensis* (Garden / Chinese Juniper)

**Trunk**: The most dramatically curved species in the set. Classical juniper bonsai is
prized for extreme *nebari* and tortuous trunk movement. Jin (deadwood) and shari
(stripped bark channels) add character. `trunkCurvature: 0.65`.

**Style**: *Kengai* (cascade) / *han-kengai* (semi-cascade). Branches emerge predominantly
from the upper third of the trunk and cascade downward. `firstBranchFrac: 0.62` — branches
cluster near the apex. `branchAngleBase: -0.20` rad (≈ 11° below horizontal); `branchAngleRamp: -0.1`
means upper branches droop *more* than lower ones, reinforcing the cascade effect.
Very high `branchCurvature: 5.0` produces the long, sweeping arcs typical of the style.
Dense branching with compact pads. `maxBranchPairs: 8`.

**Foliage**: Scale-like (adult foliage) or needle-like (juvenile). Modelled as dense
overlapping pads of tiny scale ellipses — the species' signature flat foliage cloud.
`foliageDistribution: "pad"` with `padRadius: 14`, `leavesPerPad: [18, 26]`,
`interiorPadDensity: 0.8`, `leafSize: 2.0`.

**Redesign params**: `phyllotaxy: "whorled"` with `whorlSize: 3` matches the species'
trademark 3-leaf scale whorls. Weak `apicalDominance: 0.2` and high `branchWander: 0.7`
produce the twisted, tortured shari movement the style is prized for. Cascade display
narrows `azimuthSpread` to `PI * 1.6` — branches lean toward the viewing side. High
`trunkJaggedness: 0.7` for shari bark texture. Seed cones set on only a scattered
fraction of tips in nature, not every one — `flowers.flowerDensity: 0.15`.

**Pruning speed**: Slow — junipers dislike hard pruning and back-bud cautiously.
`regrowthDays: 16`.

**Sources**: Adam's Art and Bonsai; *Juniper Bonsai* (Bonsai Empire); Telperion Farms notes.

---

### Oak — *Quercus robur* (English / Pedunculate Oak)

**Trunk**: One of the straightest, most powerful trunks in bonsai — thick, deeply furrowed
bark. Bonsai oaks are grown for their massive taper and rugged bark. `trunkCurvature: 0.18`.
The highest `trunkWidthFactor: 1.25` in the set — oak should read as the most massive trunk
at any given age.

**Branches**: Wide-spreading, roughly horizontal lower branches and more ascending upper ones.
`branchAngleBase: 0.42` rad ≈ 24°; `branchAngleRamp: 0.28` and wide `splitDiverge: 0.45`
give the broad, rounded silhouette typical of the species. Moderate `branchCurvature: 2.0`
reflects oak's stiff, relatively straight limbs compared to species like maple or wisteria.

**Foliage**: Deeply lobed leaves 5–15 cm in nature (much reduced on bonsai). Rendered as
a sinuous lobed path. Light terminal pads of 5–8 preserve oak's coarse, irregular
silhouette, while spur pads along non-terminal branches (`interiorPadDensity: 0.45`) fill
the crown's sky gaps without smoothing it into a solid ball. `foliageDistribution: "terminal"`
with `padRadius: 7.5`, `leavesPerPad: [5, 8]`, `leafSize: 6.0`.

**Redesign params**: `phyllotaxy: "alternate"` with strong `apicalDominance: 0.7`
reflects oak's powerful straight-leader growth. `maxDepth: 3` with
`childCountByDepth: [2, 3, 2]` lets the middle fork widen into oak's signature
three-way crown-scaffolds, then ramifies once more at depth 3 for the dense
twig structure of a mature canopy. High `crownDepthFactor: 0.9` models oak's
full, rounded canopy volume. `trunkJaggedness: 0.5` and `trunkTaperPower: 1.5`
capture the furrowed, muscular trunk taper. Catkins are rare even at maturity —
`flowers.flowerDensity: 0.25` keeps them from covering the whole crown at once.

**Pruning speed**: Slowest in the set — oaks grow deliberately. `regrowthDays: 18`.

**Sources**: British Bonsai Association oak guides; *Quercus robur* silviculture data;
Bonsai Empire oak species profile.

---

### Wisteria — *Wisteria sinensis* (Chinese Wisteria)

**Trunk**: Wisteria trunks become dramatically gnarled and twisted with age — the species
is prized in bonsai precisely for its tortured bark texture. `trunkCurvature: 0.55`.
Below-neutral `trunkWidthFactor: 0.9` keeps the trunk reading slender relative to its
sprawling canopy, consistent with a vine-like species trained onto a woody form.

**Style**: Semi-cascade. Long trailing branches hang downward from the upper trunk, echoing
the species' natural habit of draping over pergolas and walls. `firstBranchFrac: 0.58` —
branches concentrate in the upper trunk. `branchAngleBase: -0.30` rad (≈ 17° below horizontal),
with a slight `branchAngleRamp: 0.10` so lower branches angle slightly less downward.
Very high `branchCurvature: 5.5` produces the long, sinuous arching canes the species
is known for. Fast-growing; branches appear every 3 days.

**Foliage**: Pinnate compound leaves in nature (7–13 leaflets per leaf), rendered with
`foliageDistribution: "pendent"` so each terminal carries a small tip pad plus a hanging
chain of smaller pads — the defining drape of mature wisteria. `padRadius: 5`,
`leavesPerPad: [3, 5]`, `leafSize: 4.0`.

**Colour**: Lavender-purple (`#9b59b6`), representing the iconic hanging raceme flowers as
much as the foliage — the main visual appeal of wisteria bonsai.

**Redesign params**: Strongly negative `tipDroop: -0.9` models the heavy hanging
habit (the racemes plunge near-vertical). Weak `apicalDominance: 0.3` and
strong `branchWander: 0.6` produce the gnarled semi-cascade character; high
`trunkJaggedness: 0.6` gives bark texture. `azimuthSpread: PI * 1.6` narrows
the crown to one display side, matching typical wisteria presentation.
`maxDepth: 3` with `childCountByDepth: [2, 2, 1]` ensures each pendent raceme
hangs from a sub-fork rather than directly off a primary branch.

**Pruning speed**: Moderate — wisteria back-buds well. `regrowthDays: 12`.

**Sources**: Bonsai Empire wisteria guide; RHS *Wisteria sinensis* cultivation notes;
Bonsai4me wisteria species profile.

---

### Flame Tree — *Delonix regia* (Royal Poinciana / Flamboyant)

**Trunk**: Flame tree trunks are relatively straight and upright in bonsai — the drama comes
from the spreading crown rather than trunk movement. `trunkCurvature: 0.12`.

**Style**: *Moyogi* (informal upright) with a flat, wide umbrella canopy. Highly characteristic
horizontal branching: `branchAngleBase: 0.18` rad (≈ 10°) gives near-horizontal branches at all
heights. Very low `branchAngleRamp: 0.06` — upper and lower branches are almost equally horizontal,
preserving the species' distinctive flat-topped silhouette. `firstBranchFrac: 0.25` — branches start
low on the trunk. Wide `splitDiverge: 0.55` and `maxBranchPairs: 8` create the broad, dense canopy.
Fast-growing; branches appear every 3 days.

**Foliage**: Bipinnate compound leaves in nature, with hundreds of tiny leaflets giving a
ferny, light texture. Represented as palmate pads (the closest available shape to the
fine leaflet structure). `foliageDistribution: "pad"` with the largest `padRadius: 16` of
any species and `interiorPadDensity: 0.6` for the broad umbrella canopy.
`leavesPerPad: [6, 10]`, `leafSize: 5.5`.

**Colour**: Vivid scarlet-orange (`#e74c3c` / `#ff6b47`), representing the mass of brilliant
red flowers that cover the entire canopy — the species is named for this effect.

**Redesign params**: Extremely low `crownDepthFactor: 0.3` captures the flat-topped
umbrella silhouette. Weak `apicalDominance: 0.2` and near-zero `branchWander: 0.15`
produce the clean, horizontally-layered canopy.

**Pruning speed**: Moderate — tropical species with good recovery. `regrowthDays: 14`.

**Sources**: Bonsai Empire tropical species notes; *Delonix regia* cultivation guides (Florida
Bonsai Society); tropical bonsai forums.

---

## Adding a New Species

A complete checklist for the post-redesign generator. Work top-to-bottom — the
silhouette decisions (1–3) drive the parameter choices in (4–8).

### 1. Identify the species

- Pick a `SpeciesId` slug (kebab-case) and add it to `SpeciesIdSchema` in `schema.ts`.
- Sketch or pull 2–3 reference photos at maturity, ideally one bonsai and one
  field specimen so silhouette and habit are both grounded.

### 2. Choose the silhouette family

- **Style**: upright (`firstBranchFrac` ~0.3, `branchAngleBase` > 0,
  `maxTrunkHeight` ~140–165) vs cascade (`firstBranchFrac` ~0.6,
  `branchAngleBase` < 0, `maxTrunkHeight` ~85–95 — cascade bonsai are
  short-trunked; the visual mass hangs beside/below the trunk).
- **Crown shape**: rounded (`crownDepthFactor` ~0.9), flat-topped (~0.3), or
  one-sided (`azimuthSpread: PI * 1.6` for cascade displays).
- **Crown width**: `crownSpreadFactor` ~0.27–0.38 for upright species (crown
  width roughly matches tree height); ~0.34–0.36 for cascade/semi-cascade
  species, which read wider than tall relative to their short trunks.
- **Tip behaviour**: weeping (`tipDroop` < 0), upturned (> 0), or neutral (0).

### 3. Choose phyllotaxy & ramification

- `phyllotaxy`: `whorled` (conifers, set `whorlSize` 3–5), `opposite` (maples,
  flame tree), or `alternate` (most broadleaves).
- `maxDepth`: 3 for most species; 2 only for very sparse silhouettes.
- `childCountByDepth`: one entry per depth level. End with `1` to add a twig
  segment without forking. Common patterns: `[3, 2, 2]` (conifer whorl), `[2, 3, 2]`
  (broadleaf scaffold), `[2, 2, 1]` (sparse with fine twigs).
- `apicalDominance`: 0.7–0.8 for strong leaders (pine, oak); 0.2–0.4 for vase
  or cascade species.
- `branchWander`: 0.1–0.2 for clean branches (cherry, flame tree); 0.5–0.7 for
  gnarled species (juniper, wisteria).

### 4. Trunk shape

- `trunkCurvature`: 0.1–0.2 for upright species; 0.4–0.7 for *moyogi* / cascade.
- `trunkTaperPower`: 1.0–1.5 (≥1 means flared base, slim apex).
- `trunkJaggedness`: 0.1–0.3 for smooth bark; 0.5+ for shari/aged texture.
- `nebariSpread`: 0.3–0.8 — visible root flare at the trunk base.

### 5. Foliage distribution

- Open-canopy broadleaves (cherry, oak): `foliageDistribution: "terminal"` with
  `padRadius` 6.5–7.5 and small `leavesPerPad` ranges.
- Dense pad species (pine, juniper, flame tree): `foliageDistribution: "pad"`
  with `padRadius` 10–16, higher `interiorPadDensity` (0.6–0.8) to fill the
  crown centre.
- Weeping species (wisteria): `foliageDistribution: "pendent"` — overrides
  `padRadius`; pair with strongly negative `tipDroop`.
- Pick `leafShape` from the existing enum; add a renderer in `TreeView.tsx` only
  if no existing shape fits.

### 6. Per-individual variability

- `individualVariability`: 0.15 for clean cultivars, 0.25–0.40 for species
  prized for variation (juniper, wisteria). Drives jitter on azimuth, pitch,
  child count, branch wander, and pad radius.

### 7. Flowers (optional)

- Skip the `flowers` field entirely for non-ornamental species (pine).
- Otherwise pick `flowerShape` (`raceme` / `cluster` / `catkin` / `berry`),
  set `floweringAge` realistically (cherry 15 days, oak 90 days, wisteria 55),
  and reuse `flowerColorAccent` for two-tone effects.

### 8. Wire it up & verify

- Add the seed to `SHOP_CATALOG` in `catalog.ts` with an appropriate point
  cost (slow-growing species cost more).
- Add a notes section to this file using the existing per-species pattern
  (Trunk, Branches/Style, Foliage, Redesign params, Pruning speed, Sources).
- Run `pnpm generate-snapshots --species=<slug>` then `pnpm snapshot-grid --species=<slug>` and inspect
  `docs/bonsai-snapshots/<slug>-grid.png` at all six growth stages.
- Run `pnpm snapshot-seeds --species=<slug>` and inspect `docs/bonsai-snapshots/<slug>-seeds.png` —
  the silhouette must hold up across all three seeds, not just the default one.
- Run `pnpm test src/lib/bonsai/` and `pnpm exec tsc --noEmit`.
