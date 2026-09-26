import { keyframes, styled } from "next-yak";
import { ChimneySmoke } from "@/components/meadowmere/ValeArt/ChimneySmoke";
import type { GrowthStage, KeepsakeId } from "@/lib/meadowmere/catalog";
import type { CropId, NeighbourId, SiteId } from "@/lib/meadowmere/schema";

/**
 * The things standing on the Vale, drawn in tile-local coordinates on a 32×32
 * tile. Anything taller than a tile overflows upwards (negative y), so it rises
 * behind whatever is north of it without changing where it sits on the grid.
 */

const SOIL = "var(--vale-soil)";
const SOIL_DARK = "var(--vale-soil-dark)";
const LEAF = "var(--vale-leaf)";
const LEAF_DARK = "var(--vale-leaf-dark)";
const STEM = "var(--vale-stem)";
const CAT = "var(--vale-cat)";
const CAT_EYE = "var(--vale-cat-eye)";
const CAT_RIM = "var(--vale-cat-rim)";

/** Ripe colours per crop, so a full bed reads at a glance. */
const CROP_COLOURS: Record<CropId, { main: string; accent: string }> = {
  parsnip: { main: "#f0d9a8", accent: "#d8b877" },
  cornflower: { main: "#5d7fd6", accent: "#8fa8e8" },
  strawberry: { main: "#d64545", accent: "#f07777" },
  pumpkin: { main: "#e08b34", accent: "#f2a552" },
  moonpetal: { main: "#e6dcf5", accent: "#b9a5dd" },
  wheat: { main: "#e2b94e", accent: "#c99a2e" },
  sunflower: { main: "#f2c230", accent: "#6b4423" },
  honeymelon: { main: "#cfe08a", accent: "#a7bd5c" },
};

// ─── Plots ────────────────────────────────────────────────────────────────────

/** A tilled bed with nothing in it. Also the base every planting sits on. */
function SoilBed({ watered }: { watered: boolean }) {
  return (
    <>
      <rect
        fill={watered ? SOIL_DARK : SOIL}
        height="26"
        rx="3"
        width="28"
        x="2"
        y="4"
      />
      <path
        d="M5 11 h22 M5 17 h22 M5 23 h22"
        stroke={watered ? SOIL : SOIL_DARK}
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </>
  );
}

