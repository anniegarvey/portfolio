"use client";

import { styled } from "next-yak";
import { useMemo } from "react";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { SPECIES_CONFIG } from "@/lib/bonsai/schema";
import { generateTree } from "@/lib/bonsai/treeGenerator";
import { SHEARS_CURSOR } from "./cursors";

// ─── Tool Type ────────────────────────────────────────────────────────────────

export type ActiveTool = "pruning-shears" | "watering-can";

// ─── Leaf Shape Paths ─────────────────────────────────────────────────────────

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

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

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
  const seedFade = Math.max(0, 1 - day / 5);
  const crackOpen = clamp(day / 2, 0, 1);
  const stemGrow = clamp((day - 0.5) / 3, 0, 1);
  const leavesGrow = clamp((day - 1) / 3, 0, 1);

  const seedRx = 10;
  const seedRy = 7;
  const seedY = baseY - seedRy;

  const crackDepth = seedRy * 0.6 * crackOpen;
  const crackWidth = seedRx * 0.18 * crackOpen;
  const stemTop = seedY - stemGrow * 22;
  const leafRx = leavesGrow * 6;
  const leafRy = leavesGrow * 3.5;

  if (seedFade <= 0 && stemGrow <= 0) return null;

  return (
    <g>
      {seedFade > 0 && (
        <g opacity={seedFade}>
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
          <ellipse
            cx={cx - 3}
            cy={seedY - 2}
            fill="rgba(255,255,255,0.18)"
            rx={3}
            ry={2}
          />
        </g>
      )}
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
      {leavesGrow > 0 && (
        <g opacity={Math.min(leavesGrow * 1.5, 1)}>
          <ellipse
            cx={cx - leafRx * 1.1}
            cy={stemTop + leafRy * 0.5}
            fill={foliageColor}
            rx={leafRx}
            ry={leafRy}
            transform={`rotate(-30 ${cx - leafRx * 1.1} ${stemTop + leafRy * 0.5})`}
          />
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

// ─── Leaf Renderer ────────────────────────────────────────────────────────────

function renderLeaves(
  leaves: ReturnType<typeof generateTree>["apexLeaves"],
  leafShape: string,
  foliageColor: string,
) {
  return leaves.map((leaf) => {
    if (leafShape === "palmate") {
      return (
        <path
          d={PALMATE_LEAF_PATH}
          fill={foliageColor}
          key={leaf.id}
          transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.angleDeg}) scale(${leaf.rx})`}
        />
      );
    }
    if (leafShape === "lobed") {
      return (
        <path
          d={LOBED_LEAF_PATH}
          fill={foliageColor}
          key={leaf.id}
          transform={`translate(${leaf.cx} ${leaf.cy}) rotate(${leaf.angleDeg}) scale(${leaf.rx})`}
        />
      );
    }
    return (
      <ellipse
        cx={leaf.cx}
        cy={leaf.cy}
        fill={foliageColor}
        key={leaf.id}
        rx={leaf.rx}
        ry={leaf.ry}
        transform={`rotate(${leaf.angleDeg} ${leaf.cx} ${leaf.cy})`}
      />
    );
  });
}

// ─── Interactive Tree SVG (with pruning support) ──────────────────────────────

export function TreeSVG({
  tree,
  activeTool,
  style,
}: {
  tree: BonsaiTree;
  activeTool?: ActiveTool;
  style?: React.CSSProperties;
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

  const showSeed = tree.activeDaysCount < 6;
  const isWateredToday = tree.lastWateredDay === tree.activeDaysCount;
  const soilFill = isWateredToday ? "#7a4f2a" : "#c4a878";

  return (
    <svg
      aria-label={`${config.label} bonsai tree, day ${tree.activeDaysCount}`}
      style={{ width: "100%", height: "auto", ...style }}
      viewBox={svgData.viewBox}
    >
      <title>
        {config.label} bonsai tree, day {tree.activeDaysCount}
      </title>

      <SoilEllipse
        cx={svgData.trunkX}
        cy={svgData.trunkBaseY + 4}
        fill={soilFill}
        rx={22}
        ry={7}
      />

      <line
        stroke="rgba(120, 90, 50, 0.3)"
        strokeWidth={1}
        x1={svgData.trunkX - 20}
        x2={svgData.trunkX + 20}
        y1={svgData.trunkBaseY}
        y2={svgData.trunkBaseY}
      />

      {svgData.trunkPathData && (
        <path d={svgData.trunkPathData} fill={config.trunkColor} />
      )}

      {[...svgData.branches]
        .sort((a, b) => b.depth - a.depth)
        .map((branch) => (
          <g key={branch.id}>
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

            {renderLeaves(branch.leaves, config.leafShape, config.foliageColor)}
          </g>
        ))}

      {renderLeaves(svgData.apexLeaves, config.leafShape, config.foliageColor)}

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const SoilEllipse = styled.ellipse`
  transition: fill 0.8s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
