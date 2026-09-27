import type { FlowerShape, LeafShape } from "@/lib/bonsai/speciesConfig";
import type { Leaf } from "@/lib/bonsai/treeGenerator";

// ─── Leaf silhouettes ─────────────────────────────────────────────────────────
//
// Each species' leaf is a detailed silhouette in unit space — tip toward -y,
// roughly centred on the origin, x scaled by `leaf.rx` and y by `leaf.ry`.
// Every leaf of a depth band is written into ONE <path>, so a mature crown
// costs a handful of DOM nodes instead of one (or, for wisteria, fifteen) per
// leaf. Leaves in the same band share a colour, so their paint order within
// the band never shows.
//
// Solids are wound one way and holes (midribs, flower eyes) the other. Under
// the default nonzero fill rule that makes a hole cut its own leaf while
// staying covered wherever another leaf of the band overlaps it. Transforms
// are rotate + positive scale only: a mirror would reverse the winding and
// punch holes wherever two leaves cross.

type Pt = readonly [number, number];

export interface LeafTemplate {
  solids: Pt[][];
  holes: Pt[][];
}

/** Twice the signed area — the sign is the ring's winding direction. */
function signedArea(ring: Pt[]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return a;
}

function wound(ring: Pt[], positive: boolean): Pt[] {
  return signedArea(ring) > 0 === positive ? ring : [...ring].reverse();
}

function template(solids: Pt[][], holes: Pt[][] = []): LeafTemplate {
  return {
    solids: solids.map((r) => wound(r, true)),
    holes: holes.map((r) => wound(r, false)),
  };
}

function rotateRing(ring: Pt[], rad: number, ox = 0, oy = 0): Pt[] {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return ring.map(([x, y]) => [ox + x * c - y * s, oy + x * s + y * c]);
}

/**
 * A blade grown along the -y axis from `base` to `tip`, `halfWidth(t)` wide
 * at fraction t (0 = base, 1 = tip). Right edge up, left edge back down.
 */
function blade(
  halfWidth: (t: number) => number,
  steps: number,
  base: number,
  tip: number,
): Pt[] {
  const right: Pt[] = [];
  const left: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = base + (tip - base) * t;
    const w = halfWidth(t);
    right.push([w, y]);
    left.push([-w, y]);
  }
  return [...right, ...left.reverse()];
}

/** A thin stalk from (0, y0) to (0, y1), `w` half-width. */
function stalk(y0: number, y1: number, w: number): Pt[] {
  return [
    [-w, y0],
    [w, y0],
    [w * 0.6, y1],
    [-w * 0.6, y1],
  ];
}

// ─── Species silhouettes ──────────────────────────────────────────────────────
// Point budgets are deliberately lean (roughly 25–100 points a leaf): a mature
// crown carries several hundred leaves, and every point is path text the
// browser has to parse and fill.

/** A point `r` out from `origin` at `deg` degrees clockwise from straight up. */
function polar(origin: Pt, deg: number, r: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [origin[0] + Math.sin(a) * r, origin[1] - Math.cos(a) * r];
}

/**
 * Japanese black pine — a fascicle tuft: stiff needles fanned upward from a
 * short sheath, longest in the middle, so a pad of a few tufts reads as the
 * bristly horizontal cloud of a trained pine. One zigzag ring: each needle
 * is a tip and the notch before the next.
 */
function pineTuft(): LeafTemplate {
  const base: Pt = [0, 0.62];
  const count = 11;
  const ring: Pt[] = [
    [0.07, 0.72],
    [-0.07, 0.72],
  ];
  for (let i = 0; i < count; i++) {
    const f = i / (count - 1);
    const deg = -74 + f * 148 + (i % 2 ? 3 : -3);
    const len = 0.8 + 0.34 * Math.sin(f * Math.PI) - (i % 3 === 1 ? 0.12 : 0);
    ring.push(polar(base, deg - 1.5, 0.12), polar(base, deg, len));
  }
  ring.push(polar(base, 76, 0.12));
  return template([ring]);
}

