import { HABITAT_Y_RANGE, SPECIES } from "@/lib/glade/catalog";
import type { SpeciesId } from "@/lib/glade/schema";

/**
 * How a resident gets about the glade: how fast it travels, how far it goes
 * in one outing, and how long it lingers between outings. Tuned to the
 * creature — a mouse darts short and often, a deer ambles far and seldom, the
 * owl barely leaves its branch.
 */
export interface WanderTraits {
  /** Travel speed, in scene pixels per second. */
  speed: number;
  /** Longest single outing, in scene pixels. */
  stride: number;
  /** Seconds spent idling between outings, as [shortest, longest]. */
  rest: [number, number];
}

export const WANDER_TRAITS: Record<SpeciesId, WanderTraits> = {
  robin: { speed: 70, stride: 260, rest: [2, 6] },
  rabbit: { speed: 60, stride: 280, rest: [3, 8] },
  squirrel: { speed: 95, stride: 240, rest: [2, 7] },
  hedgehog: { speed: 22, stride: 160, rest: [4, 9] },
  mouse: { speed: 110, stride: 180, rest: [1.5, 5] },
  wren: { speed: 80, stride: 220, rest: [1.5, 5] },
  mole: { speed: 16, stride: 120, rest: [6, 12] },
  fox: { speed: 45, stride: 420, rest: [4, 10] },
  deer: { speed: 30, stride: 380, rest: [6, 12] },
  owl: { speed: 55, stride: 200, rest: [14, 26] },
  badger: { speed: 24, stride: 220, rest: [5, 11] },
  mosskit: { speed: 26, stride: 240, rest: [5, 10] },
  otter: { speed: 55, stride: 340, rest: [3, 8] },
  hare: { speed: 120, stride: 360, rest: [3, 9] },
  thistledown: { speed: 18, stride: 300, rest: [2, 6] },
  glimmerwing: { speed: 60, stride: 320, rest: [2, 5] },
  puffloaf: { speed: 14, stride: 140, rest: [8, 16] },
  dewsprite: { speed: 34, stride: 260, rest: [2, 7] },
  emberveil: { speed: 75, stride: 340, rest: [1.5, 4] },
  thornwhisper: { speed: 12, stride: 160, rest: [9, 18] },
  mirewing: { speed: 50, stride: 300, rest: [2, 6] },
  fernmother: { speed: 10, stride: 140, rest: [10, 20] },
};

/** Where a resident is and what it is doing, in scene percentages. */
export interface Walker {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  /** Seconds of idling left; while above zero the resident stays put. */
  restLeft: number;
  /** 1 when heading right, -1 when heading left. */
  facing: 1 | -1;
}

export interface SceneSize {
  width: number;
  height: number;
}

/**
 * Residents keep this far (in percent) from the scene's left and right ends,
 * so a creature and its name tag never slide out past the edge of the world.
 */
const EDGE_MARGIN = 4;

function between([min, max]: [number, number], rng: () => number) {
  return min + rng() * (max - min);
}

/**
 * A resident standing at home, part-way through a rest. The rest starts at a
 * random point so a freshly loaded glade doesn't set off all at once.
 */
export function createWalker(
  speciesId: SpeciesId,
  home: { x: number; y: number },
  rng: () => number,
): Walker {
  return {
    x: home.x,
    y: home.y,
    targetX: home.x,
    targetY: home.y,
    restLeft: rng() * WANDER_TRAITS[speciesId].rest[1],
    facing: 1,
  };
}

/**
 * Picks the next spot to head for: somewhere within a stride of where the
 * resident stands, kept inside the scene and inside its habitat's band, so
 * birds stay up in the trees and ground creatures stay on the meadow.
 */
function pickTarget(
  walker: Walker,
  speciesId: SpeciesId,
  size: SceneSize,
  rng: () => number,
): Walker {
  const { stride } = WANDER_TRAITS[speciesId];
  const band = HABITAT_Y_RANGE[SPECIES[speciesId].habitat];
  const angle = rng() * Math.PI * 2;
  // At least a third of a stride, so an outing always reads as going somewhere.
  const distance = stride * (1 / 3 + (rng() * 2) / 3);
  const dx = (Math.cos(angle) * distance * 100) / size.width;
  const dy = (Math.sin(angle) * distance * 100) / size.height;
  const targetX = bounce(walker.x, dx, EDGE_MARGIN, 100 - EDGE_MARGIN);
  const targetY = bounce(walker.y, dy, band.min, band.max);
  return {
    ...walker,
    targetX,
    targetY,
    facing: targetX > walker.x ? 1 : targetX < walker.x ? -1 : walker.facing,
  };
}

/**
 * `from + delta`, turned back the other way if that would leave [min, max].
 * Clamping alone would stop every outing that runs long dead on the boundary,
 * and residents would line up along the edges of their band.
 */
function bounce(from: number, delta: number, min: number, max: number) {
  const ahead = from + delta;
  const target = ahead < min || ahead > max ? from - delta : ahead;
  return Math.min(max, Math.max(min, target));
}

/**
 * Advances a resident by `dt` seconds: idling counts down its rest, then it
 * picks a spot and walks there at its own speed, and on arrival settles into
 * a fresh rest. Speed is measured in pixels, so a creature covers ground at
 * the same pace whether the scene is wide or narrow.
 */
export function stepWalker(
  walker: Walker,
  speciesId: SpeciesId,
  dt: number,
  size: SceneSize,
  rng: () => number,
): Walker {
  if (walker.restLeft > 0) {
    const restLeft = walker.restLeft - dt;
    if (restLeft > 0) return { ...walker, restLeft };
    return pickTarget({ ...walker, restLeft: 0 }, speciesId, size, rng);
  }

  const dxPx = ((walker.targetX - walker.x) / 100) * size.width;
  const dyPx = ((walker.targetY - walker.y) / 100) * size.height;
  const remaining = Math.hypot(dxPx, dyPx);
  const travel = WANDER_TRAITS[speciesId].speed * dt;

  if (travel >= remaining) {
    return {
      ...walker,
      x: walker.targetX,
      y: walker.targetY,
      restLeft: between(WANDER_TRAITS[speciesId].rest, rng),
    };
  }

  const share = travel / remaining;
  return {
    ...walker,
    x: walker.x + (walker.targetX - walker.x) * share,
    y: walker.y + (walker.targetY - walker.y) * share,
  };
}

/** Whether the resident is mid-outing rather than idling. */
export function isWalking(walker: Walker): boolean {
  return walker.restLeft <= 0;
}
