# Bonsai Species Research

This document explains how the growth parameters in `SPECIES_CONFIG` (speciesConfig.ts) were derived,
to assist with adding new species in future.

---

## Parameter Reference

### Currently used by the tree generator

| Parameter | Type | Meaning |
|---|---|---|
| `regrowthDays` | number | Days for a pruned branch to regrow |
| `maxTrunkHeight` | number | SVG units (200×300 viewBox) at full maturity |
| `trunkCurvature` | 0–1+ | 0 = straight; higher = more lateral bend. Applied as a bezier offset of `curvature × height × 0.4`. |
| `branchAngleBase` | radians | Angle above horizontal for a mid-height primary branch. Negative = drooping below horizontal. |
| `branchAngleRamp` | radians | Total angle ramp from bottom branch to top branch. Positive → upper branches more vertical (typical upright); negative → upper branches droop more (cascade). |
| `firstBranchFrac` | 0–1 | Height of the lowest branch as a fraction of trunk height. ~0.28–0.33 for upright styles; 0.58–0.68 for cascade/semi-cascade where branches cluster near the apex. |
| `branchFrequency` | days | Days between new primary branches appearing. Lower = faster-growing species. |
| `maxBranchPairs` | number | Cap on primary branches (single branches, not pairs) |
| `splitDiverge` | radians | Angle divergence when a branch forks into two children. Smaller = tight columnar; larger = wide spreading. |
| `branchThicknessFactor` | 0–1 | Base thickness of primary branches as a fraction of trunk width at the attachment point. |
| `branchCurvature` | SVG units | Max lateral midpoint offset applied randomly per branch for natural curvature. Higher = wispier, more arching branches. |
| `leafShape` | enum | `needle` / `oval` / `palmate` / `lobed` / `scale` / `pinnate` — controls SVG leaf renderer |
| `leavesPerCluster` | [min, max] | Randomised count of leaf elements per terminal cluster |
| `leafSize` | SVG units | Base size. Interpretation varies by shape (see below). |
| `leavesAlongBranch` | boolean | When true, leaf clusters appear at intervals along the branch, not just the tip. Good for dense-foliage species (pine, juniper). |

### Reserved for the natural-growth redesign

These fields are declared in `SpeciesConfig` and filled for every species but are
not yet read by `treeGenerator.ts`. Each phase of the redesign (see
`docs/bonsai-snapshots/`) will switch one or more of them on, surfacing the
rendered change as a PNG diff in `git log`.

| Parameter | Type | Meaning |
|---|---|---|
| `trunkTaperPower` | exponent | Trunk taper profile. 1 = linear; >1 = concave (flared base, slim top); <1 = convex. |
| `trunkJaggedness` | 0–1 | Roughness added to the trunk silhouette. 0 = smooth bezier; higher = bark/shari texture. |
| `nebariSpread` | 0–1+ | Basal flare as a fraction of base trunk width — drives visible surface roots. |
| `phyllotaxy` | enum | `opposite` / `alternate` / `whorled` — primary-branch emergence pattern around the trunk. |
| `whorlSize` | number | Branches per whorl node when `phyllotaxy === "whorled"`. Ignored otherwise. |
| `maxDepth` | number | Max branching depth (0 = primary only). Higher values enable finer ramification. |
| `childCountByDepth` | number[] | Children per fork at each depth. e.g. `[3, 2, 2]` = primary forks 3 ways, deeper forks 2. |
| `apicalDominance` | 0–1 | Strength of the apex shoot. 1 = strong leader (pine, oak); 0 = weak (cascade, vase). |
| `branchWander` | 0–1+ | Random per-branch angle deviation producing kinks. 0 = perfectly straight. |
| `azimuthSpread` | radians | Yaw range around the trunk axis across which branches emerge. `PI*2` = full 360°. |
| `crownDepthFactor` | 0–1 | Crown depth along the z-axis. 0 = flat silhouette; 1 = roughly spherical. |
| `tipDroop` | radians | Additional downward droop at branch tips. ~0.5 = heavily drooping (wisteria). |
| `foliageDistribution` | enum | `tips` / `pads` / `interior` — where leaves cluster in the crown. |
| `padRadius` | SVG units | Radius of a single foliage pad (used when `foliageDistribution === "pads"`). |
| `interiorPadDensity` | 0–1 | Density of interior foliage clusters — fills the bare middle of the crown. |
| `leavesPerPad` | [min, max] | Leaves per pad. Analogous to `leavesPerCluster` for pad-based distribution. |
| `individualVariability` | 0–1 | Scale of per-tree parameter scatter — higher = more visible differences between same-species trees. |

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
Represented as radiating ellipse clusters. `leavesPerCluster: [8, 12]`, `leafSize: 7.5`.
`leavesAlongBranch: true` fills branches with dense needle clusters throughout their length.