/**
 * Japanese maple (Acer palmatum) — seven slender, pointed lobes cut deep
 * toward the stalk, a tooth stepping in near each tip, on a thin petiole.
 */
function mapleLeaf(): LeafTemplate {
  const palm: Pt = [0, 0.2];
  const lobes: [deg: number, length: number][] = [
    [-130, 0.42],
    [-88, 0.72],
    [-44, 0.92],
    [0, 1],
    [44, 0.92],
    [88, 0.72],
    [130, 0.42],
  ];
  const ring: Pt[] = [
    [-0.025, 0.95],
    [-0.03, 0.34],
  ];
  lobes.forEach(([deg, len], i) => {
    const prev = lobes[i - 1]?.[0] ?? -175;
    ring.push(polar(palm, (deg + prev) / 2, 0.3)); // sinus
    ring.push(
      polar(palm, deg - 17, len * 0.55),
      polar(palm, deg - 9, len * 0.8),
      polar(palm, deg - 5, len * 0.8),
      polar(palm, deg, len),
      polar(palm, deg + 5, len * 0.8),
      polar(palm, deg + 9, len * 0.8),
      polar(palm, deg + 17, len * 0.55),
    );
  });
  ring.push(polar(palm, 175, 0.2), [0.03, 0.34], [0.025, 0.95]);
  return template([ring]);
}

/**
 * Flowering cherry — a five-petalled sakura blossom, each rounded petal
 * notched at its tip, with an open eye where the stamens sit.
 */
function sakuraOutline(): Pt[] {
  const ring: Pt[] = [];
  const centre: Pt = [0, 0];
  for (let p = 0; p < 5; p++) {
    const mid = p * 72;
    ring.push(
      polar(centre, mid - 36, 0.3), // claw between petals
      polar(centre, mid - 31, 0.66),
      polar(centre, mid - 23, 0.9),
      polar(centre, mid - 12, 1),
      polar(centre, mid - 4, 0.94),
      polar(centre, mid, 0.8), // notch
      polar(centre, mid + 4, 0.94),
      polar(centre, mid + 12, 1),
      polar(centre, mid + 23, 0.9),
      polar(centre, mid + 31, 0.66),
    );
  }
  return ring;
}

function sakuraBlossom(): LeafTemplate {
  const eye = [0, 72, 144, 216, 288].map((d) => polar([0, 0], d + 36, 0.14));
  return template([sakuraOutline()], [eye]);
}

/**
 * Flowering cherry, in leaf — ovate with a drawn-out tip and a finely
 * toothed margin, on a short stalk. A young cherry wears these; it has to
 * reach flowering age before the crown fills with blossom.
 */
function cherryLeaf(): LeafTemplate {
  const body = blade(
    (t) => {
      const w = 0.4 * Math.sin(Math.PI * t ** 0.8) ** 0.9;
      return Math.max(0.006, w * (isNotch(t, 10) ? 0.9 : 1));
    },
    10,
    0.72,
    -1,
  );
  const midrib = blade((t) => 0.016 * (1 - t * 0.7), 1, 0.55, -0.7);
  return template([body, stalk(0.7, 1, 0.03)], [midrib]);
}

/** Whether sample t (of `steps`) is an odd one — the notch of a serration. */
function isNotch(t: number, steps: number): boolean {
  return Math.round(t * steps) % 2 === 1;
}

/**
 * Juniper — a spray of scale foliage: a flat-bottomed cloudlet whose domed
 * top breaks into small rounded tips, the texture a trained juniper pad
 * shows from a distance.
 */
function juniperSpray(): LeafTemplate {
  const ring: Pt[] = [];
  const steps = 36;
  const bump = [0.84, 0.95, 1, 0.95];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const top = Math.sin(a) < 0;
    const r = top ? bump[i % bump.length] : 0.92;
    ring.push([Math.cos(a) * r, Math.sin(a) * r * (top ? 0.8 : 0.42)]);
  }
  return template([ring]);
}

