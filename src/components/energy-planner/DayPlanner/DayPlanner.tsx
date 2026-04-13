"use client";

import {
  DndContext,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Pencil, Plus } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { QUERIES } from "@/lib/constants";
import type { Activity } from "../../../lib/energy-planner/schema";
import { AvailableActivitiesModal } from "../AvailableActivitiesModal";
import { DateSelector } from "../DateSelector";
import { DayPlannerSkeleton } from "../DayPlannerSkeleton";
import { PlannedActivityCard } from "../PlannerActivityCard";
import { UncompletedActivityCard } from "../UncompletedActivityCard";
import { ZoneManagerModal } from "../ZoneManagerModal";
import { ZoneSection } from "../ZoneSection";
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

export function DayPlanner({
  onEditActivity,
  onOpenCreateActivity,
  onOpenCapacityModal,
}: DayPlannerProps) {
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
    warning,
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

      <UsageSection>
        <VisuallyHidden asChild>
          <caption>Energy Usage vs Capacity</caption>
        </VisuallyHidden>
        <VisuallyHidden asChild>
          <thead>
            <tr>
              <th scope="col">Energy Type</th>
              <th scope="col">Usage</th>
            </tr>
          </thead>
        </VisuallyHidden>
        <tbody>
          {energyTypes.map((type) => {
            const used = usage[type.id] || 0;
            const cap = dailyCapacity[type.id] || 0;
            const isOver = used > cap && cap > 0;
            const usagePercent = Math.min(used, 100);
            const capacityPercent = Math.min(cap, 100);

            return (
              <UsageRow key={type.id}>
                <UsageLabel>{type.label}</UsageLabel>
                <UsageValue>
                  <Track>
                    {/* Capacity bar — subtler, behind usage */}
                    <CapacityFill
                      $color={type.color}
                      $percent={capacityPercent}
                    />
                    {/* Usage bar — solid, on top */}
                    <Fill $color={type.color} $percent={usagePercent} />
                  </Track>
                  <UsageText $isOver={isOver}>
                    {used} / {cap}
                  </UsageText>
                </UsageValue>
              </UsageRow>
            );
          })}
        </tbody>
      </UsageSection>

      {viewingToday && warning.exceeded ? (
        <Warning>{warning.message}</Warning>
      ) : null}

      {viewedUncompletedActivities.length > 0 ? (
        <UncompletedSection data-testid="uncompleted-activities">
          <UncompletedHeader>
            Uncompleted Activities ({viewedUncompletedActivities.length})
          </UncompletedHeader>
          <UncompletedList>
            {viewedUncompletedActivities.map(
              ({ activity, instanceId, fromDate }) => (
                <UncompletedActivityCard
                  activity={activity}
                  fromDate={fromDate}
                  instanceId={instanceId}
                  key={`${instanceId}-${fromDate}`}
                />
              ),
            )}
          </UncompletedList>
        </UncompletedSection>
      ) : null}

      <SelectedSection>
        <DndContext
          collisionDetection={rectIntersection}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          sensors={sensors}
        >
          <ZonesContainer data-testid="selected-activities">
            {zones.map((zone) => (
              <ZoneSection
                activities={activitiesByZone.get(zone.id) ?? []}
                dayContext={dayContext}
                key={zone.id}
                onAddActivity={() => handleOpenModalForZone(zone.id)}
                onEditActivity={onEditActivity}
                onManageZones={handleManageZones}
                onMove={moveActivityToDate}
                onRemove={removeFromPlan}
                onToggleCompletion={toggleActivityCompletion}
                zone={zone}
              />
            ))}
          </ZonesContainer>
          <DragOverlay>
            {activeResolved ? (
              <PlannedActivityCard
                activity={activeResolved.activity}
                completed={activeResolved.instance.completed}
                dayContext={dayContext}
                dragHandleProps={{
                  listeners: {} as DraggableSyntheticListeners,
                  attributes: {} as DraggableAttributes,
                  ref: () => {},
                }}
                instance={activeResolved.instance}
                onEdit={onEditActivity}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </SelectedSection>

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
      />

      <ZoneManagerModal
        isOpen={isZoneManagerOpen}
        onAddZone={addZone}
        onClose={handleCloseZoneManager}
        onRemoveZone={removeZone}
        onReorderZones={reorderZones}
        onUpdateZone={updateZone}
        zones={zones}
      />
    </Container>
  );
}

const DateSelectorRow = styled.div`
  margin-bottom: 8px;
`;

const UsageSection = styled.table`
  isolation: isolate;
`;

const UsageRow = styled.tr`
  display: flex;
  align-items: center;
  gap: 12px;

  &:not(:last-child) {
    margin-bottom: 12px;
  }
`;

const UsageLabel = styled.td`
  display: inline-block;
  width: 80px;
  font-size: 0.875rem;
  font-weight: 500;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
`;

const UsageValue = styled.td`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const Track = styled.div`
  flex: 1;
  height: 14px;
  background-color: light-dark(var(--color-grey-200), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 7px;
  position: relative;
  overflow: hidden;
`;

const Fill = styled.div<{ $color: string; $percent: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  transform: scaleX(${({ $percent }) => $percent / 100});
  transform-origin: left;
  background-color: ${({ $color }) => $color};
  border-radius: 7px;
  transition: transform 0.3s ease;
  z-index: 2;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const CapacityFill = styled.div<{ $color: string; $percent: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  /* Diagonal stripes clearly distinguish capacity ceiling from solid usage */
  background-image: repeating-linear-gradient(
    -45deg,
    ${({ $color }) => $color} 0px,
    ${({ $color }) => $color} 3px,
    transparent 3px,
    transparent 8px
  );
  opacity: 0.55;
  border-radius: 7px;
  transition: transform 0.3s ease;
  z-index: 1;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const UsageText = styled.div<{ $isOver: boolean }>`
  width: 60px;
  text-align: right;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  font-weight: ${({ $isOver }) => ($isOver ? "700" : "500")};
  color: ${({ $isOver }) =>
    $isOver
      ? "light-dark(var(--color-orange-700), var(--color-orange-400))"
      : "light-dark(var(--color-grey-700), var(--color-grey-300))"};
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

const Warning = styled.div`
  background-color: light-dark(var(--color-orange-50), oklch(25% 0.05 50));
  color: light-dark(var(--color-orange-900), var(--color-orange-50));
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.875rem;
  border: 1px solid var(--color-orange-300);
`;

const UncompletedSection = styled.section`
  background-color: light-dark(var(--color-orange-50), oklch(25% 0.05 50));
  border: 1px solid var(--color-orange-300);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const UncompletedHeader = styled.h3`
  color: light-dark(var(--color-orange-900), var(--color-orange-100));
  margin-bottom: 12px;
  font-size: 0.95rem;
`;

const UncompletedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SelectedSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ZonesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-inline: -12px;
`;
