"use client";

import {
  Coins,
  Droplets,
  FlaskConical,
  Lock,
  Scissors,
  Sprout,
  Square,
} from "lucide-react";
import { styled } from "next-yak";
import { type KeyboardEvent, useCallback, useState } from "react";
import {
  type ActiveTool,
  TreeSVG,
  WATER_CURSOR,
} from "@/components/bonsai/TreeSVG";
import { useBonsai } from "@/lib/bonsai/context";
import type { BonsaiTree, FertiliserId } from "@/lib/bonsai/schema";
import {
  FERTILISER_EFFECTS,
  SHOP_CATALOG,
  SPECIES_CONFIG,
} from "@/lib/bonsai/schema";

// ─── Prices ───────────────────────────────────────────────────────────────────

const TOOL_PRICES = Object.fromEntries(
  SHOP_CATALOG.filter((i) => i.category === "tool").map((i) => [i.id, i.cost]),
);

const CHEAPEST_POT_PRICE = Math.min(
  ...SHOP_CATALOG.filter((i) => i.category === "pot").map((i) => i.cost),
);
const CHEAPEST_STAND_PRICE = Math.min(
  ...SHOP_CATALOG.filter((i) => i.category === "stand").map((i) => i.cost),
);
const CHEAPEST_FERTILISER_PRICE = Math.min(
  ...SHOP_CATALOG.filter((i) => i.category === "fertiliser").map((i) => i.cost),
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

// ─── Pot Picker ───────────────────────────────────────────────────────────────

function PotPicker({
  tree,
  onClose,
}: {
  tree: BonsaiTree;
  onClose: () => void;
}) {
  const { state, equipPot } = useBonsai();
  const ownedPotIds = state.inventory.ownedPotIds;

  // Count pots equipped to OTHER trees
  const equippedByOthers = state.trees
    .filter((t) => t.id !== tree.id)
    .flatMap((t) => (t.equippedPotId ? [t.equippedPotId] : []));

  const uniquePots = [...new Set(ownedPotIds)];

  return (
    <PickerPanel>
      <PickerTitle>Choose a Pot</PickerTitle>
      <PickerGrid>
        {uniquePots.map((potId) => {
          const countOwned = ownedPotIds.filter((p) => p === potId).length;
          const countUsedElsewhere = equippedByOthers.filter(
            (p) => p === potId,
          ).length;
          const available = countOwned - countUsedElsewhere > 0;
          const isEquipped = tree.equippedPotId === potId;
          const label =
            SHOP_CATALOG.find((i) => i.id === potId)?.label ?? potId;

          return (
            <PickerBtn
              data-active={isEquipped || undefined}
              data-disabled={!(available || isEquipped) || undefined}
              disabled={!(available || isEquipped)}
              key={potId}
              onClick={() => {
                if (available || isEquipped) {
                  equipPot(tree.id, potId);
                  onClose();
                }
              }}
              title={label}
              type="button"
            >
              {label}
              {isEquipped && <EquippedTag>Equipped</EquippedTag>}
              {!(available || isEquipped) && (
                <UnavailableTag>In use</UnavailableTag>
              )}
            </PickerBtn>
          );
        })}
      </PickerGrid>
    </PickerPanel>
  );
}

// ─── Stand Picker ─────────────────────────────────────────────────────────────

function StandPicker({
  tree,
  onClose,
}: {
  tree: BonsaiTree;
  onClose: () => void;
}) {
  const { state, equipStand } = useBonsai();
  const ownedStandIds = state.inventory.ownedStandIds;

  const equippedByOthers = state.trees
    .filter((t) => t.id !== tree.id)
    .flatMap((t) => (t.equippedStandId ? [t.equippedStandId] : []));

  const uniqueStands = [...new Set(ownedStandIds)];

  return (
    <PickerPanel>
      <PickerTitle>Choose a Stand</PickerTitle>
      <PickerGrid>
        {uniqueStands.map((standId) => {
          const countOwned = ownedStandIds.filter((s) => s === standId).length;
          const countUsedElsewhere = equippedByOthers.filter(
            (s) => s === standId,
          ).length;
          const available = countOwned - countUsedElsewhere > 0;
          const isEquipped = tree.equippedStandId === standId;
          const label =
            SHOP_CATALOG.find((i) => i.id === standId)?.label ?? standId;

          return (
            <PickerBtn
              data-active={isEquipped || undefined}
              data-disabled={!(available || isEquipped) || undefined}
              disabled={!(available || isEquipped)}
              key={standId}
              onClick={() => {
                if (available || isEquipped) {
                  equipStand(tree.id, standId);
                  onClose();
                }
              }}
              title={label}
              type="button"
            >
              {label}
              {isEquipped && <EquippedTag>Equipped</EquippedTag>}
              {!(available || isEquipped) && (
                <UnavailableTag>In use</UnavailableTag>
              )}
            </PickerBtn>
          );
        })}
      </PickerGrid>
    </PickerPanel>
  );
}

// ─── Fertiliser Picker ────────────────────────────────────────────────────────

function FertiliserPicker({
  tree,
  onClose,
}: {
  tree: BonsaiTree;
  onClose: () => void;
}) {
  const { state, applyFertiliser } = useBonsai();
  const owned = state.inventory.ownedFertiliserIds;

  // Count by fertiliser ID
  const counts = owned.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts) as [FertiliserId, number][];

  return (
    <PickerPanel>
      <PickerTitle>Apply Fertiliser</PickerTitle>
      {entries.length === 0 ? (
        <PickerEmpty>No fertiliser in inventory</PickerEmpty>
      ) : (
        <PickerGrid>
          {entries.map(([fertiliserId, count]) => {
            const label =
              SHOP_CATALOG.find((i) => i.id === fertiliserId)?.label ??
              fertiliserId;
            const effect = FERTILISER_EFFECTS[fertiliserId];
            const effectDesc =
              effect.type === "growth-tonic"
                ? `+${effect.bonusPerTick} days/tick · ${effect.duration} growth days`
                : `${effect.retentionDays} day retention · ${effect.duration} growth days`;

            return (
              <PickerBtn
                key={fertiliserId}
                onClick={() => {
                  applyFertiliser(tree.id, fertiliserId);
                  onClose();
                }}
                title={label}
                type="button"
              >
                <FertiliserBtnInner>
                  <span>
                    {label} ×{count}
                  </span>
                  <FertiliserEffect>{effectDesc}</FertiliserEffect>
                </FertiliserBtnInner>
              </PickerBtn>
            );
          })}
        </PickerGrid>
      )}
    </PickerPanel>
  );
}

