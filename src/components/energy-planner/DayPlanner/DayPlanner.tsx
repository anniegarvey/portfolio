"use client";

import { Coins, Leaf, Pencil, Plus, TreePine, X as XIcon } from "lucide-react";
import Link from "next/link";
import { styled } from "next-yak";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { WellnessCheckCard } from "@/components/energy-planner/WellnessCheckCard";
import { WellnessConfigModal } from "@/components/energy-planner/WellnessConfigModal";
import { QUERIES } from "@/lib/constants";
import { WellnessCheckContext } from "@/lib/wellness/context";
import type { Activity } from "../../../lib/energy-planner/schema";
import { AvailableActivitiesModal } from "../AvailableActivitiesModal";
import { DateSelector } from "../DateSelector";
import { DayPlannerSkeleton } from "../DayPlannerSkeleton";
import { ZoneManagerModal } from "../ZoneManagerModal";
import { EnergyUsageTable } from "./EnergyUsageTable";
import { PlannedActivitiesDndSection } from "./PlannedActivitiesDndSection";
import { UncompletedActivitiesSection } from "./UncompletedActivitiesSection";
import { useDayPlannerState } from "./useDayPlannerState";

interface DayPlannerProps {
  onEditActivity: (activity: Activity) => void;
  onOpenCreateActivity: (
    context?: { date: string; zoneId?: string },
    onCreated?: () => void,
    onCreatedWithType?: (type: "one-off" | "repeating") => void,
  ) => void;
  onOpenCapacityModal?: () => void;
}

function WellnessSection({ onOpenConfig }: { onOpenConfig: () => void }) {
  const ctx = use(WellnessCheckContext);
  const [isAmending, setIsAmending] = useState(false);
  const [showUndo, setShowUndo] = useState(false);

  useEffect(() => {
    if (!showUndo) return;
    const timer = setTimeout(() => setShowUndo(false), 5000);
    return () => clearTimeout(timer);
  }, [showUndo]);

  if (!ctx || ctx.isLoading) return null;

  if (ctx.isPending) {
    return (
      <WellnessCheckCard
        onOpenConfig={onOpenConfig}
        onOptOut={() => setShowUndo(true)}
      />
    );
  }

  if (isAmending) {
    return (
      <WellnessCheckCard
        initialEntry={ctx.currentPeriodEntry}
        onSave={() => setIsAmending(false)}
      />
    );
  }

  if (showUndo) {
    return (
      <WellnessUndoBanner role="status">
        <span>Wellness checks turned off.</span>
        <WellnessUndoActions>
          <Button
            onClick={async () => {
              await ctx.enableCheck();
              setShowUndo(false);
            }}
            size="sm"
            variant="outline"
          >
            Undo
          </Button>
          <Button
            aria-label="Dismiss"
            intent="secondary"
            onClick={() => setShowUndo(false)}
            size="icon"
            variant="ghost"
          >
            <XIcon size={14} />
          </Button>
        </WellnessUndoActions>
      </WellnessUndoBanner>
    );
  }

  if (ctx.currentPeriodEntry && ctx.config.enabled) {
    return (
      <WellnessAmendButton onClick={() => setIsAmending(true)} type="button">
        Edit today&apos;s check
      </WellnessAmendButton>
    );
  }

  return null;
}

function RewardDestinationsTip() {
  return (
    <TipRoot>
      <TipIntro>
        <Coins aria-hidden size={13} />
        Earn points here — spend them on:
      </TipIntro>
      <TipCards>
        <TipCard
          $accent="secondary"
          aria-label="Visit Bonsai Garden"
          href="/bonsai"
        >
          <TipCardTitle>
            <Leaf aria-hidden size={14} />
            Bonsai Garden
          </TipCardTitle>
          <TipCardDesc>
            Buy seeds, tools, pots, and backgrounds to grow your garden.
          </TipCardDesc>
          <TipCardCta aria-hidden>Visit →</TipCardCta>
        </TipCard>
        <TipCard $accent="teal" aria-label="Visit The Glade" href="/glade">
          <TipCardTitle>
            <TreePine aria-hidden size={14} />
            The Glade
          </TipCardTitle>
          <TipCardDesc>
            Adopt creature residents that forage, soothe, and attract visitors.
          </TipCardDesc>
          <TipCardCta aria-hidden>Visit →</TipCardCta>
        </TipCard>
      </TipCards>
    </TipRoot>
  );
}

