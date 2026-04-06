"use client";

import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { SHEARS_CURSOR } from "./cursors";
import { StaticTreeSVG } from "./StaticTreeSVG";

// ─── Tool Type ────────────────────────────────────────────────────────────────

export type ActiveTool = "pruning-shears" | "watering-can";

// ─── Interactive Tree SVG (with pruning support) ──────────────────────────────

export function TreeSVG({
  tree,
  activeTool,
  cropTop,
  style,
}: {
  tree: BonsaiTree;
  activeTool?: ActiveTool;
  /** Crop the SVG viewBox so there's equal vertical space above and below the tree. */
  cropTop?: boolean;
  style?: React.CSSProperties;
}) {
  const { pruneBranch } = useBonsai();

  const handleBranchClick = (branchId: string) => {
    pruneBranch(tree.id, branchId);
  };

  return (
    <StaticTreeSVG
      cropTop={cropTop}
      overlay={(svgData) => (
        <>
          {svgData.branches.map((branch) => (
            <g key={branch.id}>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG path cannot be replaced with <button> */}
              <path
                d={branch.pathData}
                data-branch-id={branch.id}
                fill="transparent"
                onClick={(e) => {
                  if (activeTool !== "pruning-shears" || branch.isPruned)
                    return;
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
            </g>
          ))}
        </>
      )}
      style={style}
      tree={tree}
    />
  );
}
