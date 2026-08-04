import { ALL_NEIGHBOUR_IDS, MAX_PLOTS } from "./catalog";
import type { MeadowmereState, NeighbourId, SiteId } from "./schema";

/**
 * The Vale: the single walkable map every Meadowmere loop happens on. A grid
 * of tiles, a terrain layer, and a set of features standing on it. Everything
 * here is derived from the two constants below plus game state — nothing about
 * the world is persisted.
 */

// ─── Terrain ──────────────────────────────────────────────────────────────────

export type TerrainId =
  | "grass"
  | "path"
  | "flowers"
  | "hedge"
  | "water"
  | "rock"
  | "farmhouse";

/** Grid characters, chosen so TERRAIN_ROWS reads as a picture of the map. */
const TERRAIN_BY_CHAR: Record<string, TerrainId> = {
  ".": "grass",
  ",": "path",
  "*": "flowers",
  T: "hedge",
  "~": "water",
  "#": "rock",
  H: "farmhouse",
};

/** Terrain the farmer can stand on. Everything else stops them. */
const WALKABLE_TERRAIN: ReadonlySet<TerrainId> = new Set<TerrainId>([
  "grass",
  "path",
  "flowers",
]);

/**
 * The map, one character per tile. The hedge boundary keeps the farmer in, the
 * river runs down the west side, and the lane at x=8 runs the height of the
 * valley with a spur to each cottage door and one west to the seed stall.
 */
const TERRAIN_ROWS = [
  "TTTTTTTTTTTTTTTT",
  "~.H.....,....#.T",
  "~.....,,,,,,...T",
  "~.......,......T",
  "~..*....,..*...T",
  "~.......,,,,...T",
  "~.......,......T",
  "~.*.....,....*.T",
  "~.......,,,,.*.T",
  "~.......,......T",
  "~.*.....,..*...T",
  "TTTTTTTTTTTTTTTT",
] as const;

export const VALE_WIDTH = TERRAIN_ROWS[0].length;
export const VALE_HEIGHT = TERRAIN_ROWS.length;

/** Side of one tile in SVG user units. The viewBox is sized from it. */
export const TILE_SIZE = 32;

export interface Tile {
  x: number;
  y: number;
}

export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < VALE_WIDTH && y >= 0 && y < VALE_HEIGHT;
}

export function terrainAt(x: number, y: number): TerrainId {
  if (!isInBounds(x, y)) return "hedge";
  return TERRAIN_BY_CHAR[TERRAIN_ROWS[y][x]];
}

// ─── Features ─────────────────────────────────────────────────────────────────

/**
 * A thing standing on a tile that the farmer can act on. Every feature blocks
 * movement, so the farmer always acts on the tile they are facing rather than
 * the one they stand on — one rule for plots, sites, cottages and the stall.
 */
export type Feature =
  | { kind: "plot"; x: number; y: number; index: number }
  | { kind: "site"; x: number; y: number; siteId: SiteId }
  | { kind: "cottage"; x: number; y: number; neighbourId: NeighbourId }
  | { kind: "stall"; x: number; y: number };

/**
 * Where each plot sits, in the order plots are stored. Four rows of three with
 * a walkway between them, so every bed is reachable and the farm grows a tidy
 * row at a time as quests hand over land (6 → 9 → 12).
 */
const PLOT_TILES: readonly Tile[] = [
  { x: 3, y: 3 },
  { x: 4, y: 3 },
  { x: 5, y: 3 },
  { x: 3, y: 5 },
  { x: 4, y: 5 },
  { x: 5, y: 5 },
  { x: 3, y: 7 },
  { x: 4, y: 7 },
  { x: 5, y: 7 },
  { x: 3, y: 9 },
  { x: 4, y: 9 },
  { x: 5, y: 9 },
];

/**
 * Sites stand one row inside the boundary rather than in it: each is drawn
 * taller than its tile, and on the edge row the top of the art would be clipped
 * away. For the same reason none of them sits directly above a cottage, whose
 * roof rises half a tile and would hide it.
 */
const SITE_TILES: Record<SiteId, Tile> = {
  hedgerow: { x: 5, y: 1 },
  stonewood: { x: 14, y: 1 },
  riverbank: { x: 0, y: 6 },
};

const COTTAGE_TILES: Record<NeighbourId, Tile> = {
  nessa: { x: 12, y: 2 },
  bram: { x: 12, y: 5 },
  marigold: { x: 12, y: 8 },
};

const STALL_TILE: Tile = { x: 6, y: 2 };

/** Where the farmer starts: on the grass just outside the farmhouse door. */
export const FARMER_START: Tile = { x: 2, y: 2 };

/**
 * Every feature currently standing in the Vale. Only plots the player actually
 * owns appear — the rest of PLOT_TILES is open ground until a quest hands it
 * over. Locked sites do appear, so the way on is always visible.
 */
export function valeFeatures(state: MeadowmereState): Feature[] {
  const plots: Feature[] = state.plots.map((_, index) => ({
    kind: "plot",
    index,
    ...PLOT_TILES[index],
  }));
  const sites: Feature[] = (Object.keys(SITE_TILES) as SiteId[]).map(
    (siteId) => ({ kind: "site", siteId, ...SITE_TILES[siteId] }),
  );
  const cottages: Feature[] = ALL_NEIGHBOUR_IDS.map((neighbourId) => ({
    kind: "cottage",
    neighbourId,
    ...COTTAGE_TILES[neighbourId],
  }));
  return [...plots, ...sites, ...cottages, { kind: "stall", ...STALL_TILE }];
}

export function featureAt(
  state: MeadowmereState,
  x: number,
  y: number,
): Feature | null {
  return valeFeatures(state).find((f) => f.x === x && f.y === y) ?? null;
}

/**
 * Tiles laid out for a plot the player doesn't own yet, drawn as rough ground
 * so the farm visibly has room to grow.
 */
export function fallowPlotTiles(state: MeadowmereState): Tile[] {
  return PLOT_TILES.slice(state.plots.length, MAX_PLOTS);
}

// ─── Walkability ──────────────────────────────────────────────────────────────

/** True when the farmer can stand here: walkable terrain with nothing on it. */
export function isWalkable(
  state: MeadowmereState,
  x: number,
  y: number,
): boolean {
  if (!isInBounds(x, y)) return false;
  if (!WALKABLE_TERRAIN.has(terrainAt(x, y))) return false;
  return featureAt(state, x, y) === null;
}