/**
 * English oak (Quercus robur) — obovate, widest above the middle, with four
 * rounded lobes a side cut by deep sinuses, small ear-like auricles at the
 * base and a very short stalk.
 */
function oakLeaf(): LeafTemplate {
  // [position along the blade, half-width]: auricle, then sinus / lobe
  // pairs growing toward the rounded terminal lobe.
  const edge: Pt[] = [
    [0, 0.06],
    [0.05, 0.16],
    [0.12, 0.1],
    [0.2, 0.27],
    [0.29, 0.28],
    [0.36, 0.16],
    [0.45, 0.4],
    [0.53, 0.4],
    [0.6, 0.2],
    [0.68, 0.44],
    [0.76, 0.4],
    [0.81, 0.2],
    [0.88, 0.3],
    [0.95, 0.2],
    [1, 0],
  ];
  const y = (t: number) => 0.85 - t * 1.85;
  const body: Pt[] = [
    ...edge.map(([t, w]) => [w, y(t)] as Pt),
    ...[...edge].reverse().map(([t, w]) => [-w, y(t)] as Pt),
  ];
  const midrib = blade((t) => 0.018 * (1 - t * 0.7), 1, 0.6, -0.7);
  return template([body, stalk(0.8, 1.02, 0.035)], [midrib]);
}

/**
 * Wisteria — a pinnate compound leaf: an arching rachis carrying five pairs
 * of pointed, oval leaflets and one at the tip.
 */
function wisteriaLeaf(): LeafTemplate {
  const leaflet = (len: number): Pt[] => [
    [0, 0],
    [0.14 * len, -0.3 * len],
    [0.1 * len, -0.72 * len],
    [0, -len],
    [-0.1 * len, -0.72 * len],
    [-0.14 * len, -0.3 * len],
  ];
  const solids: Pt[][] = [stalk(1, -0.85, 0.03)];
  for (let i = 0; i < 5; i++) {
    const y = 0.72 - i * 0.33;
    const len = 0.54 - i * 0.03;
    for (const side of [-1, 1]) {
      solids.push(rotateRing(leaflet(len), side * 1.15, 0, y));
    }
  }
  solids.push(rotateRing(leaflet(0.46), 0, 0, -0.85));
  return template(solids);
}

/**
 * Flame tree (Delonix regia) — a bipinnate frond: a rachis carrying pairs
 * of feathery pinnae, each edged with tiny leaflets, the fern-like texture
 * that fills the flat umbrella crown.
 */
function flameFrond(): LeafTemplate {
  const pinna = (len: number): Pt[] => {
    const w = 0.16 * len;
    return [
      [0, 0],
      [w, -0.2 * len],
      [w * 0.35, -0.38 * len],
      [w, -0.55 * len],
      [w * 0.35, -0.72 * len],
      [w * 0.6, -0.86 * len],
      [0, -len],
      [-w * 0.6, -0.86 * len],
      [-w * 0.35, -0.72 * len],
      [-w, -0.55 * len],
      [-w * 0.35, -0.38 * len],
      [-w, -0.2 * len],
    ];
  };
  const solids: Pt[][] = [stalk(1, -1, 0.025)];
  for (let i = 0; i < 4; i++) {
    const y = 0.7 - i * 0.42;
    const len = 0.66 - i * 0.09;
    for (const side of [-1, 1]) {
      solids.push(rotateRing(pinna(len), side * 1.05, 0, y));
    }
  }
  return template(solids);
}

export const LEAF_TEMPLATES: Record<LeafShape, LeafTemplate> = {
  needle: pineTuft(),
  palmate: mapleLeaf(),
  blossom: sakuraBlossom(),
  ovate: cherryLeaf(),
  scale: juniperSpray(),
  lobed: oakLeaf(),
  pinnate: wisteriaLeaf(),
  bipinnate: flameFrond(),
};

