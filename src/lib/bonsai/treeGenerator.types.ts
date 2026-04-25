// ─── Output Types ─────────────────────────────────────────────────────────────

export interface Leaf {
  /** Stable React key — unique within this branch's leaf cluster. */
  id: string;
  cx: number;
  cy: number;
  /** For needles: half-length. For ovals/scale: half-width. For palmate/lobed/pinnate: overall scale. */
  rx: number;
  /** For needles: half-thickness (always small). For ovals/scale: half-height. */
  ry: number;
  /** Rotation in degrees — needle direction, leaf tilt, etc. */
  angleDeg: number;
  /** Z-depth offset within the foliage pad (positive = toward viewer). Used for
   *  global depth-sort across all pads. 0 / absent for pre-pad-system clusters. */
  z?: number;
}

export interface Floret {
  /** Stable React key within this flower's floret list. */
  id: string;
  /** Position of this individual floret within the raceme / cluster. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  angleDeg: number;
}

export interface Flower {
  /** Stable React key — unique per flower within the tree. */
  id: string;
  /** Attachment point — where the flower meets the branch tip. */
  cx: number;
  cy: number;
  /** [0,1] fade-in progress, same semantics as branch effectiveProg. */
  progress: number;
  /** Pre-computed florets for cluster / catkin shapes. */
  florets: Floret[];
  /** Pre-computed raceme florets for wisteria — empty for other shapes. */
  racemeFlorets: Floret[];
}

export interface RenderedBranch {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pathData: string; // tapered filled shape
  depth: number;
  /** Z-depth of the branch tip: positive = toward viewer, negative = away.
   *  0 for flat branches (azimuth ∈ {0, π}); non-zero once Phase 3
   *  introduces full azimuth spread. */
  z: number;
  leaves: Leaf[];
  isPruned: boolean;
  isTerminal: boolean;
}

export interface TreeSVGData {
  viewBox: string;
  trunkX: number;
  trunkBaseY: number;
  trunkTopY: number;
  trunkTopX: number; // offset from centre due to curvature
  trunkPathData: string;
  branches: RenderedBranch[];
  /** Leaf cluster at the trunk apex — always rendered, never prunable. */
  apexLeaves: Leaf[];
  /** Flowers generated once activeDaysCount >= floweringAge. Empty array before that. */
  flowers: Flower[];
}

export interface BranchSpec {
  id: string;
  appearsAtDay: number;
  x1: number;
  y1: number;
  fulltipX: number;
  fulltipY: number; // position at full growth (for child attachment)
  angle: number;
  /** Yaw around the trunk's vertical axis (0 = right/front, π = left/back).
   *  Phase 2: only 0 and π are used. Phase 3 will introduce full-circle spread. */
  azimuth: number;
  /** Z-depth of the branch tip: positive = toward viewer, negative = away.
   *  Derived from pitch and azimuth; clamped to 0 when |value| < 1e-10. */
  z: number;
  maxLength: number;
  baseWidth: number;
  tipWidth: number;
  depth: number;
  /** Lateral midpoint offset for taperedPath — gives each branch its own gentle curve. */
  curveBias: number;
  /** True 3D elevation angle (radians above horizontal) passed explicitly so z
   *  and the oblique lean are computed from the species pitch, not re-derived
   *  from the 2D angle (which loses information when cos(azimuth) = 0). */
  pitch: number;
}
