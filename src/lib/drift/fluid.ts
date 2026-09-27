/**
 * A small, CPU-side "stable fluids" solver (after Jos Stam) for Drift.
 *
 * The grid is deliberately coarse (roughly 100–150 cells on its long side);
 * the canvas upscales it with smoothing, which is what gives the dye its soft,
 * watercolour edges. Keeping it on the CPU means it runs anywhere, costs a
 * phone very little, and can be unit tested without a GPU.
 *
 * Velocities are in cells per second. Dye is stored premultiplied as four
 * channels per cell: red, green and blue (each 0–1, times amount) and amount.
 */

export type Rgb = readonly [number, number, number];

export type Fluid = {
  readonly width: number;
  readonly height: number;
  u: Float32Array;
  v: Float32Array;
  dye: Float32Array;
  /** Scratch buffers, swapped with the live ones after each advection. */
  u0: Float32Array;
  v0: Float32Array;
  dye0: Float32Array;
  pressure: Float32Array;
  divergence: Float32Array;
  curl: Float32Array;
};

export type StepOptions = {
  /** Seconds of simulated time to advance. */
  dt: number;
  /** Fraction of velocity kept per second (0–1). Lower feels thicker. */
  velocityKeep: number;
  /** Fraction of dye kept per second (0–1). Higher leaves longer trails. */
  dyeKeep: number;
  /** Vorticity confinement strength; 0 turns curls off. */
  swirl: number;
};

const PRESSURE_ITERATIONS = 20;
/** How quickly opacity builds with dye amount; higher is inkier. */
const INK_DENSITY = 2.5;

export function createFluid(width: number, height: number): Fluid {
  const cells = width * height;
  return {
    width,
    height,
    u: new Float32Array(cells),
    v: new Float32Array(cells),
    dye: new Float32Array(cells * 4),
    u0: new Float32Array(cells),
    v0: new Float32Array(cells),
    dye0: new Float32Array(cells * 4),
    pressure: new Float32Array(cells),
    divergence: new Float32Array(cells),
    curl: new Float32Array(cells),
  };
}

/**
 * Picks a grid size for a canvas: `longSide` cells along its longer edge and
 * the other edge in proportion, never fewer than 8 cells either way.
 */
export function gridSize(
  canvasWidth: number,
  canvasHeight: number,
  longSide: number,
): { width: number; height: number } {
  const scale = longSide / Math.max(canvasWidth, canvasHeight, 1);
  return {
    width: Math.max(8, Math.round(canvasWidth * scale)),
    height: Math.max(8, Math.round(canvasHeight * scale)),
  };
}

export function clearFluid(fluid: Fluid): void {
  fluid.u.fill(0);
  fluid.v.fill(0);
  fluid.dye.fill(0);
  fluid.pressure.fill(0);
}

export type Splat = {
  /** Centre, as a fraction (0–1) of the grid's width and height. */
  x: number;
  y: number;
  /** Push, in cells per second. */
  dx: number;
  dy: number;
  color: Rgb;
  /** Radius as a fraction of the grid's longer side. */
  radius: number;
  /** How much dye to drop at the centre. */
  amount: number;
};

/** Pushes the fluid and drops dye in a soft gaussian blob. */
export function splat(fluid: Fluid, s: Splat): void {
  const { width, height, u, v, dye } = fluid;
  const cx = s.x * width;
  const cy = s.y * height;
  const r = Math.max(0.5, s.radius * Math.max(width, height));
  const reach = Math.ceil(r * 3);
  const r2 = r * r;
  const i0 = Math.max(0, Math.floor(cx - reach));
  const i1 = Math.min(width - 1, Math.ceil(cx + reach));
  const j0 = Math.max(0, Math.floor(cy - reach));
  const j1 = Math.min(height - 1, Math.ceil(cy + reach));
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      const ox = i + 0.5 - cx;
      const oy = j + 0.5 - cy;
      const w = Math.exp(-(ox * ox + oy * oy) / r2);
      const k = i + j * width;
      u[k] += s.dx * w;
      v[k] += s.dy * w;
      const a = s.amount * w;
      dye[k * 4] += s.color[0] * a;
      dye[k * 4 + 1] += s.color[1] * a;
      dye[k * 4 + 2] += s.color[2] * a;
      dye[k * 4 + 3] += a;
    }
  }
}

/** Advances the fluid by one time step. */
export function step(fluid: Fluid, options: StepOptions): void {
  const { dt } = options;
  if (dt <= 0) return;
  if (options.swirl > 0) confineVorticity(fluid, options.swirl * dt);
  setVelocityBounds(fluid);
  project(fluid);

  advect(fluid, fluid.u, fluid.u0, 1, dt);
  advect(fluid, fluid.v, fluid.v0, 1, dt);
  advect(fluid, fluid.dye, fluid.dye0, 4, dt);
  [fluid.u, fluid.u0] = [fluid.u0, fluid.u];
  [fluid.v, fluid.v0] = [fluid.v0, fluid.v];
  [fluid.dye, fluid.dye0] = [fluid.dye0, fluid.dye];

  scale(fluid.u, options.velocityKeep ** dt);
  scale(fluid.v, options.velocityKeep ** dt);
  scale(fluid.dye, options.dyeKeep ** dt);
  setVelocityBounds(fluid);
}

/**
 * Writes the dye into RGBA pixels (one per cell, `width * height * 4` bytes)
 * as straight, un-premultiplied colour, so the page background shows through
 * wherever the water is clear.
 *
 * Mixing averages colours, so red and green meet as a dull olive. `vivid`
 * lifts each pixel back to full brightness, so they meet as yellow instead.
 */