function RipeCrop({ cropId }: { cropId: CropId }) {
  const { main, accent } = CROP_COLOURS[cropId];
  switch (cropId) {
    case "parsnip":
      return (
        <>
          <path d="M13 20 L19 20 L16 30 Z" fill={main} />
          <path d="M14.4 22 L17.6 22" stroke={accent} strokeWidth="1" />
          <path
            d="M16 20 L10 12 M16 20 L16 10 M16 20 L22 12"
            stroke={LEAF}
            strokeLinecap="round"
            strokeWidth="2.6"
          />
        </>
      );
    case "cornflower":
      return (
        <>
          <path d="M16 30 L16 16" stroke={STEM} strokeWidth="2" />
          <ellipse cx="11" cy="22" fill={LEAF} rx="4" ry="1.8" />
          <ellipse cx="21" cy="24" fill={LEAF} rx="4" ry="1.8" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse
              cx="16"
              cy="10"
              fill={main}
              key={angle}
              rx="2.4"
              ry="5"
              transform={`rotate(${angle} 16 14)`}
            />
          ))}
          <circle cx="16" cy="14" fill={accent} r="2.6" />
        </>
      );
    case "strawberry":
      return (
        <>
          <ellipse cx="16" cy="20" fill={LEAF} rx="11" ry="8" />
          <ellipse cx="10" cy="24" fill={LEAF_DARK} rx="5" ry="4" />
          <ellipse cx="22" cy="23" fill={LEAF_DARK} rx="5" ry="4" />
          <path d="M11 20 q3 6 6 0 q-3 8 -6 0 Z" fill={main} />
          <path d="M18 22 q3 6 6 0 q-3 8 -6 0 Z" fill={accent} />
          <circle cx="16" cy="12" fill="#fff" r="2" />
        </>
      );
    case "pumpkin":
      return (
        <>
          <ellipse cx="16" cy="22" fill={main} rx="12" ry="9" />
          <path
            d="M11 14 q0 16 0 16 M16 13 q0 18 0 18 M21 14 q0 16 0 16"
            fill="none"
            stroke={accent}
            strokeWidth="1.4"
          />
          <rect fill={STEM} height="5" rx="1" width="3.4" x="14.3" y="9" />
          <path
            d="M6 18 q-4 -6 2 -8"
            fill="none"
            stroke={LEAF}
            strokeWidth="2"
          />
        </>
      );
    case "moonpetal":
      return (
        <>
          <circle cx="16" cy="15" fill={accent} opacity="0.4" r="12" />
          <path d="M16 30 L16 18" stroke={STEM} strokeWidth="2" />
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              cx="16"
              cy="9"
              fill={main}
              key={angle}
              rx="3"
              ry="6"
              transform={`rotate(${angle} 16 15)`}
            />
          ))}
          <circle cx="16" cy="15" fill="#fff4c2" r="3" />
        </>
      );
    case "wheat":
      return (
        <>
          <path
            d="M10 30 L11 14 M16 30 L16 11 M22 30 L21 14"
            stroke={STEM}
            strokeWidth="1.6"
          />
          {[11, 16, 21].map((x, i) => (
            <ellipse
              cx={x}
              cy={i === 1 ? 10 : 13}
              fill={i === 1 ? main : accent}
              key={x}
              rx="2.4"
              ry="5"
            />
          ))}
        </>
      );
    case "sunflower":
      return (
        <>
          <path d="M16 30 L16 14" stroke={STEM} strokeWidth="2.4" />
          <ellipse cx="11" cy="23" fill={LEAF} rx="5" ry="2.2" />
          <ellipse cx="21" cy="21" fill={LEAF} rx="5" ry="2.2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <ellipse
              cx="16"
              cy="5"
              fill={main}
              key={angle}
              rx="2.2"
              ry="4.2"
              transform={`rotate(${angle} 16 10)`}
            />
          ))}
          <circle cx="16" cy="10" fill={accent} r="3.6" />
        </>
      );
    case "honeymelon":
      return (
        <>
          <path
            d="M4 26 q6 -6 12 -2 q6 4 12 -2"
            fill="none"
            stroke={LEAF}
            strokeWidth="2"
          />
          <ellipse cx="16" cy="21" fill={main} rx="10" ry="8" />
          <path
            d="M9 18 q7 4 14 0 M8 22 q8 4 16 0"
            fill="none"
            stroke={accent}
            strokeWidth="1.2"
          />
          <ellipse cx="11" cy="23" fill={LEAF_DARK} rx="4" ry="2" />
        </>
      );
  }
}

export interface PlotArtProps {
  cropId: CropId | null;
  stage: GrowthStage | null;
  wateredToday: boolean;
  /**
   * Which bed this is, which is only used to put the ripe sway out of step
   * with its neighbours. Six beds of parsnip nodding in time reads as a
   * machine rather than a field.
   */
  plotIndex: number;
}

export function PlotArt({
  cropId,
  stage,
  wateredToday,
  plotIndex,
}: PlotArtProps) {
  if (cropId === null || stage === null) {
    return <SoilBed watered={false} />;
  }
  return (
    <>
      <SoilBed watered={wateredToday} />
      {stage === "Seed" && (
        <>
          <ellipse cx="16" cy="24" fill={SOIL_DARK} rx="5" ry="2.6" />
          <circle cx="16" cy="22" fill={LEAF} r="1.8" />
        </>
      )}
      {stage === "Sprout" && (
        <>
          <path d="M16 28 L16 21" stroke={STEM} strokeWidth="1.8" />
          <ellipse
            cx="12"
            cy="20"
            fill={LEAF}
            rx="4"
            ry="2.2"
            transform="rotate(-20 12 20)"
          />
          <ellipse
            cx="20"
            cy="20"
            fill={LEAF}
            rx="4"
            ry="2.2"
            transform="rotate(20 20 20)"
          />
        </>
      )}
      {stage === "Budding" && (
        <>
          <path d="M16 29 L16 15" stroke={STEM} strokeWidth="2.2" />
          <ellipse
            cx="10"
            cy="19"
            fill={LEAF}
            rx="5.5"
            ry="2.6"
            transform="rotate(-22 10 19)"
          />
          <ellipse
            cx="22"
            cy="21"
            fill={LEAF_DARK}
            rx="5.5"
            ry="2.6"
            transform="rotate(22 22 21)"
          />
          <circle cx="16" cy="13" fill={CROP_COLOURS[cropId].accent} r="3" />
        </>
      )}
      {/* Only the ripe stage moves. A crop that is ready is the thing the
          player is scanning the farm for, so the one bed that sways is the one
          worth walking to. */}
      {stage === "Ripe" && (
        <RipeSway style={{ animationDelay: `${(plotIndex % 5) * 0.7}s` }}>
          <RipeCrop cropId={cropId} />
        </RipeSway>
      )}
    </>
  );
}