**Redesign params**: `phyllotaxy: "whorled"` with `whorlSize: 5` reflects pine's signature
candle-whorl growth. Strong `apicalDominance: 0.8` drives the conical leader; `maxDepth: 3`
and `childCountByDepth: [3, 2, 2]` support the horticultural pad structure with
`foliageDistribution: "pads"` and `padRadius: 14`. Moderate `crownDepthFactor: 0.7`.

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
Relatively small clusters of 3–5 individual leaves clearly visible at each tip.
`leavesPerCluster: [3, 5]`, `leafSize: 5.0`.

**Redesign params**: `phyllotaxy: "opposite"` captures maple's paired-bud habit
(adjacent nodes rotate 90° to produce the crossing-branch look). Weak
`apicalDominance: 0.4` and high `branchWander: 0.4` give the vase-shaped,
sinuous crown. `foliageDistribution: "tips"` preserves the current
at-the-tip cluster rendering; `crownDepthFactor: 0.8` gives a rounded
silhouette for later 3D work.

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
Clusters of 4–6. `leavesPerCluster: [4, 6]`, `leafSize: 4.5`.

**Redesign params**: `phyllotaxy: "alternate"` for cherry's spiral bud arrangement.
Moderate `apicalDominance: 0.6` and low `branchWander: 0.2` produce a tidy
spreading crown. `foliageDistribution: "tips"` with a small `interiorPadDensity: 0.3`
fills the middle without losing the light, airy canopy.

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
clusters of tiny scale ellipses throughout the branch length. `leavesPerCluster: [12, 18]`,
`leafSize: 2.0`. `leavesAlongBranch: true`.

**Redesign params**: `phyllotaxy: "whorled"` with `whorlSize: 3` matches the species'
trademark 3-leaf scale whorls. Weak `apicalDominance: 0.2` and high `branchWander: 0.7`
produce the twisted, tortured shari movement the style is prized for. Cascade display
narrows `azimuthSpread` to `PI * 1.6` — branches lean toward the viewing side.
`foliageDistribution: "pads"` with `padRadius: 16` and `interiorPadDensity: 0.8` produces
the dense pad-and-pad silhouette. High `trunkJaggedness: 0.7` for shari bark texture.

**Pruning speed**: Slow — junipers dislike hard pruning and back-bud cautiously.
`regrowthDays: 16`.

**Sources**: Adam's Art and Bonsai; *Juniper Bonsai* (Bonsai Empire); Telperion Farms notes.

---

### Oak — *Quercus robur* (English / Pedunculate Oak)

**Trunk**: One of the straightest, most powerful trunks in bonsai — thick, deeply furrowed
bark. Bonsai oaks are grown for their massive taper and rugged bark. `trunkCurvature: 0.18`.

**Branches**: Wide-spreading, roughly horizontal lower branches and more ascending upper ones.
`branchAngleBase: 0.42` rad ≈ 24°; `branchAngleRamp: 0.28` and wide `splitDiverge: 0.45`
give the broad, rounded silhouette typical of the species. Moderate `branchCurvature: 2.0`
reflects oak's stiff, relatively straight limbs compared to species like maple or wisteria.