export function paint(
  fluid: Fluid,
  pixels: Uint8ClampedArray,
  vivid = false,
): void {
  const { dye } = fluid;
  const cells = fluid.width * fluid.height;
  for (let k = 0; k < cells; k++) {
    const p = k * 4;
    const amount = dye[p + 3];
    if (amount <= 1e-4) {
      pixels[p + 3] = 0;
      continue;
    }
    const brightest = Math.max(dye[p], dye[p + 1], dye[p + 2], 1e-6);
    const scale = (vivid ? 1 / brightest : 1 / amount) * 255;
    pixels[p] = dye[p] * scale;
    pixels[p + 1] = dye[p + 1] * scale;
    pixels[p + 2] = dye[p + 2] * scale;
    // Opacity eases towards full, so thin wisps stay soft and pools go deep.
    pixels[p + 3] = (1 - Math.exp(-amount * INK_DENSITY)) * 255;
  }
}

/** Total dye amount in the grid; handy for tests and "is it empty?" checks. */
export function totalDye(fluid: Fluid): number {
  let sum = 0;
  for (let k = 3; k < fluid.dye.length; k += 4) sum += fluid.dye[k];
  return sum;
}

// ─── Internals ────────────────────────────────────────────────────────────────

function scale(field: Float32Array, factor: number): void {
  if (factor === 1) return;
  for (let k = 0; k < field.length; k++) field[k] *= factor;
}

/**
 * Semi-Lagrangian advection: each cell looks back along the velocity to
 * where its contents came from and samples there.
 */
function advect(
  fluid: Fluid,
  src: Float32Array,
  dst: Float32Array,
  stride: number,
  dt: number,
): void {
  const { width, height, u, v } = fluid;
  const maxX = width - 1;
  const maxY = height - 1;
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const k = i + j * width;
      const x = clamp(i - dt * u[k], 0, maxX);
      const y = clamp(j - dt * v[k], 0, maxY);
      const x0 = Math.floor(x);
      const y0 = Math.floor(y);
      const x1 = Math.min(x0 + 1, maxX);
      const y1 = Math.min(y0 + 1, maxY);
      const tx = x - x0;
      const ty = y - y0;
      const a = (x0 + y0 * width) * stride;
      const b = (x1 + y0 * width) * stride;
      const c = (x0 + y1 * width) * stride;
      const d = (x1 + y1 * width) * stride;
      for (let ch = 0; ch < stride; ch++) {
        const top = src[a + ch] + (src[b + ch] - src[a + ch]) * tx;
        const bottom = src[c + ch] + (src[d + ch] - src[c + ch]) * tx;
        dst[k * stride + ch] = top + (bottom - top) * ty;
      }
    }
  }
}

/** Makes the velocity field divergence-free, so the fluid swirls, not bunches. */
function project(fluid: Fluid): void {
  const { width, height, u, v, pressure, divergence } = fluid;
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const k = i + j * width;
      divergence[k] =
        0.5 *
        (u[right(i, j, width)] -
          u[left(i, j, width)] +
          v[below(i, j, width, height)] -
          v[above(i, j, width)]);
      // Warm start from last frame's pressure, damped a little.
      pressure[k] *= 0.8;
    }
  }
  for (let n = 0; n < PRESSURE_ITERATIONS; n++) {
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const k = i + j * width;
        pressure[k] =
          (pressure[left(i, j, width)] +
            pressure[right(i, j, width)] +
            pressure[above(i, j, width)] +
            pressure[below(i, j, width, height)] -
            divergence[k]) *
          0.25;
      }
    }
  }
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const k = i + j * width;
      u[k] -=
        0.5 * (pressure[right(i, j, width)] - pressure[left(i, j, width)]);
      v[k] -=
        0.5 *
        (pressure[below(i, j, width, height)] - pressure[above(i, j, width)]);
    }
  }
}

/** Nudges existing eddies to keep spinning, which reads as curling smoke. */
function confineVorticity(fluid: Fluid, strength: number): void {
  const { width, height, u, v, curl } = fluid;
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      curl[i + j * width] =
        0.5 *
        (v[right(i, j, width)] -
          v[left(i, j, width)] -
          (u[below(i, j, width, height)] - u[above(i, j, width)]));
    }
  }
  for (let j = 1; j < height - 1; j++) {
    for (let i = 1; i < width - 1; i++) {
      const k = i + j * width;
      const nx = 0.5 * (Math.abs(curl[k + 1]) - Math.abs(curl[k - 1]));
      const ny = 0.5 * (Math.abs(curl[k + width]) - Math.abs(curl[k - width]));
      const length = Math.hypot(nx, ny) + 1e-5;
      u[k] += strength * (ny / length) * curl[k];
      v[k] -= strength * (nx / length) * curl[k];
    }
  }
}

/** Closed box: nothing flows through the walls. */
function setVelocityBounds(fluid: Fluid): void {
  const { width, height, u, v } = fluid;
  for (let j = 0; j < height; j++) {
    u[j * width] = 0;
    u[j * width + width - 1] = 0;
  }
  for (let i = 0; i < width; i++) {
    v[i] = 0;
    v[i + (height - 1) * width] = 0;
  }
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

// Neighbour indices, clamped at the walls (which makes pressure Neumann).
function left(i: number, j: number, width: number): number {
  return (i > 0 ? i - 1 : i) + j * width;
}
function right(i: number, j: number, width: number): number {
  return (i < width - 1 ? i + 1 : i) + j * width;
}
function above(i: number, j: number, width: number): number {
  return i + (j > 0 ? j - 1 : j) * width;
}
function below(i: number, j: number, width: number, height: number): number {
  return i + (j < height - 1 ? j + 1 : j) * width;
}
