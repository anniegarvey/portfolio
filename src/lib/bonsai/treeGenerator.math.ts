// ─── Seeded Randomness ────────────────────────────────────────────────────────

/** Returns a deterministic value in [0, 1) for a given string key + index.
 *  Consistent across renders for the same inputs. */
export function seededVal(key: string, index: number): number {
  let h = index * 2654435761;
  for (let i = 0; i < key.length; i++) {
    h = Math.imul(h ^ key.charCodeAt(i), 2246822519);
    h ^= h >>> 13;
  }
  h = Math.imul(h ^ (h >>> 16), 2246822519);
  return ((h >>> 0) & 0xffff) / 0x10000;
}

/** Linear interpolate between a and b, clamped to [0,1]. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

/** Clamps v to the range [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/** Round to 1 decimal place — reduces SVG path string size without visible loss. */
export function r(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Random integer in [min, max] using seededVal. */
export function seededInt(
  key: string,
  index: number,
  min: number,
  max: number,
): number {
  return min + Math.floor(seededVal(key, index) * (max - min + 1));
}

// ─── Geometry Helpers ─────────────────────────────────────────────────────────

/** Tapered filled quadrilateral path from (x1,y1) [width w1] to (x2,y2) [width w2].
 *  Sides are gently curved outward using quadratic bezier for an organic look. */
/** curveBias: lateral offset (SVG units) at midpoint — positive bends toward the perpendicular,
 *  negative away. Creates gently curved organic branches instead of straight ones. */
export function taperedPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  w1: number,
  w2: number,
  curveBias = 0,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return "";

  const px = -dy / len; // unit perpendicular x
  const py = dx / len; // unit perpendicular y

  const ax = x1 + px * w1;
  const ay = y1 + py * w1;
  const bx = x1 - px * w1;
  const by = y1 - py * w1;
  const cx = x2 + px * w2;
  const cy = y2 + py * w2;
  const dx2 = x2 - px * w2;
  const dy2 = y2 - py * w2;

  // Shift the midpoint laterally by curveBias to curve the branch centreline
  const mx = (x1 + x2) / 2 + px * curveBias;
  const my = (y1 + y2) / 2 + py * curveBias;
  const cp1x = mx + px * (w1 * 0.85);
  const cp1y = my + py * (w1 * 0.85);
  const cp2x = mx - px * (w1 * 0.85);
  const cp2y = my - py * (w1 * 0.85);

  return `M ${r(ax)} ${r(ay)} Q ${r(cp1x)} ${r(cp1y)} ${r(cx)} ${r(cy)} L ${r(dx2)} ${r(dy2)} Q ${r(cp2x)} ${r(cp2y)} ${r(bx)} ${r(by)} Z`;
}

/** Quadratic bezier point at parameter t. */
export function qbez(p0: number, p1: number, p2: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

/** Find the x position on the curved trunk centreline at height fraction t (0=base, 1=top). */
export function trunkCentreX(
  t: number,
  baseX: number,
  cpX: number,
  topX: number,
): number {
  return qbez(baseX, cpX, topX, t);
}