// ─── Flower silhouettes ───────────────────────────────────────────────────────
// Same unit space as the leaves. Hanging shapes (samara, raceme, catkin)
// grow from their stalk at the origin toward +y, so `ry` sets their length.
// Each has a main silhouette in the flower colour and, where the real flower
// has one, an accent drawn over it in the accent colour.

interface FlowerTemplate {
  main: LeafTemplate;
  accent?: LeafTemplate;
}

/** A small star of `points` spikes, radius `r` — stamens, a flower's eye. */
function star(points: number, r: number, inner: number): Pt[] {
  return Array.from({ length: points * 2 }, (_, i) =>
    polar([0, 0], (i * 180) / points, i % 2 ? r * inner : r),
  );
}

/** Flowering cherry — a sakura blossom with a rosy eye of stamens. */
function sakuraFlower(): FlowerTemplate {
  return {
    main: template([sakuraOutline()]),
    accent: template([star(5, 0.3, 0.45)]),
  };
}

/**
 * Flame tree (Delonix regia) — five spoon-shaped, clawed petals, the upper
 * standard petal larger and streaked pale gold.
 */
function poincianaFlower(): FlowerTemplate {
  const petal = (len: number): Pt[] => [
    [0.04, 0],
    [0.07, -0.3 * len],
    [0.3 * len, -0.5 * len],
    [0.34 * len, -0.78 * len],
    [0.18 * len, -0.97 * len],
    [0, -len],
    [-0.18 * len, -0.97 * len],
    [-0.34 * len, -0.78 * len],
    [-0.3 * len, -0.5 * len],
    [-0.07, -0.3 * len],
    [-0.04, 0],
  ];
  return {
    main: template(
      [72, 144, 216, 288].map((deg) =>
        rotateRing(petal(0.95), (deg * Math.PI) / 180),
      ),
    ),
    accent: template([petal(1.05)]),
  };
}

/**
 * Japanese maple — a pair of red-winged samaras joined at the stalk,
 * wings spread in a wide V, a plump seed at the base of each.
 */
function mapleSamara(): FlowerTemplate {
  const wing: Pt[] = [
    [-0.08, 0.02],
    [0.1, 0.08],
    [0.32, 0.5],
    [0.36, 0.86],
    [0.24, 1],
    [0.1, 0.9],
    [0.02, 0.5],
  ];
  const seed: Pt[] = [
    [0, -0.02],
    [0.13, 0.08],
    [0.13, 0.26],
    [0, 0.32],
    [-0.1, 0.2],
  ];
  const side = (sign: number) => (ring: Pt[]) =>
    rotateRing(
      ring.map(([x, y]) => [x * sign, y] as Pt),
      sign * 0.75,
    );
  return {
    main: template([side(1)(wing), side(-1)(wing)]),
    accent: template([side(1)(seed), side(-1)(seed)]),
  };
}

/**
 * Wisteria — a hanging raceme: broad at the stalk and tapering to a point,
 * its edge broken into the rounded pea-flowers, with the paler just-opened
 * flowers crowding the top.
 */
function wisteriaRaceme(): FlowerTemplate {
  const bumps = 8;
  const right: Pt[] = [];
  for (let i = 0; i <= bumps * 2; i++) {
    const t = i / (bumps * 2);
    const w = 0.9 * (1 - t) ** 0.8 * (i % 2 ? 1 : 0.72);
    right.push([w, 0.04 + t * 0.96]);
  }
  const left = [...right].reverse().map(([x, y]) => [-x, y] as Pt);
  const floret = (x: number, y: number, r: number): Pt[] =>
    Array.from(
      { length: 6 },
      (_, i) => polar([x, y], i * 60, i % 2 ? r * 0.75 : r) as Pt,
    );
  return {
    main: template([[[0, 0], ...right, ...left.slice(1)]]),
    accent: template([
      floret(-0.35, 0.12, 0.14),
      floret(0.3, 0.16, 0.14),
      floret(-0.1, 0.28, 0.13),
      floret(0.36, 0.34, 0.12),
      floret(-0.38, 0.4, 0.11),
      floret(0.08, 0.48, 0.11),
    ]),
  };
}