export function DayPlanner({
  onEditActivity,
  onOpenCreateActivity,
  onOpenCapacityModal,
}: DayPlannerProps) {
  const wellnessCtx = use(WellnessCheckContext);

  const {
    isLoading,
    currentDate,
    goToToday,
    goToNextDay,
    goToPreviousDay,
    viewingToday,
    dayContext,
    resolvedActivities,
    availableActivities,
    repeatingActivities,
    viewedUncompletedActivities,
    energyTypes,
    usage,
    capacityWarnings,
    dailyCapacity,
    zones,
    activitiesByZone,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    removeActivity,
    removeFromPlan,
    toggleActivityCompletion,
    moveActivityToDate,
    reorderActivities,
    reorderRepeatingActivities,
    isModalOpen,
    isZoneManagerOpen,
    activeResolved,
    sensors,
    handleOpenManageActivities,
    handleCloseModal,
    handleOpenModalForZone,
    handleAddToPlanForZone,
    handleManageZones,
    handleCloseZoneManager,
    handleCreateActivity,
    handleDragStart,
    handleDragEnd,
  } = useDayPlannerState({ onOpenCreateActivity });

  const [isWellnessConfigOpen, setIsWellnessConfigOpen] = useState(false);

  if (isLoading) {
    return <DayPlannerSkeleton />;
  }

  return (
    <Container>
      <DateSelectorRow>
        <DateSelector
          currentDate={currentDate}
          onGoToToday={goToToday}
          onNextDay={goToNextDay}
          onPreviousDay={goToPreviousDay}
          viewingToday={viewingToday}
        />
      </DateSelectorRow>

      <Header>
        <h2>Your Day Plan ({resolvedActivities.length})</h2>
        <ButtonGroup>
          <Button
            intent="secondary"
            leftIcon={<Pencil size={14} />}
            onClick={onOpenCapacityModal}
            variant="outline"
          >
            Edit Capacity
          </Button>
          <Button
            leftIcon={<Plus size={16} />}
            onClick={handleOpenManageActivities}
          >
            Manage Activities
          </Button>
        </ButtonGroup>
      </Header>

      <EnergyUsageTable
        dailyCapacity={dailyCapacity}
        energyTypes={energyTypes}
        usage={usage}
      />

      {viewingToday && capacityWarnings.length > 0 ? (
        <Warning>
          Warning: You have exceeded your {capacityWarnings.join(", ")} energy
          capacity!
        </Warning>
      ) : null}

      <UncompletedActivitiesSection activities={viewedUncompletedActivities} />

      <WellnessSection onOpenConfig={() => setIsWellnessConfigOpen(true)} />

      <PlannedActivitiesDndSection
        activeResolved={activeResolved}
        activitiesByZone={activitiesByZone}
        dayContext={dayContext}
        onAddActivity={handleOpenModalForZone}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onEditActivity={onEditActivity}
        onManageZones={handleManageZones}
        onMove={moveActivityToDate}
        onRemove={removeFromPlan}
        onToggleCompletion={toggleActivityCompletion}
        sensors={sensors}
        zones={zones}
      />

      <AvailableActivitiesModal
        availableActivities={availableActivities}
        isOpen={isModalOpen}
        onAddActivity={handleAddToPlanForZone}
        onClose={handleCloseModal}
        onDeleteActivity={removeActivity}
        onEditActivity={onEditActivity}
        onOpenCreateActivity={handleCreateActivity}
        onReorderActivities={reorderActivities}
        onReorderRepeatingActivities={reorderRepeatingActivities}
        repeatingActivities={repeatingActivities}
        zones={zones}
      />

      <RewardDestinationsTip />

      <ZoneManagerModal
        isOpen={isZoneManagerOpen}
        onAddZone={addZone}
        onClose={handleCloseZoneManager}
        onRemoveZone={removeZone}
        onReorderZones={reorderZones}
        onUpdateZone={updateZone}
        zones={zones}
      />

      {wellnessCtx && (
        <WellnessConfigModal
          isOpen={isWellnessConfigOpen}
          onClose={() => setIsWellnessConfigOpen(false)}
        />
      )}
    </Container>
  );
}

const DateSelectorRow = styled.div`
  margin-bottom: 8px;
`;

const Container = styled.section`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-950));
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-inline: -32px;
  padding-inline: 16px;
  border-radius: 0;

  @media (${QUERIES.PHABLET_UP}) {
    margin-inline: 0;
    padding-inline: 24px;
    border-radius: 8px;
    border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;

  @media (${QUERIES.TABLET_UP}) {
    flex-direction: row;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const WellnessUndoBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background-color: light-dark(var(--color-grey-100), oklch(22% 0.02 270));
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-700));
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 0.875rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const WellnessUndoActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const WellnessAmendButton = styled.button`
  background: none;
  border: none;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  align-self: flex-start;

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const Warning = styled.div`
  background-color: light-dark(var(--color-orange-50), oklch(25% 0.05 50));
  color: light-dark(var(--color-orange-900), var(--color-orange-50));
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  border: 1px solid var(--color-orange-300);
`;

const TipRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TipIntro = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-points);
`;

const TipCards = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const TipCard = styled(Link)<{ $accent: "secondary" | "teal" }>`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 14px;
  border-radius: 8px;
  text-decoration: none;
  border: 1px solid
    ${({ $accent }) =>
      $accent === "secondary"
        ? "color-mix(in oklch, var(--color-secondary-500) 30%, transparent)"
        : "color-mix(in oklch, var(--color-teal-500) 30%, transparent)"};
  background: ${({ $accent }) =>
    $accent === "secondary"
      ? "color-mix(in oklch, var(--color-secondary-500) 7%, transparent)"
      : "color-mix(in oklch, var(--color-teal-500) 7%, transparent)"};
  color: ${({ $accent }) =>
    $accent === "secondary"
      ? "light-dark(var(--color-secondary-900), var(--color-secondary-300))"
      : "light-dark(var(--color-teal-900), var(--color-teal-300))"};
  @media (prefers-reduced-motion: no-preference) {
    transition: opacity 0.15s;
  }

  &:hover {
    opacity: 0.8;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;

const TipCardTitle = styled.div`
  font-weight: 700;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const TipCardDesc = styled.div`
  font-size: 0.75rem;
  line-height: 1.4;
`;

const TipCardCta = styled.div`
  margin-top: 3px;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;
