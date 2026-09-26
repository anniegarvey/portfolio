import { ALL_NEIGHBOUR_IDS, type KeepsakeId, MAX_PLOTS } from "./catalog";
import { earnedKeepsakes } from "./questsModule";
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
  "~.*.....,,.*...T",
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
  | { kind: "stall"; x: number; y: number }
  | { kind: "cat"; x: number; y: number }
  | { kind: "keepsake"; x: number; y: number; keepsakeId: KeepsakeId };

/**
 * Where each plot sits, in the order plots are stored. Four rows of three with
 * a walkway between them, so every bed is reachable and the farm grows a tidy
 * row at a time as quests hand over land (6 → 9 → 12). The last four extend
 * each row by one bed towards the lane (12 → 14 → 16); they come last so a
 * save's existing plots keep the tiles they were planted on.
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
  { x: 6, y: 3 },
  { x: 6, y: 5 },
  { x: 6, y: 7 },
  { x: 6, y: 9 },
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
  orchard: { x: 10, y: 1 },
  fen: { x: 0, y: 10 },
};

const COTTAGE_TILES: Record<NeighbourId, Tile> = {
  nessa: { x: 12, y: 2 },
  bram: { x: 12, y: 5 },
  marigold: { x: 12, y: 8 },
  wren: { x: 10, y: 10 },
};

/**
 * Where each keepsake stands once it has been given. The farm's own things sit
 * on the west side around the beds; the ones that belong to the village sit
 * among the cottages. None of them is on the lane, the walkways between the
 * beds, or the tile above a cottage, so however many are standing the farmer can
 * still get round to everything.
 */
const KEEPSAKE_TILES: Record<KeepsakeId, Tile> = {
  scarecrow: { x: 2, y: 6 },
  well: { x: 1, y: 3 },
  bench: { x: 3, y: 1 },
  "herb-box": { x: 1, y: 8 },
  windmill: { x: 2, y: 10 },
  "picnic-table": { x: 13, y: 3 },
  "rose-arch": { x: 13, y: 6 },
  lanterns: { x: 9, y: 4 },
  birdbath: { x: 11, y: 4 },
  maypole: { x: 10, y: 7 },
  bunting: { x: 14, y: 5 },
  beehive: { x: 13, y: 9 },
  urns: { x: 13, y: 10 },
};

const STALL_TILE: Tile = { x: 6, y: 2 };

/**
 * Where the cat might settle. Every one of these is hedge or rock — ground the
 * farmer could never have stood on anyway — so a visitor that moves every
 * morning can never become a wall across the only way round to a plot. Cats sit
 * on walls; this one has the run of them.
 */
const CAT_PERCHES: readonly Tile[] = [
  { x: 7, y: 0 },
  { x: 11, y: 0 },
  { x: 13, y: 1 },
  { x: 15, y: 3 },
  { x: 15, y: 8 },
  { x: 3, y: 11 },
  { x: 12, y: 11 },
];

/**
 * Which perch the cat took when the day turned. Derived from the date the day
 * last advanced rather than from today, so it stays a pure function of state:
 * the scene re-derives every feature on every render and the cat has to land on
 * the same tile each time.
 */
function catPerch(dateStamp: string): Tile {
  let hash = 0;
  for (const char of dateStamp) {
    hash = (hash * 31 + char.charCodeAt(0)) % 65521;
  }
  return CAT_PERCHES[hash % CAT_PERCHES.length];
}

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
  // The cat needs a day to have turned before it has anywhere to be, which is
  // the first thing the provider does on mount.
  const cat: Feature[] =
    state.lastAdvanceDate === undefined
      ? []
      : [{ kind: "cat", ...catPerch(state.lastAdvanceDate) }];
  const keepsakes: Feature[] = earnedKeepsakes(state).map((keepsakeId) => ({
    kind: "keepsake",
    keepsakeId,
    ...KEEPSAKE_TILES[keepsakeId],
  }));
  return [
    ...plots,
    ...sites,
    ...cottages,
    ...keepsakes,
    ...cat,
    { kind: "stall", ...STALL_TILE },
  ];
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

// ─── Remarks ──────────────────────────────────────────────────────────────────

/**
 * What the valley says back when the farmer is sent somewhere they can't go.
 * Only the scenery is in here: plots, cottages and the rest carry their own
 * buttons and already speak for themselves.
 */
const TERRAIN_REMARKS: Partial<Record<TerrainId, string>> = {
  water: "The river runs quick, and colder than it looks. Best not.",
  hedge: "The hedge is older than the farm and twice as stubborn.",
  rock: "Somebody hauled these stones here. Not recently.",
  farmhouse: "Home. But the day is out here.",
};

/** A remark about this tile, or null when there is nothing to say about it. */
export function terrainRemark(x: number, y: number): string | null {
  return TERRAIN_REMARKS[terrainAt(x, y)] ?? null;
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