// ─── Active Fertiliser Status ─────────────────────────────────────────────────

function ActiveFertiliserStatus({ tree }: { tree: BonsaiTree }) {
  const { growthTonic, moistureKeeper } = tree.activeFertilisers ?? {};
  if (!(growthTonic || moistureKeeper)) return null;

  return (
    <FertiliserStatus>
      {growthTonic && tree.activeDaysCount < growthTonic.expiresAtDay && (
        <FertiliserTag data-type="growth">
          <YellowDot />
          Growth Tonic ·{" "}
          {Math.ceil(growthTonic.expiresAtDay - tree.activeDaysCount)} days left
        </FertiliserTag>
      )}
      {moistureKeeper && tree.activeDaysCount < moistureKeeper.expiresAtDay && (
        <FertiliserTag data-type="moisture">
          <BlueDot />
          Moisture Keeper ·{" "}
          {Math.ceil(moistureKeeper.expiresAtDay - tree.activeDaysCount)} days
          left
        </FertiliserTag>
      )}
    </FertiliserStatus>
  );
}

// ─── Tool Bar ─────────────────────────────────────────────────────────────────

function TreeToolBar({
  activeTool,
  onSetTool,
  onNavigateToShop,
}: {
  activeTool: ActiveTool;
  onSetTool: (tool: ActiveTool) => void;
  onNavigateToShop: (itemId: string) => void;
}) {
  const { state } = useBonsai();
  const ownedTools = state.inventory.ownedToolIds;
  const hasWateringCan = ownedTools.includes("watering-can");
  const hasPruningShears = ownedTools.includes("pruning-shears");

  return (
    <ToolBar>
      {hasWateringCan ? (
        <ToolBtn
          data-active={activeTool === "watering-can" || undefined}
          onClick={() => onSetTool("watering-can")}
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
          onClick={() => onSetTool("pruning-shears")}
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
  );
}

// ─── Accessory Bar ────────────────────────────────────────────────────────────

type AccessoryPanel = "pot" | "stand" | "fertiliser" | null;

function AccessoryBarRow({
  openPanel,
  onTogglePanel,
  onNavigateToShop,
}: {
  openPanel: AccessoryPanel;
  onTogglePanel: (panel: AccessoryPanel) => void;
  onNavigateToShop: (itemId: string) => void;
}) {
  const { state } = useBonsai();
  const hasPots = state.inventory.ownedPotIds.length > 0;
  const hasStands = state.inventory.ownedStandIds.length > 0;
  const hasFertiliser = state.inventory.ownedFertiliserIds.length > 0;

  return (
    <AccessoryBar>
      {hasPots ? (
        <AccessoryBtn
          data-active={openPanel === "pot" || undefined}
          onClick={() => onTogglePanel("pot")}
          title="Change Pot"
          type="button"
        >
          <Square size={13} />
          Pot
        </AccessoryBtn>
      ) : (
        <LockedToolBtn
          onClick={() => onNavigateToShop("simple-clay-small")}
          title="Buy a Pot"
          type="button"
        >
          <Square size={13} />
          Pot
          <ToolPrice>
            <Coins size={12} />
            From {CHEAPEST_POT_PRICE}
          </ToolPrice>
        </LockedToolBtn>
      )}
      {hasStands ? (
        <AccessoryBtn
          data-active={openPanel === "stand" || undefined}
          onClick={() => onTogglePanel("stand")}
          title="Change Stand"
          type="button"
        >
          <Sprout size={13} />
          Stand
        </AccessoryBtn>
      ) : (
        <LockedToolBtn
          onClick={() => onNavigateToShop("bamboo-mat-small")}
          title="Buy a Stand"
          type="button"
        >
          <Sprout size={13} />
          Stand
          <ToolPrice>
            <Coins size={12} />
            From {CHEAPEST_STAND_PRICE}
          </ToolPrice>
        </LockedToolBtn>
      )}
      {hasFertiliser ? (
        <AccessoryBtn
          data-active={openPanel === "fertiliser" || undefined}
          onClick={() => onTogglePanel("fertiliser")}
          title="Apply Fertiliser"
          type="button"
        >
          <FlaskConical size={13} />
          Fertilise
        </AccessoryBtn>
      ) : (
        <LockedToolBtn
          onClick={() => onNavigateToShop("moisture-keeper-small")}
          title="Buy Fertiliser"
          type="button"
        >
          <FlaskConical size={13} />
          Fertilise
          <ToolPrice>
            <Coins size={12} />
            From {CHEAPEST_FERTILISER_PRICE}
          </ToolPrice>
        </LockedToolBtn>
      )}
    </AccessoryBar>
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
  const [activeTool, setActiveTool] = useState<ActiveTool>("watering-can");
  const [openPanel, setOpenPanel] = useState<AccessoryPanel>(null);

  const config = SPECIES_CONFIG[tree.speciesId];
  const isWateredToday = tree.lastWateredDay === tree.activeDaysCount;

  const handleSetTool = (tool: ActiveTool) => {
    setActiveTool(tool);
    setOpenPanel(null);
  };

  const togglePanel = (panel: AccessoryPanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <TreeViewWrapper>
      <TreeLabel>
        {config.emoji} {tree.name ?? config.label}
      </TreeLabel>

      <TreeToolBar
        activeTool={activeTool}
        onNavigateToShop={onNavigateToShop}
        onSetTool={handleSetTool}
      />

      <AccessoryBarRow
        onNavigateToShop={onNavigateToShop}
        onTogglePanel={togglePanel}
        openPanel={openPanel}
      />

      {openPanel === "pot" && (
        <PotPicker onClose={() => setOpenPanel(null)} tree={tree} />
      )}
      {openPanel === "stand" && (
        <StandPicker onClose={() => setOpenPanel(null)} tree={tree} />
      )}
      {openPanel === "fertiliser" && (
        <FertiliserPicker onClose={() => setOpenPanel(null)} tree={tree} />
      )}

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

      <ActiveFertiliserStatus tree={tree} />
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
  flex-wrap: wrap;
  justify-content: center;
`;

const AccessoryBar = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
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

const AccessoryBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.8rem;
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
    border-color: light-dark(#b89a50, #9a7a30);
    background: light-dark(#fdf5e0, #2a2010);
    color: light-dark(#7a5a10, #d4a840);
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

// ─── Picker Styles ────────────────────────────────────────────────────────────

const PickerPanel = styled.div`
  width: 100%;
  background: light-dark(#f8f5f0, #252830);
  border: 1px solid light-dark(#d4c9b8, #3a3f4a);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const PickerTitle = styled.p`
  font-size: 0.8rem;
  font-weight: 600;
  color: light-dark(#7a6a58, #8a8898);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const PickerGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const PickerEmpty = styled.p`
  font-size: 0.85rem;
  color: light-dark(#9a8878, #6a7080);
  margin: 0;
  font-style: italic;
`;

const PickerBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-family: inherit;
  border: 1.5px solid light-dark(#d4c9b8, #3a3f4a);
  background: transparent;
  color: light-dark(#5a5048, #9a9888);
  cursor: pointer;
  text-align: left;
  transition: background 0.12s, border-color 0.12s;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &[data-active] {
    border-color: light-dark(#7a9e6a, #5a8a4a);
    background: light-dark(#f0f5ed, #1e3020);
    color: light-dark(#3a5a2a, #8ab870);
    font-weight: 600;
  }

  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not([data-active]):not([data-disabled]) {
    background: light-dark(#f0ece6, #2a2f3a);
    border-color: light-dark(#b8a898, #5a6070);
  }
`;

const EquippedTag = styled.span`
  font-size: 0.75rem;
  color: light-dark(#5a8a4a, #7ab860);
  font-weight: 600;
  flex-shrink: 0;
`;

const UnavailableTag = styled.span`
  font-size: 0.75rem;
  color: light-dark(#9a8878, #6a7080);
  flex-shrink: 0;
`;

const FertiliserBtnInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const FertiliserEffect = styled.span`
  font-size: 0.75rem;
  color: light-dark(#9a8878, #6a7080);
`;

// ─── Fertiliser Status ────────────────────────────────────────────────────────

const FertiliserStatus = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  width: 100%;
`;

const FertiliserTag = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  background: light-dark(#f8f5f0, #252830);
  border: 1px solid light-dark(#e0d8d0, #3a3f4a);
  color: light-dark(#6a6058, #9a9888);
`;

const YellowDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
`;

const BlueDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
`;