const ripeSway = keyframes`
  0%, 100% { transform: rotate(-1.3deg); }
  50%      { transform: rotate(1.3deg); }
`;

/** Rocks on the root of the plant rather than about the middle of the tile. */
const RipeSway = styled.g`
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: ${ripeSway} 4.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ─── Wild sites ───────────────────────────────────────────────────────────────

function Hedgerow() {
  return (
    <g transform="translate(0, -8)">
      <ellipse cx="9" cy="26" fill="var(--vale-hedge)" rx="10" ry="12" />
      <ellipse cx="24" cy="27" fill="var(--vale-hedge)" rx="10" ry="11" />
      <ellipse cx="16" cy="17" fill="var(--vale-hedge-lit)" rx="12" ry="12" />
      <circle cx="10" cy="16" fill="#c0574d" r="2.2" />
      <circle cx="21" cy="12" fill="#c0574d" r="2.2" />
      <circle cx="24" cy="21" fill="#8e4b8a" r="2" />
      <circle cx="14" cy="24" fill="#8e4b8a" r="2" />
    </g>
  );
}

function Stonewood() {
  return (
    <g transform="translate(0, -12)">
      <path d="M2 34 L7 22 L14 21 L18 34 Z" fill="var(--vale-rock)" />
      <rect
        fill="var(--vale-bark)"
        height="16"
        rx="2"
        width="6"
        x="18"
        y="20"
      />
      <ellipse cx="21" cy="16" fill="var(--vale-canopy)" rx="13" ry="10" />
      <ellipse cx="14" cy="11" fill="var(--vale-canopy-lit)" rx="9" ry="7" />
      <ellipse cx="27" cy="10" fill="var(--vale-canopy-lit)" rx="7" ry="6" />
      <ellipse cx="9" cy="32" fill="#c9784a" rx="3" ry="1.8" />
      <rect fill="#e8d8b8" height="4" width="1.6" x="8.2" y="32" />
    </g>
  );
}

function Riverbank() {
  return (
    <g transform="translate(0, -6)">
      <path d="M0 24 q10 -5 20 0 q8 3 12 1 v13 H0 Z" fill="var(--vale-soil)" />
      <path
        d="M8 30 L6 16 M12 31 L12 15 M16 30 L18 17"
        stroke="var(--vale-reed)"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <ellipse cx="10" cy="15" fill="#a9713c" rx="1.6" ry="3.4" />
      <ellipse cx="24" cy="31" fill="var(--vale-clay)" rx="5" ry="3" />
      <ellipse cx="22" cy="29" fill="var(--vale-clay-lit)" rx="3" ry="2" />
    </g>
  );
}

function Orchard() {
  return (
    <g transform="translate(0, -12)">
      <rect
        fill="var(--vale-bark)"
        height="14"
        rx="2"
        width="5"
        x="13.5"
        y="28"
      />
      <ellipse cx="16" cy="20" fill="var(--vale-canopy-lit)" rx="14" ry="11" />
      <ellipse cx="11" cy="16" fill="var(--vale-leaf)" rx="7" ry="5" />
      <circle cx="9" cy="22" fill="#9cc34a" r="2.2" />
      <circle cx="17" cy="14" fill="#c9443a" r="2.2" />
      <circle cx="23" cy="22" fill="#9cc34a" r="2.2" />
      <circle cx="20" cy="27" fill="#c9443a" r="2" />
      <ellipse cx="25" cy="42" fill="#8b6a45" rx="2.2" ry="1.6" />
    </g>
  );
}

function Fen() {
  return (
    <g transform="translate(0, -6)">
      <ellipse cx="16" cy="30" fill="var(--vale-fen-water)" rx="15" ry="7" />
      <ellipse cx="10" cy="29" fill="var(--vale-leaf)" rx="4" ry="1.6" />
      <path
        d="M22 31 L21 17 M25 31 L26 19"
        stroke="var(--vale-reed)"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <ellipse cx="21" cy="16" fill="#8a5a2e" rx="1.4" ry="3" />
      <circle cx="8" cy="21" fill="#d9f2a0" opacity="0.85" r="1.6" />
      <circle cx="14" cy="17" fill="#d9f2a0" opacity="0.6" r="1.2" />
      <path
        d="M2 16 q7 -4 14 0 q7 4 14 0"
        fill="none"
        opacity="0.7"
        stroke="var(--vale-mist)"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </g>
  );
}

const SITE_ART: Record<SiteId, () => React.JSX.Element> = {
  hedgerow: Hedgerow,
  stonewood: Stonewood,
  riverbank: Riverbank,
  orchard: Orchard,
  fen: Fen,
};

export function SiteArt({
  siteId,
  locked,
}: {
  siteId: SiteId;
  locked: boolean;
}) {
  const Art = SITE_ART[siteId];
  return (
    <g opacity={locked ? 0.55 : 1}>
      <Art />
      {locked && (
        // A shut gate, so a site you can't reach yet still reads as a way on.
        <g transform="translate(0, 4)">
          <rect fill="#8a7256" height="3" rx="1.5" width="26" x="3" y="14" />
          <rect fill="#8a7256" height="3" rx="1.5" width="26" x="3" y="21" />
          <rect fill="#6f5a43" height="16" rx="1.5" width="3.4" x="4" y="12" />
          <rect
            fill="#6f5a43"
            height="16"
            rx="1.5"
            width="3.4"
            x="24.6"
            y="12"
          />
        </g>
      )}
    </g>
  );
}

// ─── Cottages ─────────────────────────────────────────────────────────────────

/**
 * Nessa cooks at the inn, Bram is a woodsman, Marigold keeps bees and a kiln,
 * Wren runs the mill.
 */
const COTTAGE_STYLE: Record<
  NeighbourId,
  { wall: string; roof: string; roofLit: string }
> = {
  nessa: {
    wall: "var(--vale-nessa-wall)",
    roof: "var(--vale-nessa-roof)",
    roofLit: "var(--vale-nessa-roof-lit)",
  },
  bram: {
    wall: "var(--vale-bram-wall)",
    roof: "var(--vale-bram-roof)",
    roofLit: "var(--vale-bram-roof-lit)",
  },
  marigold: {
    wall: "var(--vale-marigold-wall)",
    roof: "var(--vale-marigold-roof)",
    roofLit: "var(--vale-marigold-roof-lit)",
  },
  wren: {
    wall: "var(--vale-wren-wall)",
    roof: "var(--vale-wren-roof)",
    roofLit: "var(--vale-wren-roof-lit)",
  },
};

export function CottageArt({ neighbourId }: { neighbourId: NeighbourId }) {
  const { wall, roof, roofLit } = COTTAGE_STYLE[neighbourId];
  return (
    <g transform="translate(0, -16)">
      <rect fill={wall} height="28" rx="1.5" width="30" x="1" y="20" />
      <path d="M-2 22 L16 5 L34 22 Z" fill={roof} />
      <path d="M-2 22 L16 5 L16 22 Z" fill={roofLit} />
      <rect
        fill="var(--vale-door)"
        height="13"
        rx="1"
        width="9"
        x="11.5"
        y="35"
      />
      <circle cx="18.6" cy="42" fill="#e5c165" r="1" />
      <rect
        fill="var(--vale-window)"
        height="7"
        rx="1"
        width="7"
        x="3"
        y="24"
      />
      <rect
        fill="var(--vale-window)"
        height="7"
        rx="1"
        width="7"
        x="22"
        y="24"
      />
      <rect
        fill="var(--vale-chimney)"
        height="9"
        rx="1.2"
        width="6"
        x="24"
        y="2"
      />
      <ChimneySmoke x={27} y={1} />
      {neighbourId === "nessa" && (
        <>
          {/* Inn sign hanging by the door. */}
          <rect
            fill="var(--vale-door)"
            height="7"
            rx="1"
            width="10"
            x="1"
            y="35"
          />
          <circle cx="6" cy="38.5" fill="#e5c165" r="2" />
        </>
      )}
      {neighbourId === "bram" && (
        <path
          d="M2 44 h6 v4 h-6 Z M2 40 h6 v4 h-6 Z"
          fill="#7a5a3a"
          stroke="#5f4529"
          strokeWidth="0.6"
        />
      )}
      {neighbourId === "marigold" && (
        <>
          {/* A skep hive under the window. */}
          <ellipse cx="26" cy="45" fill="#d9a441" rx="4.5" ry="3.4" />
          <ellipse cx="26" cy="42" fill="#e5b95c" rx="3.4" ry="2.4" />
          <circle cx="21" cy="39" fill="#3a3227" r="0.9" />
        </>
      )}
      {neighbourId === "wren" && (
        <>
          {/* Flour sacks stacked by the door. */}
          <ellipse cx="5" cy="45" fill="#efe6d2" rx="4" ry="3" />
          <ellipse cx="6" cy="41" fill="#e3d7bd" rx="3.2" ry="2.4" />
          <path d="M26 44 h4 M28 42 v4" stroke="#b69b6b" strokeWidth="1" />
        </>
      )}
    </g>
  );
}

// ─── Keepsakes ────────────────────────────────────────────────────────────────

const WOOD = "var(--vale-stall-post)";
const WOOD_LIT = "var(--vale-stall-counter)";
const STONE = "var(--vale-rock)";
const STONE_LIT = "var(--vale-rock-lit)";

function Scarecrow() {
  return (
    <g transform="translate(0, -10)">
      <path d="M16 42 L16 14" stroke={WOOD} strokeWidth="2.6" />
      <path d="M5 22 L27 22" stroke={WOOD} strokeWidth="2.4" />
      <path d="M10 20 h12 l-2 14 h-8 Z" fill="#b5583f" />
      <circle cx="16" cy="13" fill="#e8d59c" r="5" />
      <path d="M8 10 h16 l-3 -5 h-10 Z" fill="#7a5a3a" />
      <circle cx="14" cy="13" fill="#3a3128" r="0.9" />
      <circle cx="18" cy="13" fill="#3a3128" r="0.9" />
      <path d="M5 22 l-2 3 M27 22 l2 3" stroke="#e2b94e" strokeWidth="1.4" />
    </g>
  );
}

function Beehive() {
  return (
    <g transform="translate(0, -4)">
      <rect fill={WOOD} height="6" width="3" x="8" y="28" />
      <rect fill={WOOD} height="6" width="3" x="21" y="28" />
      <rect fill="#e5b95c" height="8" rx="1" width="20" x="6" y="21" />
      <rect fill="#d9a441" height="8" rx="1" width="20" x="6" y="13" />
      <path d="M4 13 L16 6 L28 13 Z" fill="#a9553f" />
      <rect fill="#3a3227" height="2" rx="1" width="6" x="13" y="25" />
      <circle cx="26" cy="9" fill="#3a3227" r="1" />
      <circle cx="29" cy="15" fill="#3a3227" r="0.9" />
    </g>
  );
}

function Well() {
  return (
    <g transform="translate(0, -10)">
      <path d="M7 22 L7 10 M25 22 L25 10" stroke={WOOD} strokeWidth="2.4" />
      <path d="M3 12 L16 3 L29 12 Z" fill="#a9553f" />
      <path d="M16 10 L16 22" stroke="#8a7f6d" strokeWidth="1" />
      <rect fill="#8a7256" height="4" rx="1" width="5" x="13.5" y="20" />
      <rect fill={STONE} height="16" rx="3" width="26" x="3" y="24" />
      <path
        d="M3 30 h26 M3 35 h26 M10 24 v6 M20 24 v6 M14 30 v5 M24 30 v5"
        stroke={STONE_LIT}
        strokeWidth="1"
      />
    </g>
  );
}

function Lanterns() {
  return (
    <g>
      {[8, 23].map((x) => (
        <g key={x}>
          <path
            d={`M${x} 30 L${x} 10`}
            stroke={WOOD}
            strokeWidth="1.6"
            transform="translate(0, -6)"
          />
          <ellipse cx={x} cy="10" fill="#e08b34" rx="6" ry="5" />
          <path
            d={`M${x - 3} 9 l1.5 -1.5 l1.5 1.5 M${x} 9 l1.5 -1.5 l1.5 1.5 M${x - 3} 12 q3 2 6 0`}
            fill="none"
            stroke="#fff1a8"
            strokeWidth="1"
          />
          <rect fill={STEM} height="2.4" width="1.6" x={x - 0.8} y="3.6" />
        </g>
      ))}
      <path d="M8 4 q7.5 5 15 0" fill="none" stroke={WOOD} strokeWidth="0.8" />
    </g>
  );
}

function Birdbath() {
  return (
    <g transform="translate(0, -2)">
      <ellipse cx="16" cy="31" fill={STONE} rx="8" ry="2.6" />
      <rect fill={STONE} height="14" width="5" x="13.5" y="17" />
      <ellipse cx="16" cy="16" fill={STONE_LIT} rx="12" ry="4" />
      <ellipse cx="16" cy="15.4" fill="var(--vale-window)" rx="9" ry="2.4" />
      <ellipse cx="22" cy="11" fill="#8b6b4a" rx="3" ry="2.2" />
      <circle cx="24.2" cy="9.4" fill="#8b6b4a" r="1.6" />
      <path d="M25.6 9.4 l1.6 0.4" stroke="#e2b94e" strokeWidth="0.9" />
    </g>
  );
}

function Urns() {
  return (
    <g>
      <circle cx="16" cy="18" fill="#d9f2a0" opacity="0.28" r="15" />
      {[
        { x: 9, h: 16 },
        { x: 22, h: 12 },
      ].map(({ x, h }) => (
        <g key={x}>
          <path
            d={`M${x - 4} ${30 - h} q-3 ${h / 2} 1 ${h} h6 q4 ${-h / 2} 1 ${-h} Z`}
            fill="#6f8fa8"
          />
          <rect
            fill="#5a778f"
            height="2"
            rx="1"
            width="9"
            x={x - 4.5}
            y={29 - h}
          />
          <path
            d={`M${x - 3} ${30 - h / 2} h6`}
            stroke="#d9f2a0"
            strokeWidth="1.4"
          />
        </g>
      ))}
    </g>
  );
}

function Bunting() {
  return (
    <g transform="translate(0, -8)">
      <path d="M3 38 L3 8 M29 38 L29 8" stroke={WOOD} strokeWidth="2" />
      <path
        d="M3 10 q13 8 26 0"
        fill="none"
        stroke="#6b5233"
        strokeWidth="0.8"
      />
      {[
        { x: 6, c: "#d64545" },
        { x: 11, c: "#f2c230" },
        { x: 16, c: "#5d7fd6" },
        { x: 21, c: "#7fae5c" },
        { x: 26, c: "#e08b34" },
      ].map(({ x, c }) => {
        const y = 10 + 8 * (1 - ((x - 16) / 13) ** 2) * 0.5;
        return <path d={`M${x - 2.2} ${y} h4.4 l-2.2 5 Z`} fill={c} key={x} />;
      })}
    </g>
  );
}

function PicnicTable() {
  return (
    <g>
      <rect fill={WOOD_LIT} height="4" rx="1" width="28" x="2" y="12" />
      <path d="M7 16 L4 28 M25 16 L28 28" stroke={WOOD} strokeWidth="2.2" />
      <rect fill={WOOD} height="2.4" rx="1" width="30" x="1" y="21" />
      <circle cx="11" cy="10" fill="#d64545" r="2.6" />
      <rect fill="#e3d7bd" height="3" rx="1.4" width="7" x="16" y="8.6" />
      <ellipse cx="24" cy="10.4" fill="#cfe08a" rx="2.6" ry="2" />
    </g>
  );
}

function HerbBox() {
  return (
    <g>
      <rect fill={WOOD_LIT} height="10" rx="1.5" width="26" x="3" y="18" />
      <path d="M3 22 h26" stroke={WOOD} strokeWidth="1" />
      {[7, 12, 17, 22, 26].map((x, i) => (
        <path
          d={`M${x} 18 q${i % 2 === 0 ? -3 : 3} -6 0 -10`}
          fill="none"
          key={x}
          stroke={i % 2 === 0 ? LEAF : LEAF_DARK}
          strokeLinecap="round"
          strokeWidth="2.4"
        />
      ))}
      <circle cx="17" cy="9" fill="#b9a5dd" r="1.4" />
    </g>
  );
}

function Bench() {
  return (
    <g>
      <rect fill={WOOD} height="11" rx="1" width="3" x="5" y="14" />
      <rect fill={WOOD} height="11" rx="1" width="3" x="24" y="14" />
      <rect fill={WOOD_LIT} height="4" rx="1.4" width="28" x="2" y="10" />
      <rect fill={WOOD_LIT} height="4" rx="1.4" width="28" x="2" y="18" />
      <path d="M6 20 h20" stroke={WOOD} strokeWidth="0.8" />
    </g>
  );
}

function RoseArch() {
  return (
    <g transform="translate(0, -14)">
      <path
        d="M5 46 L5 16 Q16 0 27 16 L27 46"
        fill="none"
        stroke={WOOD}
        strokeWidth="2.4"
      />
      <path
        d="M5 40 q3 -4 0 -8 q-3 -4 0 -8 q2 -6 6 -10 M27 40 q-3 -4 0 -8 q3 -4 0 -8 q-2 -6 -6 -10"
        fill="none"
        stroke={LEAF}
        strokeWidth="2.4"
      />
      {[
        [5, 36],
        [5, 26],
        [9, 13],
        [16, 8],
        [23, 13],
        [27, 22],
        [27, 33],
      ].map(([x, y]) => (
        <circle cx={x} cy={y} fill="#d64567" key={`${x}-${y}`} r="2.2" />
      ))}
    </g>
  );
}

const windmillSpin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

/** Turns about the hub the sails are drawn around. */
const Sails = styled.g`
  transform-box: view-box;
  transform-origin: 16px 2px;
  animation: ${windmillSpin} 14s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

