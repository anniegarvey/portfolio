/** A point dropped somewhere in a box, with two spare dice for its looks. */
export interface Scattered {
  x: number;
  y: number;
  /** Uniform in [0, 1): pick an angle, a colour, a size with these. */
  u: number;
  v: number;
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/**
 * Scatters `count` points over a box so they look strewn rather than laid out.
 *
 * The box is cut into a grid of cells and each point lands anywhere in its own
 * cell: that keeps them from clumping, which pure chance does, and from
 * falling into rows and diagonals, which stepping by a fixed amount does. The
 * dice are seeded, so every render (server and client alike) agrees.
 */
export function scatter(count: number, box: Box, seed: number): Scattered[] {
  const random = mulberry32(seed);
  const width = box.x1 - box.x0;
  const height = box.y1 - box.y0;
  const cols = Math.max(1, Math.round(Math.sqrt((count * width) / height)));
  const rows = Math.ceil(count / cols);
  const cellW = width / cols;
  const cellH = height / rows;
  // Visit the cells in a shuffled order, so a count that doesn't fill the
  // grid leaves its gaps here and there instead of along the last row.
  const cells = Array.from({ length: cols * rows }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, count).map((cell) => ({
    x: box.x0 + ((cell % cols) + random()) * cellW,
    y: box.y0 + (Math.floor(cell / cols) + random()) * cellH,
    u: random(),
    v: random(),
  }));
}

/** A small, well-mixed seeded generator of numbers in [0, 1). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
