import {
  type TerrainId,
  TILE_SIZE,
  terrainAt,
  VALE_HEIGHT,
  VALE_WIDTH,
} from "@/lib/meadowmere/valeMap";

/**
 * The ground the Vale is drawn on. Nothing here depends on game state, so the
 * whole layer is a pure function of the map and renders once.
 *
 * Colours come from CSS custom properties set by the world wrapper, so the
 * valley shifts to a dusk palette in dark mode without a second set of shapes.
 */

/**
 * Stable per-tile variation: the same tile always gets the same tufts, so
 * visual snapshots don't shimmer between runs.
 */
function tileVariant(x: number, y: number, buckets: number): number {
  return (x * 31 + y * 17) % buckets;
}

function GrassTile({ x, y }: { x: number; y: number }) {
  const variant = tileVariant(x, y, 4);
  return (
    <>
      <rect fill="var(--vale-grass)" height={TILE_SIZE} width={TILE_SIZE} />
      {variant === 0 && (
        <path
          d="M8 24 L9 19 M12 26 L13 21 M16 23 L17 18"
          stroke="var(--vale-grass-alt)"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      )}
      {variant === 1 && (
        <path
          d="M20 27 L21 22 M24 24 L25 20"
          stroke="var(--vale-grass-alt)"
          strokeLinecap="round"
          strokeWidth="1.6"
        />
      )}
      {variant === 2 && (
        <ellipse cx="22" cy="12" fill="var(--vale-grass-alt)" rx="4" ry="2.4" />
      )}
    </>
  );
}

function PathTile() {
  return (
    <>
      <rect fill="var(--vale-path)" height={TILE_SIZE} width={TILE_SIZE} />
      <circle cx="9" cy="11" fill="var(--vale-path-grit)" r="1.8" />
      <circle cx="21" cy="20" fill="var(--vale-path-grit)" r="2.2" />
      <circle cx="14" cy="26" fill="var(--vale-path-grit)" r="1.4" />
    </>
  );
}

function FlowerTile({ x, y }: { x: number; y: number }) {
  const warm = tileVariant(x, y, 2) === 0;
  const petal = warm ? "#f2a541" : "#c9a0e0";
  return (
    <>
      <GrassTile x={x} y={y} />
      {[
        [9, 12],
        [20, 9],
        [15, 22],
        [24, 21],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} fill={petal} r="2.4" />
          <circle cx={cx} cy={cy} fill="#fff6db" r="0.9" />
        </g>
      ))}
    </>
  );
}

function WaterTile({ x, y }: { x: number; y: number }) {
  const offset = tileVariant(x, y, 3) * 3;
  return (
    <>
      <rect fill="var(--vale-water)" height={TILE_SIZE} width={TILE_SIZE} />
      <path
        d={`M2 ${9 + offset} q5 -3 10 0 t10 0`}
        fill="none"
        stroke="var(--vale-water-glint)"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d={`M4 ${23 + offset / 2} q5 -3 10 0 t9 0`}
        fill="none"
        stroke="var(--vale-water-glint)"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </>
  );
}

function HedgeTile({ x, y }: { x: number; y: number }) {
  const variant = tileVariant(x, y, 3);
  return (
    <>
      <rect fill="var(--vale-grass)" height={TILE_SIZE} width={TILE_SIZE} />
      <ellipse cx="8" cy="20" fill="var(--vale-hedge)" rx="11" ry="12" />
      <ellipse cx="24" cy="19" fill="var(--vale-hedge)" rx="11" ry="13" />
      <ellipse
        cx="16"
        cy={variant === 0 ? 13 : 16}
        fill="var(--vale-hedge-lit)"
        rx="10"
        ry="10"
      />
      {variant === 2 && (
        <circle cx="21" cy="14" fill="#c0574d" opacity="0.85" r="1.8" />
      )}
    </>
  );
}

function RockTile({ x, y }: { x: number; y: number }) {
  return (
    <>
      <GrassTile x={x} y={y} />
      <path d="M5 27 L10 13 L19 12 L25 27 Z" fill="var(--vale-rock)" />
      <path d="M10 13 L19 12 L16 27 L11 27 Z" fill="var(--vale-rock-lit)" />
    </>
  );
}

/** The player's own cottage. Not a feature — there is nothing to do here. */
function FarmhouseTile({ x, y }: { x: number; y: number }) {
  return (
    <>
      <GrassTile x={x} y={y} />
      <g transform="translate(0, -14)">
        <rect
          fill="var(--vale-farmhouse-wall)"
          height="26"
          rx="1.5"
          width="30"
          x="1"
          y="18"
        />
        <path d="M-2 20 L16 4 L34 20 Z" fill="var(--vale-farmhouse-roof)" />
        <path d="M-2 20 L16 4 L16 20 Z" fill="var(--vale-farmhouse-roof-lit)" />
        <rect
          fill="var(--vale-door)"
          height="12"
          rx="1"
          width="8"
          x="12"
          y="32"
        />
        <circle cx="18.4" cy="38" fill="#e5c165" r="0.9" />
        <rect
          fill="var(--vale-window)"
          height="7"
          rx="1"
          width="7"
          x="3"
          y="22"
        />
        <rect
          fill="var(--vale-window)"
          height="7"
          rx="1"
          width="7"
          x="22"
          y="22"
        />
        <rect
          fill="var(--vale-chimney)"
          height="9"
          rx="1.2"
          width="6"
          x="23"
          y="0"
        />
      </g>
    </>
  );
}

const TILES: Record<
  TerrainId,
  (props: { x: number; y: number }) => React.JSX.Element
> = {
  grass: GrassTile,
  path: PathTile,
  flowers: FlowerTile,
  water: WaterTile,
  hedge: HedgeTile,
  rock: RockTile,
  farmhouse: FarmhouseTile,
};

export function TerrainLayer() {
  const tiles = [];
  for (let y = 0; y < VALE_HEIGHT; y++) {
    for (let x = 0; x < VALE_WIDTH; x++) {
      const Tile = TILES[terrainAt(x, y)];
      tiles.push(
        <g
          key={`${x}-${y}`}
          transform={`translate(${x * TILE_SIZE} ${y * TILE_SIZE})`}
        >
          <Tile x={x} y={y} />
        </g>,
      );
    }
  }
  return <g aria-hidden>{tiles}</g>;
}