function Windmill() {
  return (
    <g transform="translate(0, -14)">
      <path d="M9 46 L12 10 L20 10 L23 46 Z" fill="var(--vale-wren-wall)" />
      <path d="M10 12 L16 4 L22 12 Z" fill="var(--vale-wren-roof)" />
      <rect
        fill="var(--vale-door)"
        height="8"
        rx="1"
        width="5"
        x="13.5"
        y="38"
      />
      <Sails>
        {[0, 90, 180, 270].map((angle) => (
          <rect
            fill="#f0e3c8"
            height="12"
            key={angle}
            stroke={WOOD}
            strokeWidth="0.8"
            transform={`rotate(${angle} 16 2)`}
            width="4"
            x="14"
            y="-11"
          />
        ))}
      </Sails>
      <circle cx="16" cy="2" fill={WOOD} r="1.8" />
    </g>
  );
}

function Maypole() {
  return (
    <g transform="translate(0, -16)">
      <ellipse cx="16" cy="46" fill="var(--vale-grass-alt)" rx="12" ry="3" />
      <path d="M16 46 L16 2" stroke="#e8d8b8" strokeWidth="2.4" />
      <circle cx="16" cy="3" fill="#f2c230" r="2.4" />
      {[
        { d: "M16 5 Q9 22 4 42", c: "#d64545" },
        { d: "M16 5 Q12 24 10 44", c: "#5d7fd6" },
        { d: "M16 5 Q20 24 22 44", c: "#7fae5c" },
        { d: "M16 5 Q23 22 28 42", c: "#b9a5dd" },
      ].map(({ d, c }) => (
        <path d={d} fill="none" key={c} stroke={c} strokeWidth="1.4" />
      ))}
    </g>
  );
}

