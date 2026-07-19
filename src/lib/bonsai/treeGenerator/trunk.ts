import { lerp, qbez, r, seededVal, taperedPath } from "../treeGenerator.math";

// ─── Trunk Silhouette ─────────────────────────────────────────────────────────

/**
 * Computes the local perpendicular unit vector to the trunk centreline at
 * fraction `t` ∈ [0, 1]. Used both for taper width and for jaggedness offsets.
 */
function trunkPerpAt(
  t: number,
  trunkBaseX: number,
  trunkCpX: number,
  trunkTopX: number,
  trunkHeight: number,
): { px: number; py: number } {
  // Tangent of the centreline as a function of t (centreline x = qbez,
  // centreline y = baseY - trunkHeight·t → dy/dt = -trunkHeight).
  const dxdt =
    2 * (1 - t) * (trunkCpX - trunkBaseX) + 2 * t * (trunkTopX - trunkCpX);
  const dydt = -trunkHeight;
  const tlen = Math.hypot(dxdt, dydt) || 1;
  // Right-perpendicular: (px, py) = (-dydt, dxdt) / |t| → +x = right of centre.
  return { px: -dydt / tlen, py: dxdt / tlen };
}

/**
 * Builds the trunk silhouette path. Subdivides each side into `SEGS` quadratic
 * bezier sub-segments for smoothness, with `trunkJaggedness` perturbing the
 * silhouette knots perpendicularly (envelope sin(πt) anchors base + apex).
 *
 * When `trunkJaggedness === 0`, the result is a smooth piecewise-bezier
 * approximation of the original two-bezier trunk; non-zero jaggedness adds
 * gnarled bumps/notches along the silhouette.
 */
export function buildTrunkPath(
  trunkBaseX: number,
  trunkBaseY: number,
  trunkCpX: number,
  trunkTopX: number,
  trunkBaseW: number,
  trunkTopW: number,
  trunkHeight: number,
  trunkJaggedness: number,
  treeId: string,
): string {
  if (trunkHeight <= 0) return "";
  const SEGS = 5;

  /** Half-width of the trunk at fraction t ∈ [0, 1] (linear taper between
   *  base and top widths — `trunkTopW` already encodes the species' taper
   *  power, so the lerp here is just position-along-trunk). */
  const halfWidthAt = (t: number): number => lerp(trunkBaseW, trunkTopW, t) / 2;

  const centreAt = (t: number): { cx: number; cy: number } => ({
    cx: qbez(trunkBaseX, trunkCpX, trunkTopX, t),
    cy: trunkBaseY - trunkHeight * t,
  });

  const jitterMag = trunkJaggedness * trunkBaseW * 0.45;

  const silhouette = (
    t: number,
    side: -1 | 1,
    extraOffset: number,
  ): { x: number; y: number } => {
    const { cx, cy } = centreAt(t);
    const { px, py } = trunkPerpAt(
      t,
      trunkBaseX,
      trunkCpX,
      trunkTopX,
      trunkHeight,
    );
    const offset = halfWidthAt(t) + extraOffset;
    return { x: cx + side * px * offset, y: cy + side * py * offset };
  };

  const lKnots: { x: number; y: number }[] = [];
  const rKnots: { x: number; y: number }[] = [];
  for (let i = 0; i <= SEGS; i++) {
    const t = i / SEGS;
    const env = Math.sin(Math.PI * t); // anchor endpoints (env=0 at t=0, t=1)
    const lj = (seededVal(`${treeId}lj`, i) - 0.5) * 2 * jitterMag * env;
    const rj = (seededVal(`${treeId}rj`, i) - 0.5) * 2 * jitterMag * env;
    lKnots.push(silhouette(t, -1, lj));
    rKnots.push(silhouette(t, +1, rj));
  }

  // Mid-segment quadratic bezier control points sit on the un-jittered smooth
  // centreline, giving the multi-segment path a gently curving feel through
  // the jittered knot points (instead of straight-line segments).
  const lMids: { x: number; y: number }[] = [];
  const rMids: { x: number; y: number }[] = [];
  for (let i = 0; i < SEGS; i++) {
    const t = (i + 0.5) / SEGS;
    lMids.push(silhouette(t, -1, 0));
    rMids.push(silhouette(t, +1, 0));
  }

  let path = `M ${r(lKnots[0].x)} ${r(lKnots[0].y)} `;
  for (let i = 0; i < SEGS; i++) {
    path += `Q ${r(lMids[i].x)} ${r(lMids[i].y)} ${r(lKnots[i + 1].x)} ${r(lKnots[i + 1].y)} `;
  }
  path += `L ${r(rKnots[SEGS].x)} ${r(rKnots[SEGS].y)} `;
  for (let i = SEGS - 1; i >= 0; i--) {
    path += `Q ${r(rMids[i].x)} ${r(rMids[i].y)} ${r(rKnots[i].x)} ${r(rKnots[i].y)} `;
  }
  path += "Z";
  return path;
}

/**
 * Generates 3–5 short root fingers radiating from the trunk base (nebari).
 * Each finger is a small tapered shape extending outward and slightly down
 * from the basal edge of the trunk, painted with the same trunk fill so it
 * reads as a continuation of the trunk silhouette.
 *
 * `nebariSpread` (0–1+) scales finger length as a fraction of trunkBaseW.
 * Returns an empty array when the spread is 0 or the trunk hasn't formed.
 */
export function buildNebariPaths(
  trunkBaseX: number,
  trunkBaseY: number,
  trunkBaseW: number,
  nebariSpread: number,
  treeId: string,
): string[] {
  if (nebariSpread <= 0 || trunkBaseW <= 0) return [];
  // 3–5 fingers, deterministic per tree.
  const fingerCount = 3 + Math.floor(seededVal(`${treeId}nC`, 0) * 3);
  const baseLen = nebariSpread * trunkBaseW * 1.4;
  const halfBase = trunkBaseW / 2;
  const paths: string[] = [];
  for (let i = 0; i < fingerCount; i++) {
    const tFrac = (i + 0.5) / fingerCount; // 0..1 across the fan
    // Fan from lower-left through bottom to lower-right. Stay clear of the
    // straight-down direction so fingers visibly splay sideways above soil.
    const fanAngle = (tFrac - 0.5) * Math.PI * 1.15;
    const dx = Math.sin(fanAngle);
    // Shallow downward bias so fingers sit just above the soil ellipse instead
    // of plunging into it (soil ellipse rises ~1px above trunkBaseY).
    const dy = Math.abs(Math.cos(fanAngle)) * 0.3;
    const lenJ = 0.7 + seededVal(treeId, 310 + i) * 0.5;
    const len = baseLen * lenJ;
    // Attach across the width of the base so left fingers root in the left
    // half of the trunk and right fingers in the right half.
    const attachX = trunkBaseX + (tFrac - 0.5) * halfBase * 1.4;
    const attachY = trunkBaseY - 0.5;
    const tipX = attachX + dx * len;
    const tipY = attachY + dy * len;
    // Width: thicker at attach, tapering to a soft point.
    const w0 = 1.4 + nebariSpread * 1.2;
    const w1 = 0.4;
    paths.push(taperedPath(attachX, attachY, tipX, tipY, w0, w1));
  }
  return paths;
}
