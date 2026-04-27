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
  /** Per-leaf depth offset within its pad. The renderer adds this to the
   *  parent branch's z to z-sort every leaf globally so front pads overpaint
   *  rear pads (and rear branches), regardless of which branch they sit on. */
  z: number;
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
   *  Drives painter-order sort and depth tinting. 0 at cardinal azimuths
   *  ({0, π}); non-zero for the full-circle phyllotaxy primaries. */
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
  /** 3–5 short tapered "root finger" paths radiating from the trunk base.
   *  Painted with the trunk fill so they read as a continuation of the trunk
   *  silhouette (nebari/root flare). Empty array when `nebariSpread === 0`
   *  or before the trunk has begun forming. */
  nebariPathData: string[];
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
  /** 2D angle on the SVG plane (atan2 of the projected (dx, dy)). */
  angle: number;
  /** Yaw around the trunk's vertical axis (0 = right, π/2 = toward viewer,
   *  π = left, 3π/2 = away). Set per phyllotaxy in `generateTree`. */
  azimuth: number;
  /** Z-depth of the branch tip: positive = toward viewer, negative = away.
   *  Derived from pitch and azimuth; clamped to 0 when |value| < 1e-10. */
  z: number;
  /** Foreshortened 2D length on the SVG plane, used by the renderer for the
   *  growth animation lerp. Equals the 3D length only for branches lying in
   *  the picture plane (azimuth ∈ {0, π}); strictly smaller when the branch
   *  has any forward/back component. */
  maxLength: number;
  baseWidth: number;
  tipWidth: number;
  depth: number;
  /** Lateral midpoint offset for taperedPath — gives each branch its own gentle curve. */
  curveBias: number;
}