const KEEPSAKE_ART: Record<KeepsakeId, () => React.JSX.Element> = {
  scarecrow: Scarecrow,
  beehive: Beehive,
  well: Well,
  lanterns: Lanterns,
  birdbath: Birdbath,
  urns: Urns,
  bunting: Bunting,
  "picnic-table": PicnicTable,
  "herb-box": HerbBox,
  bench: Bench,
  "rose-arch": RoseArch,
  windmill: Windmill,
  maypole: Maypole,
};

export function KeepsakeArt({ keepsakeId }: { keepsakeId: KeepsakeId }) {
  const Art = KEEPSAKE_ART[keepsakeId];
  return <Art />;
}

// ─── Seed stall ───────────────────────────────────────────────────────────────

export function StallArt() {
  return (
    <g transform="translate(0, -12)">
      <rect
        fill="var(--vale-stall-post)"
        height="4"
        rx="1"
        width="3"
        x="2"
        y="26"
      />
      <rect
        fill="var(--vale-stall-post)"
        height="4"
        rx="1"
        width="3"
        x="27"
        y="26"
      />
      <rect
        fill="var(--vale-stall-counter)"
        height="14"
        rx="1.5"
        width="30"
        x="1"
        y="30"
      />
      <path d="M0 26 h32 v-4 h-32 Z" fill="var(--vale-stall-awning)" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          fill="var(--vale-stall-cloth)"
          height="4"
          key={i}
          width="4"
          x={1 + i * 8}
          y="22"
        />
      ))}
      <rect
        fill="var(--vale-stall-post)"
        height="22"
        width="2.4"
        x="2"
        y="22"
      />
      <rect
        fill="var(--vale-stall-post)"
        height="22"
        width="2.4"
        x="27.6"
        y="22"
      />
      {/* Seed sacks on the counter. */}
      <ellipse cx="9" cy="33" fill="#d8c39c" rx="4" ry="3.4" />
      <ellipse cx="18" cy="34" fill="#c4ab7e" rx="3.4" ry="3" />
      <circle cx="9" cy="31" fill="#8b6b4a" r="1.2" />
      <circle cx="25" cy="33" fill="#7fae5c" r="3" />
    </g>
  );
}

