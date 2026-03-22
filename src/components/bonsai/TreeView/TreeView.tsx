"use client";

import { Scissors } from "lucide-react";
import { styled } from "next-yak";
import { useMemo, useState } from "react";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree, PotId, StandId } from "@/lib/bonsai/schema";
import { SPECIES_CONFIG } from "@/lib/bonsai/schema";
import { generateTree } from "@/lib/bonsai/treeGenerator";

// ─── Tool Type ────────────────────────────────────────────────────────────────

type ActiveTool = "pruning-shears" | "watering-can";

// ─── Cursor SVGs ──────────────────────────────────────────────────────────────

function makeSvgCursor(body: string, hx: number, hy: number, fallback: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hx} ${hy}, ${fallback}`;
}

const SHEARS_CURSOR = makeSvgCursor(
  '<circle cx="6" cy="6" r="3" fill="none" stroke="#333" stroke-width="1.5"/>' +
    '<circle cx="6" cy="18" r="3" fill="none" stroke="#333" stroke-width="1.5"/>' +
    '<line x1="20" y1="4" x2="8.12" y2="12" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="14.47" y1="14.48" x2="20" y2="20" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>' +
    '<line x1="8.12" y1="12" x2="14.47" y2="14.48" stroke="#333" stroke-width="1.5" stroke-linecap="round"/>',
  12,
  12,
  "crosshair",
);

const WATER_CURSOR = makeSvgCursor(
  // Body
  '<rect x="9" y="5" width="12" height="9" rx="2.5" fill="#4a90d9"/>' +
    // Handle
    '<path d="M 20 6.5 Q 24 6.5 24 9.5 Q 24 12.5 20 12.5" fill="none" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>' +
    // Spout
    '<path d="M 10 9.5 Q 5 9.5 2 17" stroke="#4a90d9" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
    // Rose
    '<circle cx="1.5" cy="17.5" r="3" fill="#4a90d9"/>',
  2,
  18,
  "pointer",
);

// ─── Watering Can Icon (toolbar) ──────────────────────────────────────────────

function WateringCanIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <rect fill="currentColor" height="9" rx="2.5" width="12" x="9" y="5" />
      <path
        d="M 20 6.5 Q 24 6.5 24 9.5 Q 24 12.5 20 12.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M 10 9.5 Q 5 9.5 2 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <circle cx="1.5" cy="17.5" fill="currentColor" r="3" />
    </svg>
  );
}

// ─── Watering Can Overlay ─────────────────────────────────────────────────────

const DROP_X_OFFSETS = [-5, 1, 7, -2, 4] as const;
const DROP_DELAYS_MS = [0, 140, 280, 420, 560] as const;

function WateringCanDisplay({ isPouring }: { isPouring: boolean }) {
  return (
    <CanOverlay>
      <CanBodyWrapper data-pouring={isPouring || undefined}>
        {/* The can SVG — rotates with CanBodyWrapper */}
        <svg aria-hidden="true" height="80" viewBox="0 0 100 80" width="100">
          {/* Body */}
          <rect
            fill="#5b9fc9"
            height="36"
            rx="7"
            stroke="#3d7a9b"
            strokeWidth="1.5"
            width="50"
            x="35"
            y="18"
          />
          {/* Lid opening */}
          <ellipse
            cx="60"
            cy="18"
            fill="#4a8ab8"
            rx="14"
            ry="4"
            stroke="#3d7a9b"
            strokeWidth="1"
          />
          {/* Handle */}
          <path
            d="M 83 25 Q 98 25 98 36 Q 98 47 83 47"
            fill="none"
            stroke="#3d7a9b"
            strokeLinecap="round"
            strokeWidth="4"
          />
          {/* Spout outer */}
          <path
            d="M 37 35 Q 22 35 8 70"
            fill="none"
            stroke="#3d7a9b"
            strokeLinecap="round"
            strokeWidth="8"
          />
          {/* Spout inner (lighter) */}
          <path
            d="M 37 35 Q 22 35 8 70"
            fill="none"
            stroke="#5b9fc9"
            strokeLinecap="round"
            strokeWidth="5"
          />
          {/* Rose */}
          <circle cx="6" cy="72" fill="#3d7a9b" r="8" />
          {/* Rose holes */}
          <circle cx="3" cy="70" fill="#8ec8e8" r="1.4" />
          <circle cx="7" cy="68" fill="#8ec8e8" r="1.4" />
          <circle cx="10" cy="70" fill="#8ec8e8" r="1.4" />
          <circle cx="5" cy="73" fill="#8ec8e8" r="1.4" />
          <circle cx="9" cy="74" fill="#8ec8e8" r="1.4" />
          {/* Body highlight */}
          <ellipse
            cx="54"
            cy="28"
            fill="rgba(255,255,255,0.18)"
            rx="12"
            ry="6"
            transform="rotate(-10 54 28)"
          />
        </svg>
        {/* Drops are children of the rotated wrapper so they follow the can */}
        <DropsGroup>
          {DROP_X_OFFSETS.map((offsetX, i) => (
            <WaterDrop
              key={offsetX}
              style={{
                left: `${offsetX + 3}px`,
                animationDelay: `${DROP_DELAYS_MS[i]}ms`,
                animationPlayState: isPouring ? "running" : "paused",
              }}
            />
          ))}
        </DropsGroup>
      </CanBodyWrapper>
    </CanOverlay>
  );
}

// ─── Pot & Stand Labels ───────────────────────────────────────────────────────

const POT_LABELS: Record<PotId, string> = {
  "simple-clay": "Clay Pot",
  "glazed-ceramic": "Ceramic Pot",
  "stone-basin": "Stone Basin",
  "lacquered-wood": "Wood Pot",
};

const STAND_LABELS: Record<StandId, string> = {
  "bamboo-mat": "Bamboo Mat",
  "wooden-stand": "Wooden Stand",
  "carved-stone": "Stone Stand",
};

// ─── Leaf Shape Paths ─────────────────────────────────────────────────────────
// Normalized paths centered at origin, fitting in roughly a ±1 unit box.
// Scaled by leaf.rx at render time.

/** Simplified 5-lobed maple leaf. */
const PALMATE_LEAF_PATH =
  "M 0,-1 C -0.1,-0.7 -0.2,-0.5 -0.25,-0.3 L -0.85,-0.45 L -0.4,0.1 " +
  "L -0.55,0.85 L 0,0.4 L 0.55,0.85 L 0.4,0.1 L 0.85,-0.45 " +
  "L 0.25,-0.3 C 0.2,-0.5 0.1,-0.7 0,-1 Z";

/** Oak-style lobed leaf with 4 pairs of rounded side lobes. */
const LOBED_LEAF_PATH =
  "M 0,-1 C 0.3,-0.85 0.55,-0.65 0.5,-0.45 C 0.7,-0.35 0.7,-0.15 0.5,0 " +
  "C 0.7,0.1 0.65,0.3 0.45,0.45 C 0.6,0.6 0.5,0.8 0.25,0.9 L 0,1 L -0.25,0.9 " +
  "C -0.5,0.8 -0.6,0.6 -0.45,0.45 C -0.65,0.3 -0.7,0.1 -0.5,0 " +
  "C -0.7,-0.15 -0.7,-0.35 -0.5,-0.45 C -0.55,-0.65 -0.3,-0.85 0,-1 Z";

// ─── Seed / Sprout Stage ──────────────────────────────────────────────────────

function SeedSprout({
  day,
  cx,
  baseY,
  foliageColor,
}: {
  day: number;
  cx: number;
  baseY: number;
  foliageColor: string;
}) {
  // Phase 0→1 over days 0–6, after which the sprout has fully transitioned to a sapling
  const seedFade = Math.max(0, 1 - day / 5); // seed shell fades by day 5
  const crackOpen = clamp(day / 2, 0, 1); // crack opens over first 2 days
  const stemGrow = clamp((day - 0.5) / 3, 0, 1); // stem visible from day 0.5
  const leavesGrow = clamp((day - 1) / 3, 0, 1); // leaves from day 1

  const seedRx = 10;
  const seedRy = 7;
  const seedY = baseY - seedRy;

  // Crack opens from the top of the seed
  const crackDepth = seedRy * 0.6 * crackOpen;
  const crackWidth = seedRx * 0.18 * crackOpen;

  // Stem rises from the crack
  const stemTop = seedY - stemGrow * 22;

  // Leaf shape helper: a small teardrop ellipse
  const leafRx = leavesGrow * 6;
  const leafRy = leavesGrow * 3.5;

  if (seedFade <= 0 && stemGrow <= 0) return null;

  return (
    <g>
      {/* Seed body — fades out as tree takes over */}
      {seedFade > 0 && (
        <g opacity={seedFade}>
          {/* Left seed half */}
          <path
            d={`M ${cx} ${seedY - seedRy}
                C ${cx - seedRx * 1.1} ${seedY - seedRy * 0.5},
                  ${cx - seedRx * 0.9} ${seedY + seedRy * 0.5},
                  ${cx} ${seedY + seedRy}
                C ${cx - seedRx * 0.3} ${seedY + seedRy},
                  ${cx - crackWidth} ${seedY},
                  ${cx} ${seedY - crackDepth}`}
            fill="#8b6635"
          />
          {/* Right seed half */}
          <path
            d={`M ${cx} ${seedY - seedRy}
                C ${cx + seedRx * 1.1} ${seedY - seedRy * 0.5},
                  ${cx + seedRx * 0.9} ${seedY + seedRy * 0.5},
                  ${cx} ${seedY + seedRy}
                C ${cx + seedRx * 0.3} ${seedY + seedRy},
                  ${cx + crackWidth} ${seedY},
                  ${cx} ${seedY - crackDepth}`}
            fill="#a07840"
          />
          {/* Seed highlight */}
          <ellipse
            cx={cx - 3}
            cy={seedY - 2}
            fill="rgba(255,255,255,0.18)"
            rx={3}
            ry={2}
          />
        </g>
      )}

      {/* Stem */}
      {stemGrow > 0 && (
        <line
          opacity={Math.min(stemGrow * 2, 1)}
          stroke="#5a7a3a"
          strokeLinecap="round"
          strokeWidth={1.5}
          x1={cx}
          x2={cx}
          y1={seedY - crackDepth * seedFade}
          y2={stemTop}
        />
      )}

      {/* Two cotyledon leaves */}
      {leavesGrow > 0 && (
        <g opacity={Math.min(leavesGrow * 1.5, 1)}>
          {/* Left leaf */}
          <ellipse
            cx={cx - leafRx * 1.1}
            cy={stemTop + leafRy * 0.5}
            fill={foliageColor}
            rx={leafRx}
            ry={leafRy}
            transform={`rotate(-30 ${cx - leafRx * 1.1} ${stemTop + leafRy * 0.5})`}
          />
          {/* Right leaf */}
          <ellipse
            cx={cx + leafRx * 1.1}
            cy={stemTop + leafRy * 0.5}
            fill={foliageColor}
            rx={leafRx}
            ry={leafRy}
            transform={`rotate(30 ${cx + leafRx * 1.1} ${stemTop + leafRy * 0.5})`}
          />
        </g>
      )}
    </g>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

// ─── Tree SVG ─────────────────────────────────────────────────────────────────

function TreeSVG({
  tree,
  activeTool,
}: {
  tree: BonsaiTree;
  activeTool: ActiveTool;
}) {
  const { pruneBranch } = useBonsai();
  const config = SPECIES_CONFIG[tree.speciesId];
  const svgData = useMemo(
    () =>
      generateTree(tree.activeDaysCount, config, tree.prunedBranches, tree.id),
    [tree.activeDaysCount, config, tree.prunedBranches, tree.id],
  );

  const handleBranchClick = (branchId: string) => {
    pruneBranch(tree.id, branchId);
  };

  // Show seed/sprout overlay for first few days
  const showSeed = tree.activeDaysCount < 6;

  const isWateredToday = tree.lastWateredDay === tree.activeDaysCount;

  const soilFill = isWateredToday ? "#7a4f2a" : "#c4a878";

  return (
    <svg
      aria-label={`${config.label} bonsai tree, day ${tree.activeDaysCount}`}
      style={{ width: "100%", height: "auto", maxHeight: "500px" }}
      viewBox={svgData.viewBox}
    >
      <title>
        {config.label} bonsai tree, day {tree.activeDaysCount}
      </title>

      {/* Soil — colour reflects today's watering state */}
      <ellipse
        cx={svgData.trunkX}
        cy={svgData.trunkBaseY + 4}
        fill={soilFill}
        rx={22}
        ry={7}
        style={{ transition: "fill 0.8s ease" }}
      />

      {/* Ground line */}
      <line
        stroke="rgba(120, 90, 50, 0.3)"
        strokeWidth={1}
        x1={svgData.trunkX - 20}
        x2={svgData.trunkX + 20}
        y1={svgData.trunkBaseY}
        y2={svgData.trunkBaseY}
      />

      {/* Tapered trunk */}
      {svgData.trunkPathData && (
        <path d={svgData.trunkPathData} fill={config.trunkColor} />
      )}

      {/* Branches — render back-to-front by depth (deepest first so primary is on top) */}
      {[...svgData.branches]
        .sort((a, b) => b.depth - a.depth)
        .map((branch) => (
          <g key={branch.id}>
            {/* Tapered branch body */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG path cannot be replaced with <button> */}
            <path
              d={branch.pathData}
              data-branch-id={branch.id}
              fill={config.trunkColor}
              onClick={(e) => {
                if (activeTool !== "pruning-shears" || branch.isPruned) return;
                e.stopPropagation();
                handleBranchClick(branch.id);
              }}
              onKeyDown={(e) => {
                if (
                  e.key !== "Enter" ||
                  activeTool !== "pruning-shears" ||
                  branch.isPruned
                )
                  return;
                handleBranchClick(branch.id);
              }}
              role={
                activeTool === "pruning-shears" && !branch.isPruned
                  ? "button"
                  : undefined
              }
              style={{
                cursor:
                  activeTool === "pruning-shears" && !branch.isPruned
                    ? SHEARS_CURSOR
                    : "inherit",
              }}
              tabIndex={
                activeTool === "pruning-shears" && !branch.isPruned
                  ? 0
                  : undefined
              }
            >
              {activeTool === "pruning-shears" && !branch.isPruned && (
                <title>Click to prune</title>
              )}
              {branch.isPruned && <title>Pruned (regrowing…)</title>}
            </path>

            {/* Invisible wider hit area — only active when pruning shears selected */}
            {activeTool === "pruning-shears" && !branch.isPruned && (
              // biome-ignore lint/a11y/useSemanticElements: SVG line cannot be replaced with <button>
              <line
                onClick={(e) => {
                  e.stopPropagation();
                  handleBranchClick(branch.id);
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleBranchClick(branch.id)
                }
                role="button"
                stroke="transparent"
                strokeWidth={10}
                style={{ cursor: SHEARS_CURSOR }}
                tabIndex={-1}
                x1={branch.x1}
                x2={branch.x2}
                y1={branch.y1}
                y2={branch.y2}
              />
            )}

            {/* Small leaf cluster at terminal tips — clicks bubble to branch hit area */}
            {branch.leaves.map((leaf) => {
              if (config.leafShape === "palmate") {
                return (
                  <path
                    d={PALMATE_LEAF_PATH}
                    fill={config.foliageColor}
                    key={leaf.id}
                    transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.angleDeg}) scale(${leaf.rx})`}
                  />
                );
              }
              if (config.leafShape === "lobed") {
                return (
                  <path
                    d={LOBED_LEAF_PATH}
                    fill={config.foliageColor}
                    key={leaf.id}
                    transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.angleDeg}) scale(${leaf.rx})`}
                  />
                );
              }
              // needle, scale, oval — ellipse
              return (
                <ellipse
                  cx={leaf.cx}
                  cy={leaf.cy}
                  fill={config.foliageColor}
                  key={leaf.id}
                  rx={leaf.rx}
                  ry={leaf.ry}
                  transform={`rotate(${leaf.angleDeg} ${leaf.cx} ${leaf.cy})`}
                />
              );
            })}
          </g>
        ))}

      {/* Foliage at the trunk apex */}
      {svgData.apexLeaves.map((leaf) => {
        if (config.leafShape === "palmate") {
          return (
            <path
              d={PALMATE_LEAF_PATH}
              fill={config.foliageColor}
              key={leaf.id}
              transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.angleDeg}) scale(${leaf.rx})`}
            />
          );
        }
        if (config.leafShape === "lobed") {
          return (
            <path
              d={LOBED_LEAF_PATH}
              fill={config.foliageColor}
              key={leaf.id}
              transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.angleDeg}) scale(${leaf.rx})`}
            />
          );
        }
        return (
          <ellipse
            cx={leaf.cx}
            cy={leaf.cy}
            fill={config.foliageColor}
            key={leaf.id}
            rx={leaf.rx}
            ry={leaf.ry}
            transform={`rotate(${leaf.angleDeg} ${leaf.cx} ${leaf.cy})`}
          />
        );
      })}

      {/* Seed / sprout overlay for early days */}
      {showSeed && (
        <SeedSprout
          baseY={svgData.trunkBaseY}
          cx={svgData.trunkX}
          day={tree.activeDaysCount}
          foliageColor={config.foliageColor}
        />
      )}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TreeView({ tree }: { tree: BonsaiTree | null }) {
  const [activeTool, setActiveTool] = useState<ActiveTool>("pruning-shears");
  const [isPouring, setIsPouring] = useState(false);
  const { waterTree } = useBonsai();

  if (!tree) {
    return (
      <EmptyState>
        <EmptyEmoji aria-hidden="true">🪴</EmptyEmoji>
        <p>No tree selected. Plant a seed to get started!</p>
      </EmptyState>
    );
  }

  const config = SPECIES_CONFIG[tree.speciesId];
  const isWateredToday = tree.lastWateredDay === tree.activeDaysCount;

  return (
    <TreeViewWrapper>
      <TreeLabel>
        {config.emoji} {config.label}
      </TreeLabel>

      <ToolBar>
        <ToolBtn
          data-active={activeTool === "pruning-shears" || undefined}
          onClick={() => setActiveTool("pruning-shears")}
          title="Pruning Shears"
          type="button"
        >
          <Scissors size={15} />
          Pruning Shears
        </ToolBtn>
        <ToolBtn
          data-active={activeTool === "watering-can" || undefined}
          onClick={() => setActiveTool("watering-can")}
          title="Watering Can"
          type="button"
        >
          <WateringCanIcon size={15} />
          Watering Can
        </ToolBtn>
      </ToolBar>

      <SVGContainer
        onClick={
          activeTool === "watering-can" ? () => waterTree(tree.id) : undefined
        }
        onPointerCancel={() => setIsPouring(false)}
        onPointerDown={
          activeTool === "watering-can" ? () => setIsPouring(true) : undefined
        }
        onPointerLeave={() => setIsPouring(false)}
        onPointerUp={() => setIsPouring(false)}
        style={{
          cursor: activeTool === "watering-can" ? WATER_CURSOR : undefined,
        }}
      >
        {activeTool === "watering-can" && (
          <WateringCanDisplay isPouring={isPouring} />
        )}
        <TreeSVG activeTool={activeTool} tree={tree} />
      </SVGContainer>

      <WaterStatus data-watered={isWateredToday || undefined}>
        <WateringCanIcon size={13} />
        {isWateredToday
          ? "Watered today — tree will grow tomorrow"
          : "Not watered today"}
      </WaterStatus>

      {activeTool === "watering-can" && !isWateredToday && (
        <Hint>Click the tree to water it</Hint>
      )}

      {activeTool === "pruning-shears" && tree.prunedBranches.length > 0 && (
        <Hint>
          {tree.prunedBranches.length} branch
          {tree.prunedBranches.length > 1 ? "es" : ""} regrowing…
        </Hint>
      )}

      {activeTool === "pruning-shears" &&
        tree.activeDaysCount >= 5 &&
        tree.prunedBranches.length === 0 && (
          <Hint>Click any branch to prune it</Hint>
        )}

      {/* Pot & Stand display */}
      <DisplayBase>
        {tree.equippedPotId && (
          <PotDisplay>{POT_LABELS[tree.equippedPotId]}</PotDisplay>
        )}
        {tree.equippedStandId && (
          <StandDisplay>{STAND_LABELS[tree.equippedStandId]}</StandDisplay>
        )}
      </DisplayBase>
    </TreeViewWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const TreeViewWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
`;

