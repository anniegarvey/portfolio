import type { GrowthStage } from "@/lib/meadowmere/catalog";
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

/** Ripe colours per crop, so a full bed reads at a glance. */
const CROP_COLOURS: Record<CropId, { main: string; accent: string }> = {
  parsnip: { main: "#f0d9a8", accent: "#d8b877" },
  cornflower: { main: "#5d7fd6", accent: "#8fa8e8" },
  strawberry: { main: "#d64545", accent: "#f07777" },
  pumpkin: { main: "#e08b34", accent: "#f2a552" },
  moonpetal: { main: "#e6dcf5", accent: "#b9a5dd" },
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
  }
}

export interface PlotArtProps {
  cropId: CropId | null;
  stage: GrowthStage | null;
  wateredToday: boolean;
}

export function PlotArt({ cropId, stage, wateredToday }: PlotArtProps) {
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
      {stage === "Ripe" && <RipeCrop cropId={cropId} />}
    </>
  );
}

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

const SITE_ART: Record<SiteId, () => React.JSX.Element> = {
  hedgerow: Hedgerow,
  stonewood: Stonewood,
  riverbank: Riverbank,
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

/** Nessa cooks at the inn, Bram is a woodsman, Marigold keeps bees and a kiln. */
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
    </g>
  );
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
