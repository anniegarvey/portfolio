import type { MeadowmereState } from "./schema";
import { type Feature, isWalkable, type Tile } from "./valeMap";

/** The four directions the farmer can face and walk. */
export type Facing = "up" | "down" | "left" | "right";

export const FACING_DELTAS: Record<Facing, Tile> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** Where the farmer stands and which way they look. */
export interface FarmerPose extends Tile {
  facing: Facing;
}

/** The tile the farmer is looking at — where every interaction happens. */
export function tileInFront(pose: FarmerPose): Tile {
  const delta = FACING_DELTAS[pose.facing];
  return { x: pose.x + delta.x, y: pose.y + delta.y };
}

/**
 * One press of a direction. As in Stardew, a direction both turns and moves:
 * the farmer always ends up facing that way, and steps only if the tile ahead
 * is free. Walking into a plot therefore turns to face it, ready to be worked.
 */
export function stepFarmer(
  state: MeadowmereState,
  pose: FarmerPose,
  facing: Facing,
): FarmerPose {
  const turned: FarmerPose = { ...pose, facing };
  const ahead = tileInFront(turned);
  return isWalkable(state, ahead.x, ahead.y) ? { ...ahead, facing } : turned;
}

export function samePosition(a: Tile, b: Tile): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Which way you'd look to see `to` from the adjacent tile `from`. */
export function facingTowards(from: Tile, to: Tile): Facing {
  if (to.y < from.y) return "up";
  if (to.y > from.y) return "down";
  return to.x < from.x ? "left" : "right";
}

// ─── Pathfinding ──────────────────────────────────────────────────────────────

const tileKey = (t: Tile): string => `${t.x},${t.y}`;

function neighbours(tile: Tile): Tile[] {
  return Object.values(FACING_DELTAS).map((d) => ({
    x: tile.x + d.x,
    y: tile.y + d.y,
  }));
}

/** Walks the breadth-first tree back from `to` to the tile it started on. */
function retrace(
  cameFrom: Map<string, Tile | null>,
  from: Tile,
  to: Tile,
): Tile[] {
  const path: Tile[] = [];
  let step: Tile | undefined = to;
  while (step !== undefined && !samePosition(step, from)) {
    path.unshift(step);
    step = cameFrom.get(tileKey(step)) ?? undefined;
  }
  return path;
}

/**
 * Shortest walk from `from` to `to`, as the tiles to step through (excluding
 * the tile started on). Null when there's no way round. Breadth-first, which
 * is ample for a map this size and keeps the route deterministic.
 */
export function findPath(
  state: MeadowmereState,
  from: Tile,
  to: Tile,
): Tile[] | null {
  if (samePosition(from, to)) return [];
  if (!isWalkable(state, to.x, to.y)) return null;

  const cameFrom = new Map<string, Tile | null>([[tileKey(from), null]]);
  const queue: Tile[] = [from];

  while (queue.length > 0) {
    const current = queue.shift() as Tile;
    if (samePosition(current, to)) return retrace(cameFrom, from, current);

    for (const next of neighbours(current)) {
      if (cameFrom.has(tileKey(next))) continue;
      if (!isWalkable(state, next.x, next.y)) continue;
      cameFrom.set(tileKey(next), current);
      queue.push(next);
    }
  }
  return null;
}

/** A walk that ends with the farmer facing the thing they set out for. */
export interface Route {
  /** Tiles to step through. Empty when already standing in the right place. */
  path: Tile[];
  facing: Facing;
}

/**
 * How to get to a feature and face it: the shortest walk to any tile beside
 * it. Used when the player clicks or tabs to something rather than walking
 * there by hand. Null when nothing beside it can be reached.
 */
export function routeToFeature(
  state: MeadowmereState,
  pose: FarmerPose,
  feature: Feature,
): Route | null {
  let best: Route | null = null;
  for (const approach of neighbours(feature)) {
    const path = findPath(state, pose, approach);
    if (path === null) continue;
    if (best === null || path.length < best.path.length) {
      best = { path, facing: facingTowards(approach, feature) };
    }
  }
  return best;
}
