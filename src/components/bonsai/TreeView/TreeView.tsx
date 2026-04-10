"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDown,
  Coins,
  Droplets,
  FlaskConical,
  Lock,
  Scissors,
  ShoppingBag,
  Sprout,
  Square,
} from "lucide-react";
import { keyframes, styled } from "next-yak";
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

// ─── Pot Dropdown ─────────────────────────────────────────────────────────────

function PotDropdown({
  tree,
  onNavigateToShop,
}: {
  tree: BonsaiTree;
  onNavigateToShop: (itemId: string) => void;
}) {
  const { state, equipPot } = useBonsai();
  const ownedPotIds = state.inventory.ownedPotIds;

  if (ownedPotIds.length === 0) {
    return (
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
    );
  }

  const equippedByOthers = state.trees
    .filter((t) => t.id !== tree.id)
    .flatMap((t) => (t.equippedPotId ? [t.equippedPotId] : []));
  const uniquePots = [...new Set(ownedPotIds)];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <AccessoryBtn title="Change Pot" type="button">
          <Square size={13} />
          Pot
          <ChevronDown size={11} />
        </AccessoryBtn>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownContent align="start" sideOffset={4}>
          <DropdownLabel>Choose a Pot</DropdownLabel>
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
              <DropdownItem
                data-active={isEquipped || undefined}
                disabled={!(available || isEquipped)}
                key={potId}
                onSelect={() => equipPot(tree.id, potId)}
              >
                {label}
                {isEquipped && <EquippedTag>Equipped</EquippedTag>}
                {!(available || isEquipped) && (
                  <UnavailableTag>In use</UnavailableTag>
                )}
              </DropdownItem>
            );
          })}
          <DropdownSeparator />
          <DropdownItem onSelect={() => onNavigateToShop("simple-clay-small")}>
            <ShoppingBag size={12} />
            Buy more in shop
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Stand Dropdown ───────────────────────────────────────────────────────────