/** Oak — a pendulous catkin: a thread strung with small flower beads. */
function oakCatkin(): FlowerTemplate {
  const beads = 7;
  const right: Pt[] = [[0.08, 0]];
  for (let i = 0; i < beads; i++) {
    const y = 0.12 + (i / beads) * 0.86;
    right.push([0.55 - i * 0.03, y + 0.05], [0.12, y + 0.11]);
  }
  const left = [...right].reverse().map(([x, y]) => [-x, y] as Pt);
  return { main: template([[...right, ...left]]) };
}

/** Juniper — a round berry-like cone with a pale, waxy bloom. */
function juniperCone(): FlowerTemplate {
  return {
    main: template([
      Array.from({ length: 10 }, (_, i) => polar([0, 0], i * 36, 1)),
    ]),
    accent: template([
      [
        polar([0, 0], -80, 0.72),
        polar([0, 0], -50, 0.8),
        polar([0, 0], -20, 0.7),
        polar([-0.15, -0.15], -35, 0.35),
      ],
    ]),
  };
}

export const FLOWER_TEMPLATES: Record<FlowerShape, FlowerTemplate> = {
  blossom: sakuraFlower(),
  corymb: poincianaFlower(),
  samara: mapleSamara(),
  raceme: wisteriaRaceme(),
  catkin: oakCatkin(),
  berry: juniperCone(),
};

// ─── Path assembly ────────────────────────────────────────────────────────────

/** Tenths of a unit as the shortest SVG number: 3 → ".3", -12 → "-1.2". */
function tenths(v: number): string {
  const str = String(v / 10);
  if (str.startsWith("0.")) return str.slice(1);
  if (str.startsWith("-0.")) return `-${str.slice(2)}`;
  return str;
}

/**
 * Appends one ring as an absolute moveto and relative linetos. Coordinates
 * are snapped to tenths of a viewBox unit first and the deltas taken between
 * snapped points, so the short relative form carries no drift.
 */
function appendRing(
  out: string[],
  ring: Pt[],
  leaf: Pick<Leaf, "cx" | "cy" | "rx" | "ry">,
  cos: number,
  sin: number,
) {
  let px = 0;
  let py = 0;
  for (let i = 0; i < ring.length; i++) {
    const x = ring[i][0] * leaf.rx;
    const y = ring[i][1] * leaf.ry;
    const ax = Math.round((leaf.cx + x * cos - y * sin) * 10);
    const ay = Math.round((leaf.cy + x * sin + y * cos) * 10);
    if (i === 0) out.push(`M${tenths(ax)} ${tenths(ay)}l`);
    else out.push(`${tenths(ax - px)} ${tenths(ay - py)} `);
    px = ax;
    py = ay;
  }
  out.push("z");
}

/** Path data drawing every leaf in `leaves` as `shape`'s silhouette. */
export function leavesPathData(leaves: Leaf[], shape: LeafShape): string {
  return silhouettesPathData(leaves, LEAF_TEMPLATES[shape]);
}

/** Path data drawing `tpl` once at every placement in `items`. */
export function silhouettesPathData(
  items: Pick<Leaf, "cx" | "cy" | "rx" | "ry" | "angleDeg">[],
  tpl: LeafTemplate,
): string {
  const out: string[] = [];
  for (const leaf of items) {
    const rad = (leaf.angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    for (const ring of tpl.solids) appendRing(out, ring, leaf, cos, sin);
    for (const ring of tpl.holes) appendRing(out, ring, leaf, cos, sin);
  }
  return out.join("");
}
