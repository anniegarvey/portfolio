"use client";

import { Coins, Droplets, Lock, Scissors } from "lucide-react";
import { styled } from "next-yak";
import { type KeyboardEvent, useCallback, useState } from "react";
import {
  type ActiveTool,
  TreeSVG,
  WATER_CURSOR,
} from "@/components/bonsai/TreeSVG";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree, PotId, StandId } from "@/lib/bonsai/schema";
import { SHOP_CATALOG, SPECIES_CONFIG } from "@/lib/bonsai/schema";

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

const TOOL_PRICES = Object.fromEntries(
  SHOP_CATALOG.filter((i) => i.category === "tool").map((i) => [i.id, i.cost]),
);

// ─── Watering wrapper ─────────────────────────────────────────────────────────

function onWaterKeyDown(e: KeyboardEvent, waterFn: () => void) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    waterFn();
  }
}

function WaterableSVGContainer({
  tree,
  activeTool,
}: {
  tree: BonsaiTree;
  activeTool: ActiveTool;
}) {
  const { waterTree } = useBonsai();
  const isWatering = activeTool === "watering-can";
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => onWaterKeyDown(e, () => waterTree(tree.id)),
    [tree.id, waterTree],
  );

  return (
    <SVGContainer
      aria-label={isWatering ? "Water the tree" : undefined}
      onClick={isWatering ? () => waterTree(tree.id) : undefined}
      onKeyDown={isWatering ? handleKeyDown : undefined}
      role={isWatering ? "button" : undefined}
      style={{ cursor: isWatering ? WATER_CURSOR : undefined }}
      tabIndex={isWatering ? 0 : undefined}
    >
      <TreeSVG activeTool={activeTool} cropTop tree={tree} />
    </SVGContainer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TreeView({
  tree,
  onNavigateToShop,
}: {
  tree: BonsaiTree;
  onNavigateToShop: (itemId: string) => void;
}) {
  const { state } = useBonsai();
  const [activeTool, setActiveTool] = useState<ActiveTool>("watering-can");

  const config = SPECIES_CONFIG[tree.speciesId];
  const isWateredToday = tree.lastWateredDay === tree.activeDaysCount;
  const ownedTools = state.inventory.ownedToolIds;
  const hasWateringCan = ownedTools.includes("watering-can");
  const hasPruningShears = ownedTools.includes("pruning-shears");

  return (
    <TreeViewWrapper>
      <TreeLabel>
        {config.emoji} {tree.name ?? config.label}
      </TreeLabel>

      <ToolBar>
        {hasWateringCan ? (
          <ToolBtn
            data-active={activeTool === "watering-can" || undefined}
            onClick={() => setActiveTool("watering-can")}
            title="Watering Can"
            type="button"
          >
            <Droplets size={15} />
            Watering Can
          </ToolBtn>
        ) : (
          <LockedToolBtn
            onClick={() => onNavigateToShop("watering-can")}
            title="Watering Can (locked)"
            type="button"
          >
            <Lock size={13} />
            Watering Can
            <ToolPrice>
              <Coins size={12} />
              {TOOL_PRICES["watering-can"]}
            </ToolPrice>
          </LockedToolBtn>
        )}
        {hasPruningShears ? (
          <ToolBtn
            data-active={activeTool === "pruning-shears" || undefined}
            onClick={() => setActiveTool("pruning-shears")}
            title="Pruning Shears"
            type="button"
          >
            <Scissors size={15} />
            Pruning Shears
          </ToolBtn>
        ) : (
          <LockedToolBtn
            onClick={() => onNavigateToShop("pruning-shears")}
            title="Pruning Shears (locked)"
            type="button"
          >
            <Lock size={13} />
            Pruning Shears
            <ToolPrice>
              <Coins size={12} />
              {TOOL_PRICES["pruning-shears"]}
            </ToolPrice>
          </LockedToolBtn>
        )}
      </ToolBar>

      <WaterableSVGContainer activeTool={activeTool} tree={tree} />

      <WaterStatus data-watered={isWateredToday || undefined}>
        <Droplets aria-hidden="true" size={13} />
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

const LockedToolBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  border: 1.5px solid light-dark(#e0d8d0, #3a3f4a);
  background: transparent;
  color: light-dark(#a09888, #6a7080);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &:hover {
    background: light-dark(#f9f7f5, #242930);
    border-color: #f59e0b99;
  }
`;

const ToolPrice = styled.span`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: #f59e0b;
  font-weight: 600;
  margin-left: 0.15rem;
`;

const SVGContainer = styled.div`
  width: 100%;
  background: light-dark(#f0ebe3, #3d6e99);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid light-dark(#d4c9b8, #5a8ab8);
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