// ─── The cat ──────────────────────────────────────────────────────────────────

/**
 * The barn cat, sitting wherever it has decided to sit today. Kept small: it
 * perches on the hedge and the rocks, and anything drawn much taller would hang
 * over the grass the farmer walks on.
 *
 * Every silhouette shape carries a pale rim. Ginger on green is a strong hue
 * contrast but a weak one in luminance — under 2:1 against the hedge in either
 * theme — and the whole point of the cat is being spotted, including by someone
 * who can't tell the two hues apart. The rim clears 4:1 against every perch.
 */
const TAIL = "M21 27 q7 2 5 -6";

/* Still for most of the loop, then two quick flicks. A tail that swings the
   whole time is a metronome; a tail that goes off now and again is a cat. */
const tailFlick = keyframes`
  0%, 70%, 90%, 100% { transform: rotate(0deg); }
  77% { transform: rotate(-11deg); }
  84% { transform: rotate(6deg); }
`;

/** Pivots on the root of the tail, at the bottom-left of its own box. */
const Tail = styled.g`
  transform-box: fill-box;
  transform-origin: 0% 100%;
  animation: ${tailFlick} 9s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export function CatArt() {
  return (
    <g
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0, -4)"
    >
      {/* The tail is a line, so its rim is a wider pale line drawn beneath it.
          Both come first, so the tail curls up behind the body — and both flick
          together, so the rim never parts company with what it is rimming. */}
      <Tail>
        <path d={TAIL} fill="none" stroke={CAT_RIM} strokeWidth="5.4" />
        <path d={TAIL} fill="none" stroke={CAT} strokeWidth="3" />
      </Tail>
      {/* The silhouette, every shape rimmed. Ears before the head, so the
          head's edge tidies up their base. */}
      <g fill={CAT} stroke={CAT_RIM} strokeWidth="1.2">
        <ellipse cx="15" cy="23" rx="6.5" ry="7" />
        <path d="M10 11 L10.5 5.5 L14 9.5 Z" />
        <path d="M20 11 L19.5 5.5 L16 9.5 Z" />
        <circle cx="15" cy="13" r="5.6" />
      </g>
      {/* Markings, which sit inside the silhouette and need no rim of their own. */}
      <g stroke="none">
        <path
          d="M11.5 20 q3.5 2.5 7 0"
          fill="none"
          stroke={CAT_RIM}
          strokeWidth="2.4"
        />
        <circle cx="13" cy="13" fill={CAT_EYE} r="1.1" />
        <circle cx="17" cy="13" fill={CAT_EYE} r="1.1" />
        <path d="M14.6 15.4 h1.8" stroke={CAT_EYE} strokeWidth="1" />
      </g>
    </g>
  );
}
