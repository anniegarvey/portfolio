"use client";

import { Droplets, MousePointer2 } from "lucide-react";
import { styled } from "next-yak";
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import { TreeSVG, WATER_CURSOR } from "@/components/bonsai/TreeSVG";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree, GardenPosition } from "@/lib/bonsai/schema";
import { SPECIES_CONFIG } from "@/lib/bonsai/schema";

// Trees positioned near an edge get clamped so they stay fully visible.
// The mini tree container is ~90px wide and the garden uses percentage coords,
// so we clamp x/y to keep the tree center away from the edges.
const CLAMP_MIN = 8;
const CLAMP_MAX = 92;

function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

// ─── Mini Tree ────────────────────────────────────────────────────────────────

type GardenTool = "move" | "water";

interface MiniTreeProps {
  tree: BonsaiTree;
  isPlacing: boolean;
  gardenTool: GardenTool;
  gardenRef: RefObject<HTMLDivElement | null>;
  onOpen: (tree: BonsaiTree) => void;
  onPositionChange: (treeId: string, pos: GardenPosition) => void;
  onWater: (treeId: string) => void;
}

function MiniTree({
  tree,
  isPlacing,
  gardenTool,
  gardenRef,
  onOpen,
  onPositionChange,
  onWater,
}: MiniTreeProps) {
  const dragState = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  const pos = tree.gardenPosition ?? { x: 50, y: 50 };
  const config = SPECIES_CONFIG[tree.speciesId];
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (isPlacing) return;
      e.stopPropagation();
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      };
      // Only capture the pointer in move mode — water mode doesn't drag
      if (gardenTool !== "water") {
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }
    },
    [isPlacing, gardenTool],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: gardenRef is a stable ref object
  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!(dragState.current && gardenRef.current)) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      if (!dragState.current.moved && Math.hypot(dx, dy) < 5) return;
      dragState.current.moved = true;

      const rect = gardenRef.current.getBoundingClientRect();
      const x = clamp(
        ((e.clientX - rect.left) / rect.width) * 100,
        CLAMP_MIN,
        CLAMP_MAX,
      );
      const y = clamp(
        ((e.clientY - rect.top) / rect.height) * 100,
        CLAMP_MIN,
        CLAMP_MAX,
      );
      onPositionChange(tree.id, { x, y });
    },
    [tree.id, onPositionChange],
  );

  const handlePointerUp = useCallback(
    (_e: ReactPointerEvent<HTMLDivElement>) => {
      if (!dragState.current) return;
      if (!dragState.current.moved) {
        if (gardenTool === "water") {
          onWater(tree.id);
        } else {
          onOpen(tree);
        }
      }
      dragState.current = null;
    },
    [tree, onOpen, onWater, gardenTool],
  );

  const label =
    gardenTool === "water"
      ? `${config.label}, day ${tree.activeDaysCount}. Click to water.`
      : `${config.label}, day ${tree.activeDaysCount}. Click to tend, drag to move.`;

  return (
    <MiniTreeContainer
      aria-label={label}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isPlacing) {
          e.preventDefault();
          if (gardenTool === "water") {
            onWater(tree.id);
          } else {
            onOpen(tree);
          }
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="button"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        cursor: gardenTool === "water" ? WATER_CURSOR : undefined,
      }}
      tabIndex={isPlacing ? -1 : 0}
    >
      <MiniSVGWrapper>
        <TreeSVG tree={tree} />
      </MiniSVGWrapper>
      <TreeNameTag>
        {config.emoji} {config.label}
      </TreeNameTag>
    </MiniTreeContainer>
  );
}

// ─── Garden View ──────────────────────────────────────────────────────────────

interface GardenViewProps {
  onOpenTree: (tree: BonsaiTree) => void;
}