function StandDropdown({
  tree,
  onNavigateToShop,
}: {
  tree: BonsaiTree;
  onNavigateToShop: (itemId: string) => void;
}) {
  const { state, equipStand, unequipStand } = useBonsai();
  const ownedStandIds = state.inventory.ownedStandIds;

  if (ownedStandIds.length === 0) {
    return (
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
    );
  }

  const equippedByOthers = state.trees
    .filter((t) => t.id !== tree.id)
    .flatMap((t) => (t.equippedStandId ? [t.equippedStandId] : []));
  const uniqueStands = [...new Set(ownedStandIds)];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <AccessoryBtn title="Change Stand" type="button">
          <Sprout size={13} />
          Stand
          <ChevronDown size={11} />
        </AccessoryBtn>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownContent align="start" sideOffset={4}>
          <DropdownLabel>Choose a Stand</DropdownLabel>
          <DropdownItem
            data-active={!tree.equippedStandId || undefined}
            onSelect={() => unequipStand(tree.id)}
          >
            No stand
            {!tree.equippedStandId && <EquippedTag>Equipped</EquippedTag>}
          </DropdownItem>
          {uniqueStands.map((standId) => {
            const countOwned = ownedStandIds.filter(
              (s) => s === standId,
            ).length;
            const countUsedElsewhere = equippedByOthers.filter(
              (s) => s === standId,
            ).length;
            const available = countOwned - countUsedElsewhere > 0;
            const isEquipped = tree.equippedStandId === standId;
            const label =
              SHOP_CATALOG.find((i) => i.id === standId)?.label ?? standId;

            return (
              <DropdownItem
                data-active={isEquipped || undefined}
                disabled={!(available || isEquipped)}
                key={standId}
                onSelect={() => equipStand(tree.id, standId)}
              >
                {label}
                {isEquipped && <EquippedTag>Equipped</EquippedTag>}
                {!(available || isEquipped) && (
                  <UnavailableTag>In use</UnavailableTag>
                )}
              </DropdownItem>
            );
          })}
          <DropdownSeparator />
          <DropdownItem onSelect={() => onNavigateToShop("bamboo-mat-small")}>
            <ShoppingBag size={12} />
            Buy more in shop
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ─── Fertiliser Dropdown ──────────────────────────────────────────────────────

function FertiliserDropdown({
  tree,
  onNavigateToShop,
}: {
  tree: BonsaiTree;
  onNavigateToShop: (itemId: string) => void;
}) {
  const { state, applyFertiliser } = useBonsai();
  const owned = state.inventory.ownedFertiliserIds;

  if (owned.length === 0) {
    return (
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
    );
  }

  const counts = owned.reduce<Record<string, number>>((acc, id) => {
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts) as [FertiliserId, number][];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <AccessoryBtn title="Apply Fertiliser" type="button">
          <FlaskConical size={13} />
          Fertilise
          <ChevronDown size={11} />
        </AccessoryBtn>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownContent align="start" sideOffset={4}>
          <DropdownLabel>Apply Fertiliser</DropdownLabel>
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
              <DropdownItem
                key={fertiliserId}
                onSelect={() => applyFertiliser(tree.id, fertiliserId)}
              >
                <FertiliserBtnInner>
                  <span>
                    {label} ×{count}
                  </span>
                  <FertiliserEffect>{effectDesc}</FertiliserEffect>
                </FertiliserBtnInner>
              </DropdownItem>
            );
          })}
          <DropdownSeparator />
          <DropdownItem
            onSelect={() => onNavigateToShop("moisture-keeper-small")}
          >
            <ShoppingBag size={12} />
            Buy more in shop
          </DropdownItem>
        </DropdownContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function TreeView({
  tree,
  onNavigateToShop,
}: {
  tree: BonsaiTree;
  onNavigateToShop: (itemId: string) => void;
}) {
  const [activeTool, setActiveTool] = useState<ActiveTool>("watering-can");

  const config = SPECIES_CONFIG[tree.speciesId];
  const isWateredToday = tree.lastWateredDay === tree.activeDaysCount;

  const handleSetTool = (tool: ActiveTool) => setActiveTool(tool);

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

      <AccessoryBar>
        <PotDropdown onNavigateToShop={onNavigateToShop} tree={tree} />
        <StandDropdown onNavigateToShop={onNavigateToShop} tree={tree} />
        <FertiliserDropdown onNavigateToShop={onNavigateToShop} tree={tree} />
      </AccessoryBar>

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

  &[data-state="open"] {
    border-color: light-dark(#b89a50, #9a7a30);
    background: light-dark(#fdf5e0, #2a2010);
    color: light-dark(#7a5a10, #d4a840);
    font-weight: 600;
  }

  &:hover:not([data-state="open"]) {
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

// ─── Dropdown Styles ──────────────────────────────────────────────────────────

const slideDownAndFade = keyframes`
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const DropdownContent = styled(DropdownMenu.Content)`
  z-index: 60;
  min-width: 180px;
  background: light-dark(#f8f5f0, #252830);
  border: 1px solid light-dark(#d4c9b8, #3a3f4a);
  border-radius: 8px;
  padding: 0.35rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  animation: ${slideDownAndFade} 120ms ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const DropdownLabel = styled(DropdownMenu.Label)`
  font-size: 0.72rem;
  font-weight: 600;
  color: light-dark(#7a6a58, #8a8898);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem 0.3rem;
`;

const DropdownItem = styled(DropdownMenu.Item)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  border-radius: 5px;
  font-size: 0.85rem;
  font-family: inherit;
  color: light-dark(#5a5048, #9a9888);
  cursor: pointer;
  outline: none;
  transition: background 0.1s;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  &[data-active] {
    color: light-dark(#3a5a2a, #8ab870);
    font-weight: 600;
  }

  &[data-disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &[data-highlighted]:not([data-disabled]) {
    background: light-dark(#f0ece6, #2a2f3a);
    color: light-dark(#3a3028, #c0b8a8);
  }

  &[data-active][data-highlighted] {
    background: light-dark(#e8f0e4, #1e3020);
    color: light-dark(#3a5a2a, #8ab870);
  }
`;

const DropdownSeparator = styled(DropdownMenu.Separator)`
  height: 1px;
  background: light-dark(#e8e0d4, #343840);
  margin: 0.3rem 0;
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
