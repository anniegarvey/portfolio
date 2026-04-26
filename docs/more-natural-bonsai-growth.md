  Bonsai tree natural-growth redesign — plan                                           
                                                                                       
  1. Current-state assessment                                                          
                                                                                       
  From comparing the generated snapshots of all 7 species (day 25/50/100) against real
  bonsai photography and the horticultural descriptions in SPECIES.md, I see six       
  recurring defects in every species:                                                  
                                                                                       
  #: D1                                                                                
  Defect: Bilateral spoke symmetry — trees look like a ⊥ antenna                       
  Visible in: every species                                                            
  Root cause in treeGenerator.ts: branchIdx % 2 forces strict L/R alternation; only two
                                                                                       
    azimuths exist (0 or π)                                                         
  ────────────────────────────────────────                                             
  #: D2                                                                             
  Defect: Bare trunk interior ("empty centre")                                         
  Visible in: maple, cherry, oak, flame                                             
  Root cause in treeGenerator.ts: Leaves only attach at tips or along a single axis;   
    nothing fills the crown volume between trunk and perimeter                      
  ────────────────────────────────────────                                             
  #: D3                                                                                
  Defect: Shallow ramification — branches stop at depth 3 (primary → 2 children → 4 
    grand-children)                                                                    
  Visible in: every species                                                         
  Root cause in treeGenerator.ts: MAX_DEPTH = 2 hard-coded; fork is always binary      
  ────────────────────────────────────────                                          
  #: D4                                                                                
  Defect: Mechanical binary forking — every sub-branch is a near-mirror pair        
  Visible in: juniper, oak, maple                                                   
  Root cause in treeGenerator.ts: buildBranchTree always calls itself twice with angle 
  ±                                                                                 
    divergeVar                                                                         
  ────────────────────────────────────────                                          
  #: D5                                         
  Defect: Flat planar silhouette (no depth)                                            
  Visible in: everyone                   
  Root cause in treeGenerator.ts: All angles constrained to the image plane; no z-axis,
                                                                                       
    no overlap between front and back branches  
  ────────────────────────────────────────                                             
  #: D6                                                                            
  Defect: Species-unspecific structure
  Visible in: whorled pine renders like opposite maple renders like alternate oak      
  Root cause in treeGenerator.ts: No awareness of phyllotaxy (opposite / alternate /
    whorled) in the branch builder                                                     
                                                                                   
  Plus a few smaller issues: the apex is a fixed apex-L / apex-R pair which gives
  upright species a "pom-pom on a stick" top (visible on pine, oak, flame tree); the
  wisteria's trunk is naked between the two draping curtains; the juniper's foliage
  pads are thin dot-clouds instead of the flat cloud-pads that define the species; and
  there's no root flare (nebari) at the trunk base.
                                         
  2. Design principles for the redesign  
                                         
  Three axes of change, each independently testable:                                   
                                         
  A. Add a z-axis while keeping the renderer 2D SVG. Each branch gets an azimuth (0–2π 
  around the trunk axis) in addition to its existing pitch (above/below horizontal).
  Project to 2D with dx = cos(azimuth) · horizontalLength, carry z = sin(azimuth) · 
  horizontalLength only as metadata. Use z for:
                                                                                       
  - Painter's-order sort before rendering (far branches first → near branches overpaint
   trunk and other branches)                                                           
  - Atmospheric tint (far branches use foliageColor, near branches use             
  foliageColorLight, mid use a lerp) — the config already has both colours, we just use
   them across depth instead of randomly                                           
  - Slight foreshortening — apparent length = sqrt(horiz² + z²·k) with k < 1 so        
  rearward branches look slightly shorter                                          
  - Sub-pixel vertical parallax — a very small dy += z · 0.15 to avoid branches going
  straight at you looking identical to sideways branches                               
                                         
  No actual 3D math or WebGL — it's just one extra scalar per branch that drives sort  
  order and a colour lerp. Tests that inspect branches[0].pathData still work because  
  the path is still 2D.                         
                                                                                       
  B. Replace the binary L/R recursion with a species-driven branching grammar. Three   
  branching modes, picked per species by a new phyllotaxy field:
                                                                                       
  - whorled (pine, juniper) — primary branches appear in rings (whorls) at discrete
  heights. Each whorl has 3–5 branches evenly spaced around the trunk in azimuth (k ·  
  2π / whorlSize + jitter). Between whorls, no primary branches. Matches the real Pine
  growth "nodes" described in SPECIES.md.                                              
  - opposite (maple, flame tree) — branches appear in opposite pairs, but each     
  successive pair rotates 90° around the trunk (classical decussate arrangement). This 
  alone fixes the bare-centre problem for maple because pairs 2 and 4 now project
  forward/backward, filling the middle.                                                
  - alternate (cherry, oak, wisteria) — branches spiral up the trunk at the golden     
  angle (137.5°). Avoids any repeated azimuth and gives a naturally asymmetric
  silhouette.                                                                          
                                                                                   
  Recursion also needs to change:   
                                                                                       
  - Increase MAX_DEPTH from 2 to 4 (primary / secondary / tertiary / twig), and make it
   species-configurable.                                                               
  - Replace binary fork with childCountRange: [min, max] — maple forks into 2 (opposite
   buds), oak forks into 1–2 (alternate), pine into 2–4 at a whorl then 1–2 after.     
  - Add an apical-dominance factor — one child continues near-parallel to parent (the
  "leader"), others diverge more sharply and are shorter. Without this, forks always   
  look like a peace sign.                                                          
  - Tiny "wandering" at each step: parent angle is perturbed by a small random walk
  before spawning children, so the trunk line into secondaries doesn't look            
  ruler-straight.                               
                                                                                       
  C. Fill the crown with foliage pads, not just terminal tufts. Replace the current    
  "leaves-only-at-terminals + optional-along-branch" model with a pad abstraction:
                                                                                       
  - Each terminal branch tip carries a pad (a small disc of leaves in normalized 3D,
  projected to 2D with a z-jitter).                                                    
  - Pad radius, leaf density inside the pad, and pad-to-pad spacing are species        
  parameters.                            
  - Pads from different branches naturally overlap in the 2D projection → the "empty   
  middle" disappears because a front-facing branch's pad visibly covers the trunk in   
  front of a back-facing branch.         
  - For open-canopy species (oak, cherry) pads are small and sparse; for dense pad     
  species (juniper, pine, flame tree) they're larger and overlap heavily.              
  - Existing leavesAlongBranch becomes a special case of the pad model (pads at every
  tertiary, not only terminals).                                                       
                                                                                       
  3. New SpeciesConfig schema                   
                                                                                       
  Concrete new fields. Old fields stay (for migration; some will be deprecated in the
  last phase).                                                                         
                                                                                       
  interface SpeciesConfig {              
    // ... existing Display / Gameplay / Trunk fields unchanged ...                    
                                                                                   
    // ─── Architecture ───────────────────────────────────────────────                
    /** Drives primary-branch azimuth placement and child count per fork. */       
    phyllotaxy: "opposite" | "alternate" | "whorled";                                  
                                                                                   
    /** Only used when phyllotaxy === "whorled". Number of branches per whorl node. */ 
    whorlSize?: number;                    // pine 3-4, juniper 3                  
                                                
    /** Max recursion depth (0 = primary only, 4 = twigs). */                          
    maxDepth: number;                      // deciduous 4, conifer 3                   
                                                                                       
    /** [min, max] children per fork at each depth. */                                 
    childCountByDepth: [number, number][]; // one tuple per depth level                
                                                                                       
    /** 0 = child always diverges fully; 1 = one child continues almost parallel       
  (strong leader). */                                                                  
    apicalDominance: number;               // pine 0.8, maple 0.3, oak 0.5             
                                                                                       
    /** Small random walk applied to parent angle before spawning children, radians. */
    branchWander: number;                  // 0.05 straight (flame); 0.2 gnarled   
  (wisteria)                                                                           
                                                                                       
    // ─── 3D placement ───────────────────────────────────────────────                
    /** How much of the full azimuth circle primary branches use.                      
     *  1.0 = full 360° (upright species); 0.6 = forward-biased hemisphere (cascade).  
  */                                                                                   
    azimuthSpread: number;                                                             
                                                                                       
    /** 0 = flat (old behaviour, all z=0); 1 = equal spread forward/back/side. */      
    crownDepthFactor: number;              // deciduous 0.8, conifer 0.9, weeping 0.4
                                                                                       
    // ─── Foliage pads ───────────────────────────────────────────────            
    foliageDistribution: "terminal" | "pad" | "scattered" | "pendent";                 
                                                                                       
    /** Pad radius in SVG units. Higher = more overlap with trunk / siblings. */       
    padRadius: number;                     // oak 6, pine 10, juniper 14, flame 16     
                                                                                       
    /** Pads at tertiary level in addition to terminals (0 = tips only, 1 = every 
  tertiary). */                                                                        
    interiorPadDensity: number;                                                        
                                                                                       
    /** Leaves per pad, layered front-to-back inside the pad disc. */                  
    leavesPerPad: [number, number];                                                    
                                                                                       
    // ─── Trunk refinements ──────────────────────────────────────────                
    nebariSpread: number;                  // 0 none; 3-6 visible root flare           
    trunkTaperPower: number;               // 0.5-1.5, controls how fast trunk narrows 
    trunkJaggedness: number;               // extra small lateral wobbles (0-1)        
                                                                                       
    // ─── Tip behaviour ──────────────────────────────────────────────                
    /** -1 weeping (wisteria tips plunge); 0 horizontal; +1 upturned (pine candles). */
    tipDroop: number;                                                                  
                                                                                       
    /** Per-tree variation amplitude — bigger values = more variety across seeds of 
  same species. */                                                                     
    individualVariability: number;         // default 0.15; wisteria 0.3               
  }                                                                                    
                                                                                       
  4. Proposed species values                                                           
                                                                                       
  ┌───────┬────────┬──────────┬──────────┬────────┬──────────┬────────┬──────────┐     
  │ field │  pine  │  maple   │  cherry  │ junipe │   oak    │ wister │  flame   │     
  │       │        │          │          │   r    │          │   ia   │          │     
  ├───────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤     
  │ phyll │ whorle │ opposite │ alternat │ whorle │ alternat │ altern │ opposite │     
  │ otaxy │ d      │          │ e        │ d      │ e        │ ate    │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤    
  │ whorlS │ 4      │ —        │ —        │ 3      │ —        │ —      │ —        │
  │ ize    │        │          │          │        │          │        │          │    
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ maxDep │ 3      │ 4        │ 4        │ 3      │ 4        │ 3      │ 4        │    
  │ th     │        │          │          │        │          │        │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ childC │ [[3,4] │ [[2,2],[ │ [[1,2],[ │ [[2,3] │ [[1,2],[ │ [[1,2] │ [[2,2],[ │    
  │ ountBy │ ,[1,2] │ 2,2],[1, │ 1,3],[2, │ ,[1,2] │ 2,3],[2, │ ,[1,2] │ 2,3],[2, │
  │ Depth  │ ,[2,3] │ 3],[1,2] │ 3],[1,2] │ ,[2,4] │ 3],[1,2] │ ,[1,3] │ 4],[1,2] │    
  │        │ ]      │ ]        │ ]        │ ]      │ ]        │ ]      │ ]        │    
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ apical │        │          │          │        │          │        │          │    
  │ Domina │ 0.8    │ 0.3      │ 0.5      │ 0.6    │ 0.5      │ 0.7    │ 0.2      │
  │ nce    │        │          │          │        │          │        │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤    
  │ branch │ 0.08   │ 0.12     │ 0.10     │ 0.18   │ 0.10     │ 0.22   │ 0.05     │
  │ Wander │        │          │          │        │          │        │          │    
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ azimut │        │          │          │        │          │        │          │
  │ hSprea │ 1.0    │ 1.0      │ 1.0      │ 0.75   │ 1.0      │ 0.65   │ 1.0      │
  │ d      │        │          │          │        │          │        │          │    
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ crownD │        │          │          │        │          │        │          │    
  │ epthFa │ 0.9    │ 0.8      │ 0.7      │ 0.85   │ 0.8      │ 0.45   │ 0.6      │
  │ ctor   │        │          │          │        │          │        │          │    
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ foliag │        │          │          │        │          │        │          │    
  │ eDistr │ pad    │ pad      │ terminal │ pad    │ terminal │ penden │ pad      │
  │ ibutio │        │          │          │        │          │ t      │          │    
  │ n      │        │          │          │        │          │        │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤    
  │        │        │          │          │        │          │ — (pen │          │
  │ padRad │ 10     │ 8        │ 5        │ 14     │ 6        │ dent   │ 16       │    
  │ ius    │        │          │          │        │          │ overri │          │
  │        │        │          │          │        │          │ des)   │          │    
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ interi │        │          │          │        │          │        │          │
  │ orPadD │ 0.7    │ 0.4      │ 0.2      │ 0.8    │ 0.2      │ 0.1    │ 0.6      │    
  │ ensity │        │          │          │        │          │        │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤    
  │ leaves │ [10,14 │ [6,10]   │ [4,7]    │ [18,26 │ [4,6]    │ [3,5]  │ [6,10]   │    
  │ PerPad │ ]      │          │          │ ]      │          │        │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤    
  │ nebari │ 4      │ 5        │ 3        │ 3      │ 6        │ 4      │ 3        │
  │ Spread │        │          │          │        │          │        │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤    
  │ trunkT │        │          │          │        │          │        │          │
  │ aperPo │ 0.7    │ 0.9      │ 1.0      │ 0.8    │ 0.6      │ 1.2    │ 0.8      │    
  │ wer    │        │          │          │        │          │        │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤    
  │ trunkJ │        │          │          │        │          │        │          │
  │ aggedn │ 0.2    │ 0.3      │ 0.15     │ 0.6    │ 0.3      │ 0.5    │ 0.1      │    
  │ ess    │        │          │          │        │          │        │          │
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ tipDro │ +0.3   │ 0        │ +0.1     │ 0      │ 0        │ -0.9   │ -0.2     │
  │ op     │        │          │          │        │          │        │          │    
  ├────────┼────────┼──────────┼──────────┼────────┼──────────┼────────┼──────────┤
  │ indivi │        │          │          │        │          │        │          │    
  │ dualVa │ 0.15   │ 0.2      │ 0.15     │ 0.25   │ 0.15     │ 0.3    │ 0.15     │
  │ riabil │        │          │          │        │          │        │          │    
  │ ity    │        │          │          │        │          │        │          │
  └────────┴────────┴──────────┴──────────┴────────┴──────────┴────────┴──────────┘    
                                                                                   
  Rationale anchors from research: pine's 3–5 bud whorls, maple's decussate opposite   
  phyllotaxy, oak's zigzag alternate branching, juniper's flat cloud-pad foliage,
  wisteria's 30cm+ pendent racemes (hence pendent distribution + strongly negative     
  tipDroop), flame tree's short-trunk-wide-crown habit.                                
                                                
  5. Phased implementation plan                                                        
                                                                                   
  Each phase produces working, testable code; each ends with a snapshot regeneration +
  visual review. I'd suggest merging phase-by-phase rather than bundling.              
                                         
  Phase 0 — baseline (½ day)                                                           
                                                                                   
  - Add scripts/snapshot-diff.ts that generates snapshots, renders to PNG (I used
  Playwright for this; see research artefact), and writes a grid image per species
  showing all growth stages side-by-side. Commit the grids to a docs/bonsai-snapshots/
  directory (NOT public/ so they don't ship).                                          
  - This gives us a visual baseline to compare every subsequent phase against.
  - No code change to the generator.                                                   
  - Exit criterion: the grid images are checked in; reviewing them matches the "current
   defects" list above.                  
                                                                                       
  Phase 1 — extend the config schema, keep renderer behaviour (1 day)              
                                                                                       
  - Add the new fields to SpeciesConfig with defaults that reproduce today's behaviour
  (e.g. phyllotaxy: "opposite" + childCountByDepth: [[2,2],[2,2],[2,2]] +
  crownDepthFactor: 0 + foliageDistribution: "terminal").                              
  - Fill in the per-species values from §4 (initial estimates — we'll tune in later
  phases).                                                                             
  - Update schema.ts and SPECIES.md to document the new fields.                    
  - All existing unit tests still pass because the renderer doesn't use the new fields 
  yet.                                                                             
  - Exit criterion: pnpm test + pnpm lint green; snapshots byte-identical to phase 0.  
                                                                                   
  Phase 2 — introduce the z-axis (2 days)                                              
                                                                                   
  - Extend BranchSpec with azimuth: number and z: number. Branch creation logic still  
  places all branches at azimuth ∈ {0, π} so output is unchanged for now.
  - Project: in buildBranchTree, the cos/sin of angle is replaced by cos(pitch) ·      
  cos(azimuth) for dx and cos(pitch) · sin(azimuth) for dz; dy stays sin(pitch). z is  
  stored on the spec.                                                                  
  - Add z-sorted rendering: in StaticTreeSVG, sort svgData.branches by -z before       
  mapping. Already done for depth — just add z as secondary key.                       
  - Add depth-tinted leaves: in renderLeaves, lerp foliageColor → foliageColorLight as 
  (1 - z_norm) / 2 + 0.5 to lighten near-viewer leaves.                                
  - Test it by temporarily setting one species (say maple) to spread primary branches
  around the full azimuth circle with crownDepthFactor: 1.0. Regenerate snapshots — you
   should see overlap between branches.                                                
  - Revert the test change; the renderer now supports z but no species uses it yet
  (azimuthSpread: 0 or L/R-only placement for all species still).                      
  - Exit criterion: With all species using flat placement, snapshots byte-identical to 
  phase 1. With maple temporarily flipped to full 3D, snapshots visibly show overlap
  and shading.                                                                         
                                                                                   
  Phase 3 — phyllotaxy-driven primary placement (2 days)                               
                                                                                   
  - Rewrite the primary-branch placement loop in generateTree:                         
    - For whorled: group branches into whorl nodes at heights from                     
  computeBranchHeights; each node produces whorlSize branches at 2π · k / whorlSize + 
  jitter azimuths.                                                                     
    - For opposite: produce pairs at each height, with pair N's azimuth rotated 90°
  from pair N-1 (decussate).                                                           
    - For alternate: each primary's azimuth = previous + golden_angle (137.5° = 2.399  
  rad) + jitter.                         
  - Remove the L0/L1/R0/R1 ID scheme — new IDs should be p0/p1/… (primary index) +     
  -a/-b/-c (child index). Keep id length stable so pruning IDs stored in existing save
  games can be mapped: write a tiny migration in storage.ts that maps old L{i} → p{2i} 
  and R{i} → p{2i+1}.                                                              
  - Update tests: the pruning / regrowth tests target ID L0 — change to whatever the   
  new equivalent is (or keep an L0 alias during migration window).                     
  - Regenerate snapshots. Expect: symmetric-spoke look gone; branches now coming
  forward and backward; "empty middle" already visibly reduced for maple/oak/cherry    
  even before foliage changes.                                                     
  - Exit criteria: All tests green (with migration). Snapshot inspection confirms no   
  L/R mirror symmetry on any species; cherry + maple show branches overlapping the 
  trunk.                                                                               
                                                                                   
  Phase 4 — deeper recursion with variable children (1.5 days)                         
                                                
  - Refactor buildBranchTree to take childCountByDepth and loop instead of hard-calling
   twice. For n children, assign each an angle offset — the first child is the "leader"
   (offset = 0, length factor = 0.85–0.9, driven by apicalDominance) and the rest get  
  ±splitDiverge · k + jitter.                                                          
  - Raise MAX_DEPTH ceiling; keep the config-driven spec.maxDepth as the per-species
  cap.                                                                                 
  - Add branchWander: before each recursion, perturb the parent angle by (seededVal -  
  0.5) * 2 * branchWander. Small for flame tree, large for wisteria.
  - Keep the same SPLIT_DELAY but scale the childLength factor by depth (shorter twigs 
  at depth 3 vs depth 1).                                                          
  - Tests: the existing "has many branches" assertion (> 4) will now produce many more 
  — update to > 20 for mature pine. Add a new test that apicalDominance produces a 
  child within ±0.1 radian of the parent direction.
  - Exit criteria: All species show visible fine branching instead of 4 tip-ends per   
  primary; twig count per tree at day 100 in the 40–120 range.
                                                                                       
  Phase 5 — foliage pad system (2 days)                                            
                                                                                       
  - New generatePad(center3D, radius, leafCount, spec) → Leaf[] helper. Places leaves
  within a sphere in normalized 3D, projects to 2D, tags each leaf with its z for      
  sort-order.                                                                      
  - New foliageDistribution switch in generateTree after the branch loop:              
    - terminal: one pad at each terminal (current behaviour, but richer now that       
  terminals count is higher).            
    - pad: pad at every tertiary + bigger pad at each terminal.                        
    - scattered: random set of pad centres biased toward branch tips, ignoring whether
  a specific branch hosts them — simulates the "cloud of leaves" look of mature        
  broad-leaves.                                 
    - pendent: replace pads with hanging lines of leaves of length                     
  spec.flowers?.racemeLength ?? 20 — used by wisteria for branches (not just flowers).
  - Z-sort all leaves in the rendered layer, not just by branch — front pads should    
  overpaint back branches' pads.                                                       
  - Inner leaves use foliageColor (darker); outer/near-viewer leaves use               
  foliageColorLight — gives shading "for free" from the existing palette.              
  - Exit criteria: Every species at day 100 passes the "cover the middle" test:        
  projecting a horizontal line through the trunk midpoint at crown height should hit   
  leaves >60% of the way across for broad-canopy species. Pine and juniper should have 
  visibly distinct pads (clouds) rather than radial spikes.                            
                                         
  Phase 6 — trunk refinements (1 day)                                                  
                                                                                   
  - Nebari: at the trunk base, splay 3–5 short root fingers outward using nebariSpread 
  as their length. Small path elements that share trunkColor.                      
  - Variable trunk taper via trunkTaperPower: replace trunkTopW = trunkBaseW * 0.28    
  with trunkTopW = trunkBaseW * 0.28 ^ trunkTaperPower so wisteria (power 1.2) tapers
  faster than oak (power 0.6).                                                         
  - Trunk jaggedness: add 2–4 small bumps/notches along the trunk silhouette using a
  few additional bezier control points, controlled by trunkJaggedness. Makes juniper +
  wisteria visibly gnarled.                     
  - Remove the fixed apex-L / apex-R pair — the trunk top is now just another forking  
  node that spawns a whorl/fork under the new rules. This should remove the "pom-pom on
   a stick" artefact.                                                                  
  - Exit criterion: Trunk silhouettes clearly differ across species in taper and       
  texture; apex no longer looks like a second canopy on top of the first.
                                                                                       
  Phase 7 — tip behaviour (weep, droop, upturn) (½ day)                                
                                         
  - Add tipDroop effect: final-depth branches bend towards the tip by an angle of π/2 ·
   tipDroop. Implemented by blending each twig's angle with ±π/2 at its last 30% of    
  length — can use the existing curveBias mechanic with a pitch-varying bias instead of
   a constant.                                                                         
  - For wisteria + cherry, this + foliageDistribution: "pendent" gives the classic     
  weeping canopy without any hard-coded species logic.
  - Exit criterion: Wisteria and weeping cherry look visibly "weeping"; pine candles   
  turn upward at the tips.                                                         
                                                                                       
  Phase 8 — individual variability (½ day)                                         
                                                                                       
  - Wire individualVariability into the seeded-jitter magnitudes across the generator:
  azimuth offset, pitch offset, childCount interpolation, branchWander, padRadius.
  - Goal: seeds tree-1, tree-2, tree-3 of the same species should be recognisably the  
  same species but visibly individuals. Current renders look almost identical across
  seeds — fix that.                                                                    
  - Add a snapshot grid script that renders 4 seeds × every species at day 50 so we can
   eyeball variety.                                                                    
  - Exit criterion: Four seeds of the same species at the same day look distinct at a
  glance, but share species silhouette.                                                
                                         
  Phase 9 — migration + tuning + docs (1 day)                                          
                                                                                       
  - Write the storage migration for old pruned-branch IDs (simple mapping,
  version-bumped bonsai-state key).                                                    
  - Run through every species at every stage side-by-side with real bonsai reference   
  photos; tweak the §4 numbers in speciesConfig.ts. This will be iterative — expect 3–4
   passes.                                                                             
  - Update SPECIES.md:                                                             
    - New "Parameter Reference" table with all new fields                              
    - Refreshed per-species research notes referencing the new phyllotaxy / pad /  
  cascade settings                                                                     
    - Add a "How to add a new species" checklist that covers the new fields        
  - Delete the now-unused leavesPerCluster / leavesAlongBranch / legacy MAX_DEPTH etc. 
  (or mark deprecated if we want a deprecation window).                                
  - Exit criterion: Side-by-side grid of current + new looks like a clear quality
  upgrade on every species; SPECIES.md fully documents the new system.                 
                                                                                       
  Total estimate: 11–12 days across the 9 phases. Phases 0–2 are low-risk setup; phases
   3–5 are the big-bang bulk of the visual improvement; phases 6–9 are polish.         
                                                                                       
  6. Risks and fallbacks                                                               
                                                                                       
  Risk: Breaking existing saved game state (pruned-branch IDs reference old L0/R0   
    format)                                                                            
  Mitigation: Phase 3 includes a storage-level ID migration. Keep the L{i}/R{i} parsing
                                                                                       
    path as an alias for one release.                                               
  ────────────────────────────────────────                                             
  Risk: Rendering cost — deeper recursion + more leaves = bigger SVG strings           
  Mitigation: r(n) already rounds to 1 dp. Track the byte size of ancient-tree.svg per
    species; budget 500 KB/species max (juniper is already 277 KB). If we exceed that: 
    cap leavesPerPad and use a single <use> reference for repeated leaf paths.     
  ────────────────────────────────────────
  Risk: Test suite brittleness — many tests assert specific ID strings / branch counts
  Mitigation: Write new tests against behavioural properties (terminal count, crown
  fill                                                                                 
    fraction, z-sort invariant) rather than string matches. Update/replace any test
  that                                                                                 
     hard-codes L0.                                                                    
  ────────────────────────────────────────
  Risk: Over-parameterisation — users of SPECIES_CONFIG have to learn 12 new knobs     
  Mitigation: Group new fields in the type (as shown in §3 with // ─── Architecture    
    ───── dividers). Provide good defaults so new species can be added by setting only
    half the fields.                                                                   
  ────────────────────────────────────────                                         
  Risk: "Realism" overshoots stylisation — trees stop reading as cute bonsai and become
                                         
    busy/visually noisy                  
  Mitigation: Phase 9 tuning pass has a veto: if a species looks worse after the full  
    pipeline than it did before, keep the old value of crownDepthFactor etc. for that
    species. No global rule forces us to use every knob.                               
  ────────────────────────────────────────                                         
  Risk: 3D-feel tint conflicts with watering/fertiliser colour cues already in the
    renderer                                                                           
  Mitigation: Tint lerps foliageColor → foliageColorLight which both already belong to
    the species. No new colours introduced. Water-state tint on soil is unaffected.    
                                                                                   
  7. Validation gates between phases     
                                         
  At every phase end, commit + regenerate snapshots + visually eyeball the grid.
  Automated checks that should pass:                                                   
                                                
  - pnpm test (vitest) — all green                                                     
  - pnpm lint — no warnings                                                        
  - pnpm playwright test — no regression in existing bonsai UI tests
  - Snapshot byte budget: per-species SVG under 500 KB                                 
  - Deterministic test: generateTree(50, spec, [], "fixed-id") called twice returns
  identical output (keeps the existing contract in "determinism" test block)           
                                                                                                       
                                                                                       
  Sources used in research:                                                        
  - https://bonsai4me.com/developing-deciduous-bonsai-branch-structures-part-four/     
  - https://bonsai-science.com/ramification-of-branches-and-foliage/               
  - https://www.evergreengardenworks.com/pines.htm                                     
  - https://bonsaimirai.com/species/japanese-black-pine-bonsai
  - https://www.bonsaify.com/blogs/news-and-more/care-of-japanese-black-pine-bonsai-acr
  oss-their-life-cycle                                                                 
  - https://www.bjornbjorholm.com/care-and-maintenance-guide-for-native-japanese-maple-
  bonsai-acer/                                                                         
  - https://bonsaimirai.com/species/japanese-maple-bonsai
  - https://www.bonsaiempire.com/tree-species/juniper                                  
  - https://embundaun.com/creating-a-cascade-style-with-chinese-juniper-bonsai/
  - https://bonsai4me.com/speciesguides/quercus-species-oak-bonsai/                    
  - https://www.bonsaidirect.co.uk/blog/bonsai-species/oak-bonsai/english-oak-bonsai-tr
  ee-quercus-robur/                                                                    
  - https://www.bonsaiempire.com/tree-species/wisteria                                 
  - https://en.wikipedia.org/wiki/Wisteria                                             
  - https://www.bonsaiempire.com/tree-species/flame-tree                               
  - https://www.bonsaiempire.com/tree-species/cherry-prunus                        
                                                                                       