export function GardenView({ onOpenTree }: GardenViewProps) {
  const {
    state,
    placingSpeciesId,
    cancelPlanting,
    confirmPlantAt,
    updateTreePosition,
    waterTree,
  } = useBonsai();
  const gardenRef = useRef<HTMLDivElement | null>(null);
  const [gardenTool, setGardenTool] = useState<GardenTool>("move");

  const handleGardenClick = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!placingSpeciesId) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = clamp(
        ((e.clientX - rect.left) / rect.width) * 100,
        CLAMP_MIN,
        CLAMP_MAX,
      );
      const y = clamp(
        ((e.clientY - rect.top) / rect.height) * 100,
        CLAMP_MIN,
        CLAMP_MAX,
      );
      confirmPlantAt(placingSpeciesId, { x, y });
    },
    [placingSpeciesId, confirmPlantAt],
  );

  const isPlacing = placingSpeciesId !== null;

  return (
    <GardenWrapper>
      <GardenToolbar>
        <ToolBtn
          data-active={gardenTool === "move" || undefined}
          onClick={() => setGardenTool("move")}
          title="Move trees"
          type="button"
        >
          <MousePointer2 size={15} />
          Move
        </ToolBtn>
        <ToolBtn
          data-active={gardenTool === "water" || undefined}
          onClick={() => setGardenTool("water")}
          title="Water trees"
          type="button"
        >
          <Droplets size={15} />
          Water
        </ToolBtn>
        <ShortcutHint>Press D to advance day</ShortcutHint>
      </GardenToolbar>
      <Garden
        data-placing={isPlacing || undefined}
        onPointerUp={isPlacing ? handleGardenClick : undefined}
        ref={gardenRef}
        style={{ cursor: isPlacing ? "crosshair" : undefined }}
      >
        {state.trees.length === 0 && !isPlacing && (
          <EmptyGarden>
            <EmptyEmoji aria-hidden="true">🪴</EmptyEmoji>
            <p>
              Your garden is empty. Buy a seed from the shop to get started!
            </p>
          </EmptyGarden>
        )}

        {state.trees.map((tree) => (
          <MiniTree
            gardenRef={gardenRef}
            gardenTool={gardenTool}
            isPlacing={isPlacing}
            key={tree.id}
            onOpen={onOpenTree}
            onPositionChange={updateTreePosition}
            onWater={waterTree}
            tree={tree}
          />
        ))}

        {isPlacing && placingSpeciesId && (
          <PlacementOverlay>
            <PlacementHint>
              {SPECIES_CONFIG[placingSpeciesId].emoji} Click anywhere to place
              your {SPECIES_CONFIG[placingSpeciesId].label}
            </PlacementHint>
            <CancelButton onClick={cancelPlanting} type="button">
              Cancel
            </CancelButton>
          </PlacementOverlay>
        )}
      </Garden>
    </GardenWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GardenWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const GardenToolbar = styled.div`
  display: flex;
  align-items: center;
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

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

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

const ShortcutHint = styled.span`
  margin-left: auto;
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
  font-style: italic;
`;

const Garden = styled.div`
  position: relative;
  width: 100%;
  min-height: 320px;
  height: 420px;
  border-radius: 16px;
  border: 2px solid light-dark(#b8d4a0, #3a5a30);
  background:
    radial-gradient(ellipse at 20% 80%, light-dark(#c8e6a0, #1a3a18) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 70%, light-dark(#b8d890, #162e14) 0%, transparent 50%),
    light-dark(#d4ebb8, #1e3c1a);
  overflow: hidden;
  user-select: none;

  &[data-placing] {
    border-style: dashed;
  }
`;

const MiniTreeContainer = styled.div`
  position: absolute;
  transform: translate(-50%, -80%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: grab;
  touch-action: none;
  border-radius: 8px;
  padding: 4px;
  transition: filter 150ms ease;

  &:active {
    cursor: grabbing;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }

  &:hover {
    filter: brightness(1.08);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const MiniSVGWrapper = styled.div`
  width: 90px;
  pointer-events: none;
`;

const TreeNameTag = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: light-dark(#2a4a1a, #a0c880);
  background: light-dark(rgba(255, 255, 255, 0.7), rgba(0, 0, 0, 0.5));
  padding: 1px 6px;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
`;

const PlacementOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: light-dark(rgba(255, 255, 255, 0.15), rgba(0, 0, 0, 0.25));
  pointer-events: none;
`;

const PlacementHint = styled.p`
  font-size: 1.2rem;
  font-weight: 600;
  color: light-dark(#2a4a1a, #a0c880);
  background: light-dark(rgba(255, 255, 255, 0.85), rgba(0, 0, 0, 0.7));
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  margin: 0;
`;

const CancelButton = styled.button`
  pointer-events: all;
  background: light-dark(white, var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
  cursor: pointer;
  font-size: 1rem;
  padding: 0.35rem 1rem;

  &:hover {
    background: light-dark(var(--color-grey-100), var(--color-grey-700));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }
`;

const EmptyGarden = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: light-dark(#3a6a2a, #7ab860);
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
`;

const EmptyEmoji = styled.span`
  font-size: 3rem;
`;
