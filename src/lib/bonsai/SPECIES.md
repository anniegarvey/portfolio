# Bonsai Species Research

This document explains how the growth parameters in `SPECIES_CONFIG` (schema.ts) were derived,
to assist with adding new species in future.

---

## Parameter Reference

| Parameter | Type | Meaning |
|---|---|---|
| `regrowthDays` | number | Days for a pruned branch to regrow |
| `maxTrunkHeight` | number | SVG units (200×300 viewBox) at full maturity |
| `trunkCurvature` | 0–1+ | 0 = straight; higher = more lateral bend. Applied as a bezier offset of `curvature × height × 0.4`. |
| `branchAngleBase` | radians | Angle above horizontal for a mid-height primary branch. Negative = drooping below horizontal. |
| `branchAngleDroop` | radians | Added per pair index so lower branches are more horizontal, upper ones ascend. Positive = lower branches are more horizontal. |
| `branchFrequency` | days | Days between new primary branch pairs appearing |
| `maxBranchPairs` | number | Cap on primary branch pairs (each pair = one left + one right) |
| `splitDiverge` | radians | Angle divergence when a branch forks into two children. Smaller = tight columnar; larger = wide spreading. |
| `leafShape` | enum | `needle` / `oval` / `palmate` / `lobed` / `scale` — controls SVG leaf renderer |
| `leavesPerCluster` | [min, max] | Randomised count of leaf elements per terminal cluster |
| `leafSize` | SVG units | Base size. Interpretation varies by shape (see below). |

### `leafSize` interpretation by shape

- **needle** — half-length of each needle (thin radiating ellipses, rx fixed at 0.4)
- **oval** — half-width of the ellipse (ry = leafSize × 0.6, giving a landscape oval)
- **palmate** — overall scale applied to the normalized maple-leaf path
- **lobed** — overall scale applied to the normalized oak-leaf path
- **scale** — radius of each tiny circular scale

---

## Species Notes

### Pine — *Pinus thunbergii* (Japanese Black Pine)

**Trunk**: Japanese Black Pine has a generally upright trunk with only a modest lean.
Traditional bonsai training exaggerates this to a gentle inclination. `trunkCurvature: 0.12`.

**Branches**: Whorled growth — new buds emerge in evenly spaced rings (nodes) up the trunk.
Lower branches extend nearly horizontally; upper branches angle slightly upward.
`branchAngleBase: 0.35` rad ≈ 20° above horizontal; `branchAngleDroop: 0.06` keeps lower
branches nearly horizontal and upper ones gently ascending.

**Foliage**: Paired needles 6–12 cm long in nature, grouped in dense fascicles at each node.
Represented as radiating ellipse clusters. `leavesPerCluster: [8, 12]`, `leafSize: 7.5`.

**Pruning speed**: Moderate — pine is vigorous but back-budding takes time. `regrowthDays: 14`.

**Sources**: Bonsai Empire pine guide; *The Complete Book of Bonsai* (Tomlinson).

---

### Maple — *Acer palmatum* (Japanese Maple)

**Trunk**: One of the most curved trunks in bonsai, with a muscular sinuous form highly
valued in *moyogi* (informal upright) style. `trunkCurvature: 0.30`.

**Branches**: Maple grows in alternating opposite pairs with an ascending vase shape.
Upper branches angle significantly upward. `branchAngleBase: 0.65` rad ≈ 37°.
`branchAngleDroop: 0.05` gives a gentle layering. `splitDiverge: 0.42` produces the
broad, open-crowned form characteristic of the species.

**Foliage**: Classic 5-lobed palmate leaf. Rendered as a normalized 5-point path.
Relatively small clusters of 3–5 individual leaves clearly visible at each tip.
`leavesPerCluster: [3, 5]`, `leafSize: 5.0`.

**Pruning speed**: Fast — maple back-buds readily. `regrowthDays: 12`.

**Sources**: Bonsai Tonight; *Acer palmatum* cultivation guides; Kokufu album observations.

---

### Cherry Blossom — *Prunus serrulata* (Japanese Flowering Cherry)

**Trunk**: Relatively upright with a gentle natural curve. Less dramatically bent than
maple or juniper. `trunkCurvature: 0.20`.

**Branches**: Ascending branches with a mild vase shape. `branchAngleBase: 0.52` rad ≈ 30°.
Low `branchAngleDroop: 0.04` gives only a subtle variation across the crown height.

**Foliage**: Oval-lanceolate leaves 6–13 cm in nature, shown as landscape ovals.
Clusters of 4–6. `leavesPerCluster: [4, 6]`, `leafSize: 4.5`.

**Pruning speed**: Moderate-fast — cherry heals quickly. `regrowthDays: 10`.

**Sources**: Bonsai4me cherry blossom guide; RHS *Prunus serrulata* cultivation notes.

---

### Juniper — *Juniperus procumbens / chinensis* (Garden / Chinese Juniper)

**Trunk**: The most dramatically curved species in this set. Classical juniper bonsai
prized for extreme *nebari* and tortuous trunk movement. Jin (deadwood) and shari
(stripped bark channels) add character. `trunkCurvature: 0.45`.

**Branches**: Procumbens junipers are naturally prostrate — branches originate below
horizontal and may curve upward only at the tips. `branchAngleBase: -0.18` rad (≈ 10°
below horizontal). `branchAngleDroop: 0.07` makes lower branches droop significantly.
Dense branching with compact pads. `maxBranchPairs: 7`.

**Foliage**: Scale-like (adult foliage) or needle-like (juvenile). Modelled as dense
clusters of tiny scale ellipses. `leavesPerCluster: [12, 18]`, `leafSize: 2.0`.

**Pruning speed**: Slow — junipers dislike hard pruning and back-bud cautiously.
`regrowthDays: 16`.

**Sources**: Adam's Art and Bonsai; *Juniper Bonsai* (Bonsai Empire); Telperion Farms notes.

---

### Oak — *Quercus robur* (English / Pedunculate Oak)

**Trunk**: One of the straightest, most powerful trunks in bonsai — thick, deeply furrowed
bark. Bonsai oaks are grown for their massive taper and rugged bark. `trunkCurvature: 0.08`.

**Branches**: Wide-spreading, roughly horizontal lower branches and more ascending upper ones.
`branchAngleBase: 0.45` rad ≈ 26°; `branchAngleDroop: 0.07` and wide `splitDiverge: 0.45`
give the broad, rounded silhouette typical of the species.

**Foliage**: Deeply lobed leaves 5–15 cm in nature (much reduced on bonsai). Rendered as
a sinuous lobed path. Small clusters of 3–5. `leavesPerCluster: [3, 5]`, `leafSize: 6.0`.

**Pruning speed**: Slowest in the set — oaks grow deliberately. `regrowthDays: 18`.

**Sources**: British Bonsai Association oak guides; *Quercus robur* silviculture data;
Bonsai Empire oak species profile.

---

## Adding a New Species

1. Pick a `SpeciesId` slug and add it to `SpeciesIdSchema` in `schema.ts`.
2. Fill in the `SpeciesConfig` fields — use the table above as a guide.
3. Choose `leafShape` from the existing enum; add a new shape constant to `TreeView.tsx`
   and a rendering branch in the leaf map if needed.
4. Add the seed to `SHOP_CATALOG` with an appropriate point cost.
5. Document the research for the new species in this file following the pattern above.