**Foliage**: Deeply lobed leaves 5–15 cm in nature (much reduced on bonsai). Rendered as
a sinuous lobed path. Small clusters of 3–5. `leavesPerCluster: [3, 5]`, `leafSize: 6.0`.

**Redesign params**: `phyllotaxy: "alternate"` with strong `apicalDominance: 0.7`
reflects oak's powerful straight-leader growth. `childCountByDepth: [2, 3, 2]` lets the
middle fork widen into oak's signature stout three-way crown-scaffolds. High
`crownDepthFactor: 0.9` models oak's full, rounded canopy volume. `trunkJaggedness: 0.5`
and `trunkTaperPower: 1.5` capture the furrowed, muscular trunk taper.

**Pruning speed**: Slowest in the set — oaks grow deliberately. `regrowthDays: 18`.

**Sources**: British Bonsai Association oak guides; *Quercus robur* silviculture data;
Bonsai Empire oak species profile.

---

### Wisteria — *Wisteria sinensis* (Chinese Wisteria)

**Trunk**: Wisteria trunks become dramatically gnarled and twisted with age — the species
is prized in bonsai precisely for its tortured bark texture. `trunkCurvature: 0.55`.

**Style**: Semi-cascade. Long trailing branches hang downward from the upper trunk, echoing
the species' natural habit of draping over pergolas and walls. `firstBranchFrac: 0.58` —
branches concentrate in the upper trunk. `branchAngleBase: -0.30` rad (≈ 17° below horizontal),
with a slight `branchAngleRamp: 0.10` so lower branches angle slightly less downward.
Very high `branchCurvature: 5.5` produces the long, sinuous arching canes the species
is known for. Fast-growing; branches appear every 3 days.

**Foliage**: Pinnate compound leaves in nature (7–13 leaflets per leaf), shown as oval clusters
to suggest the light, feathery canopy. `leavesPerCluster: [5, 8]`, `leafSize: 4.0`.

**Colour**: Lavender-purple (`#9b59b6`), representing the iconic hanging raceme flowers as
much as the foliage — the main visual appeal of wisteria bonsai.

**Redesign params**: High `tipDroop: 0.5` models the heavy hanging habit. Weak
`apicalDominance: 0.3` and strong `branchWander: 0.6` produce the gnarled semi-cascade
character; high `trunkJaggedness: 0.6` gives bark texture. `azimuthSpread: PI * 1.6`
narrows the crown to one display side, matching typical wisteria presentation.

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
ferny, light texture. Represented as palmate clusters (the closest available shape to the
fine leaflet structure). `leavesPerCluster: [4, 7]`, `leafSize: 5.5`.

**Colour**: Vivid scarlet-orange (`#e74c3c` / `#ff6b47`), representing the mass of brilliant
red flowers that cover the entire canopy — the species is named for this effect.

**Redesign params**: Extremely low `crownDepthFactor: 0.3` captures the flat-topped
umbrella silhouette. Weak `apicalDominance: 0.2` and near-zero `branchWander: 0.15`
produce the clean, horizontally-layered canopy. `foliageDistribution: "pads"` with
the largest `padRadius: 18` of any species models the sweeping horizontal foliage
plates characteristic of *Delonix regia*.

**Pruning speed**: Moderate — tropical species with good recovery. `regrowthDays: 14`.

**Sources**: Bonsai Empire tropical species notes; *Delonix regia* cultivation guides (Florida
Bonsai Society); tropical bonsai forums.

---

## Adding a New Species

1. Pick a `SpeciesId` slug and add it to `SpeciesIdSchema` in `schema.ts`.
2. Fill in the `SpeciesConfig` fields — use the table above as a guide.
3. Choose `leafShape` from the existing enum; add a new shape constant to `TreeView.tsx`
   and a rendering branch in the leaf map if needed.
4. Add the seed to `SHOP_CATALOG` with an appropriate point cost.
5. Document the research for the new species in this file following the pattern above.
