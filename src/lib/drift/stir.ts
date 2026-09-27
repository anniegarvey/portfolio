import { type Fluid, type Rgb, splat } from "./fluid";

/** Seconds each palette colour holds before blending into the next. */
export const COLOR_PERIOD = 2.5;

/**
 * The dye colour at a moment in time: the palette's colours in turn, each
 * blending smoothly into the next, so a long stroke changes hue as it goes.
 */
export function colorAt(
  colors: readonly Rgb[],
  seconds: number,
  period = COLOR_PERIOD,
): Rgb {
  const position = (seconds / period) % colors.length;
  const index = Math.floor(position);
  const from = colors[index];
  const to = colors[(index + 1) % colors.length];
  // Ease so each colour lingers before it turns.
  const t = smoothstep(position - index);
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ];
}

export type PointerStir = {
  /** Where the pointer is and was, as fractions (0–1) of the canvas. */
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  /** Seconds since the last pointer move. */
  dt: number;
};

/** Grid cells per second a full-canvas-per-second sweep of the pointer maps to. */
const POINTER_FORCE = 0.6;
/** Cap on the push from one move, so a flick doesn't blow the water apart. */
const MAX_PUSH = 400;

/** Drops dye and pushes the water along a pointer's movement. */
export function stirWithPointer(
  fluid: Fluid,
  stir: PointerStir,
  color: Rgb,
  radius: number,
): void {
  const dt = Math.max(stir.dt, 1 / 240);
  const size = Math.max(fluid.width, fluid.height);
  const dx = clampMagnitude(
    ((stir.x - stir.previousX) / dt) * fluid.width * POINTER_FORCE,
  );
  const dy = clampMagnitude(
    ((stir.y - stir.previousY) / dt) * fluid.height * POINTER_FORCE,
  );
  // Fill the gap between samples so fast strokes stay continuous.
  const distance = Math.hypot(
    (stir.x - stir.previousX) * fluid.width,
    (stir.y - stir.previousY) * fluid.height,
  );
  const steps = Math.min(
    24,
    Math.max(1, Math.ceil(distance / (radius * size))),
  );
  for (let n = 1; n <= steps; n++) {
    const t = n / steps;
    splat(fluid, {
      x: stir.previousX + (stir.x - stir.previousX) * t,
      y: stir.previousY + (stir.y - stir.previousY) * t,
      dx: dx / steps,
      dy: dy / steps,
      color,
      radius,
      amount: 0.8 / steps,
    });
  }
}

/**
 * A gentle, keyboard-friendly stir: a soft bloom of colour with a little
 * spin, somewhere away from the edges. `random` returns 0–1.
 */
export function bloom(
  fluid: Fluid,
  color: Rgb,
  radius: number,
  random: () => number = Math.random,
): void {
  const x = 0.2 + random() * 0.6;
  const y = 0.2 + random() * 0.6;
  const angle = random() * Math.PI * 2;
  const push = 30 + random() * 30;
  splat(fluid, {
    x,
    y,
    dx: Math.cos(angle) * push,
    dy: Math.sin(angle) * push,
    color,
    radius: radius * 1.6,
    amount: 1.2,
  });
}

/**
 * Two slow, invisible currents that trace lazy loops across the water and
 * leave a faint wake, so it keeps moving when no one is stirring.
 */
export function drift(
  fluid: Fluid,
  seconds: number,
  dt: number,
  colors: readonly Rgb[],
  radius: number,
  period = COLOR_PERIOD,
): void {
  for (let n = 0; n < 2; n++) {
    const phase = n * Math.PI;
    const t = seconds * 0.11 + phase;
    const x = 0.5 + 0.32 * Math.sin(t * 1.3);
    const y = 0.5 + 0.28 * Math.sin(t * 0.9 + 1);
    // Direction of travel along the loop.
    const vx = 0.32 * 1.3 * Math.cos(t * 1.3);
    const vy = 0.28 * 0.9 * Math.cos(t * 0.9 + 1);
    splat(fluid, {
      x,
      y,
      dx: vx * fluid.width * 1.5,
      dy: vy * fluid.height * 1.5,
      color: colorAt(colors, seconds + n * 3.7, period),
      radius: radius * 1.3,
      amount: 0.9 * dt,
    });
  }
}

function clampMagnitude(value: number): number {
  return Math.max(-MAX_PUSH, Math.min(MAX_PUSH, value));
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}