const TreeLabel = styled.h2`
  font-size: 1.4rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-700), var(--color-primary-400));
  margin: 0;
`;

const ToolBar = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ToolBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  border: 1.5px solid light-dark(#c8c0b4, #4a5060);
  background: transparent;
  color: light-dark(#6a6058, #a09888);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &[data-active] {
    border-color: light-dark(#7a9e6a, #5a8a4a);
    background: light-dark(#f0f5ed, #1e3020);
    color: light-dark(#3a5a2a, #8ab870);
    font-weight: 600;
  }

  &:hover:not([data-active]) {
    background: light-dark(#f5f3f0, #2a3040);
  }
`;

const SVGContainer = styled.div`
  position: relative;
  width: 100%;
  background: light-dark(#f0ebe3, #3d6e99);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid light-dark(#d4c9b8, #5a8ab8);
`;

const CanOverlay = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  pointer-events: none;
  z-index: 1;
`;

const CanBodyWrapper = styled.div`
  position: relative;
  transform-origin: 87% 44%;
  transform: rotate(-8deg);
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  &[data-pouring] {
    transform: rotate(10deg);
  }
`;

const DropsGroup = styled.div`
  position: absolute;
  top: 70px;
  left: 2px;
  pointer-events: none;
`;

const WaterDrop = styled.span`
  position: absolute;
  width: 4px;
  height: 8px;
  border-radius: 50% 50% 50% 50% / 20% 20% 80% 80%;
  background: linear-gradient(to bottom, #7ec8f0, #3d7abf);
  opacity: 0;

  @keyframes water-drop {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0.5);
    }
    12% {
      opacity: 0.88;
      transform: translateY(5px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(48px) translateX(-3px) scale(0.85);
    }
  }

  animation: water-drop 0.62s ease-in infinite;
`;

const WaterStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: light-dark(#9a8878, #7a8898);

  &[data-watered] {
    color: light-dark(#4a7a3a, #6ab860);
  }
`;

const Hint = styled.p`
  font-size: 1.1rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  margin: 0;
  font-style: italic;
`;

const DisplayBase = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

const PotDisplay = styled.div`
  background: light-dark(#c4a882, #8b6b4a);
  color: light-dark(#3d2b1a, #f0e8dc);
  border-radius: 4px 4px 8px 8px;
  padding: 0.3rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
`;

const StandDisplay = styled.div`
  background: light-dark(#a08060, #6b4a2a);
  color: light-dark(#f0e8dc, #f0e8dc);
  border-radius: 4px;
  padding: 0.2rem 2rem;
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  text-align: center;
`;

const EmptyEmoji = styled.span`
  font-size: 4rem;
`;
