// ─── Output Types ─────────────────────────────────────────────────────────────

export interface Leaf {
  /** Stable React key — unique within this branch's leaf cluster. */
  id: string;
  cx: number;
  cy: number;
  /** For needles: half-length. For ovals/scale: half-width. For palmate/lobed: overall scale. */
  rx: number;
  /** For needles: half-thickness (always small). For ovals/scale: half-height. */
  ry: number;
  /** Rotation in degrees — needle direction, leaf tilt, etc. */
  angleDeg: number;
}

export interface RenderedBranch {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  pathData: string; // tapered filled shape
  depth: number;
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
}

export interface BranchSpec {
  id: string;
  appearsAtDay: number;
  x1: number;
  y1: number;
  fulltipX: number;
  fulltipY: number; // position at full growth (for child attachment)
  angle: number;
  maxLength: number;
  baseWidth: number;
  tipWidth: number;
  depth: number;
  /** Lateral midpoint offset for taperedPath — gives each branch its own gentle curve. */
  curveBias: number;
}
