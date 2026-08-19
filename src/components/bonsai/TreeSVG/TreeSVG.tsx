"use client";

import { keyframes, styled } from "next-yak";
import type React from "react";
import { useState } from "react";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree } from "@/lib/bonsai/schema";
import { SPECIES_CONFIG } from "@/lib/bonsai/speciesConfig";
import { SHEARS_CURSOR } from "./cursors";
import { StaticTreeSVG } from "./StaticTreeSVG";

// ─── Tool Type ────────────────────────────────────────────────────────────────

export type ActiveTool = "pruning-shears" | "watering-can";

// ─── Snip ─────────────────────────────────────────────────────────────────────

/**
 * Where the clippings scatter to, in SVG units, relative to the cut. Fixed
 * rather than random so a snip looks the same each time it is watched, and
 * far enough down to clear the canopy: a leaf-coloured speck that stays inside
 * the foliage it came from is a speck nobody sees.
 */
const CLIPPINGS = [
  { dx: -13, dy: 44, r: 2.2 },
  { dx: 9, dy: 61, r: 2.6 },
  { dx: -4, dy: 74, r: 1.9 },
  { dx: 17, dy: 38, r: 2 },
  { dx: -21, dy: 55, r: 2.4 },
  { dx: 4, dy: 86, r: 1.7 },
];

/** A branch just cut: where, plus a counter so a rapid second snip replays. */
interface Snip {
  x: number;
  y: number;
  seq: number;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// ─── Interactive Tree SVG (with pruning support) ──────────────────────────────

export function TreeSVG({
  tree,
  activeTool,
  cropTop,
  style,
  growing,
  viewAngle,
}: {
  tree: BonsaiTree;
  activeTool?: ActiveTool;
  /** Crop the SVG viewBox so there's equal vertical space above and below the tree. */
  cropTop?: boolean;
  style?: React.CSSProperties;
  /** Play the growth surge — see StaticTreeSVG. */
  growing?: boolean;
  /** Yaw (radians) around the trunk's vertical axis. */
  viewAngle?: number;
}) {
  const { pruneBranch } = useBonsai();
  const [snip, setSnip] = useState<Snip | null>(null);

  const handleBranchClick = (branchId: string, x: number, y: number) => {
    pruneBranch(tree.id, branchId);
    // The branch is simply gone on the next render. The clippings are what
    // makes that read as a cut rather than a glitch. Skipped outright under
    // reduced motion — the same guard WaterSprinkles uses — because they are
    // cleared by their own animationend, which never arrives if they never
    // animate.
    if (prefersReducedMotion()) return;
    setSnip((prev) => ({ x, y, seq: (prev?.seq ?? 0) + 1 }));
  };

  return (
    <StaticTreeSVG
      cropTop={cropTop}
      growing={growing}
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
                  handleBranchClick(branch.id, branch.x2, branch.y2);
                }}
                onKeyDown={(e) => {
                  if (
                    e.key !== "Enter" ||
                    activeTool !== "pruning-shears" ||
                    branch.isPruned
                  )
                    return;
                  handleBranchClick(branch.id, branch.x2, branch.y2);
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
                    handleBranchClick(branch.id, branch.x2, branch.y2);
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    handleBranchClick(branch.id, branch.x2, branch.y2)
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

          {snip && (
            <Clippings
              aria-hidden="true"
              // Remounts on every cut, so a second snip restarts the fall
              // instead of finishing the first one's animation in place.
              key={snip.seq}
              onAnimationEnd={() => setSnip(null)}
            >
              {CLIPPINGS.map((bit) => (
                <circle
                  cx={snip.x}
                  cy={snip.y}
                  fill={SPECIES_CONFIG[tree.speciesId].foliageColor}
                  key={`${bit.dx}-${bit.dy}`}
                  r={bit.r}
                  style={
                    {
                      "--clip-x": `${bit.dx}px`,
                      "--clip-y": `${bit.dy}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </Clippings>
          )}
        </>
      )}
      style={style}
      tree={tree}
      viewAngle={viewAngle}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const scatter = keyframes`
  from { opacity: 0.95; transform: translate(0, 0); }
  to   { opacity: 0; transform: translate(var(--clip-x), var(--clip-y)); }
`;

const Clippings = styled.g`
  pointer-events: none;
  /* Darkened, so a clipping reads against the canopy it was cut from rather
     than disappearing into its own colour. */
  filter: brightness(0.72);

  & > circle {
    animation: ${scatter} 900ms ease-in forwards;
  }

  /* The cut itself is already visible — the branch is gone. Losing the
     clippings costs no information. */
  @media (prefers-reduced-motion: reduce) {
    display: none;

    & > circle {
      animation: none;
    }
  }
`;
