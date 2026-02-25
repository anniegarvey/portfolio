"use client";

import {
  DndContext,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragOverEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Pencil, Plus } from "lucide-react";
import { styled } from "next-yak";
import { useMemo, useState } from "react";
import { getTodayDateString, isToday } from "@/hooks/utils";
import { QUERIES } from "@/lib/constants";
import { getReorderedItems } from "@/lib/energy-planner/utils";
import { useEnergyPlanner } from "../../../lib/energy-planner/context";
import type {
  Activity,
  PlannedActivity,
} from "../../../lib/energy-planner/schema";
import { AvailableActivitiesModal } from "../AvailableActivitiesModal";
import { Button } from "../common";
import { DateSelector } from "../DateSelector";
import { PlannerActivityCard } from "../PlannerActivityCard";
import { UncompletedActivityCard } from "../UncompletedActivityCard";
import { ZoneManagerModal } from "../ZoneManagerModal";
import { ZoneSection } from "../ZoneSection";

interface DayPlannerProps {
  onEditActivity: (activity: Activity) => void;
  onOpenCreateActivity: (
    context?: { date: string; zoneId?: string },
    onCreated?: () => void,
  ) => void;
  onOpenCapacityModal?: () => void;
}

export function DayPlanner({
  onEditActivity,
  onOpenCreateActivity,
  onOpenCapacityModal,
}: DayPlannerProps) {
  const {
    currentDate,
    goToToday: onGoToToday,
    goToNextDay: onNextDay,
    goToPreviousDay: onPreviousDay,
    dayPlan,
    addToPlan,
    removeFromPlan,
    removeActivity,
    toggleActivityCompletion,
    checkExceedsCapacity,
    calculateEnergyUsage,
    energyTypes,
    uncompletedActivities,
    availableActivities,
    repeatingActivities,
    reorderPlannedActivities,
    reorderActivities,
    reorderRepeatingActivities,
    zones,
    assignActivityToZone,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    moveActivityToDate,
    dailyCapacity,
  } = useEnergyPlanner();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<PlannedActivity | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const usage = calculateEnergyUsage();
  const warning = checkExceedsCapacity();
  const viewingToday = isToday(currentDate);
  const viewedUncompletedActivities = viewingToday ? uncompletedActivities : [];

  const selectedActivities = dayPlan.activities ?? [];

  // Group activities by zone
  const activitiesByZone = useMemo(() => {
    const grouped = new Map<string, PlannedActivity[]>();

    // Initialize all zones with empty arrays
    for (const zone of zones) {
      grouped.set(zone.id, []);
    }

    // Assign activities to their zones
    for (const activity of selectedActivities) {
      const zoneId = activity.zoneId ?? zones[0]?.id;
      if (zoneId && grouped.has(zoneId)) {
        grouped.get(zoneId)?.push(activity);
      } else if (zones[0]) {
        // Fallback to first zone if zone doesn't exist
        grouped.get(zones[0].id)?.push(activity);
      }
    }

    return grouped;
  }, [selectedActivities, zones]);

  const handleAddToPlanForZone = (activityId: string) => {
    if (activeZoneId) {
      addToPlan(activityId, activeZoneId);
    } else {
      addToPlan(activityId);
    }
    setIsModalOpen(false);
    setActiveZoneId(null);
  };

  const handleOpenModalForZone = (zoneId: string) => {
    setActiveZoneId(zoneId);
    setIsModalOpen(true);
  };

  const handleDragStart = (event: DragOverEvent) => {
    const { active } = event;
    const activity = selectedActivities.find((a) => a.id === active.id);
    if (activity) {
      setActiveActivity(activity);
    }
  };

  const findZoneForActivity = (activityId: string): string | null => {
    for (const zone of zones) {
      const zoneActivities = activitiesByZone.get(zone.id) ?? [];
      if (zoneActivities.some((a) => a.id === activityId)) {
        return zone.id;
      }
    }
    return null;
  };

  const getTargetZoneId = (overId: string): string | null => {
    // Check if dropping directly on a zone container
    const targetZone = zones.find((z) => z.id === overId);
    if (targetZone) {
      return targetZone.id;
    }
    // Check if dropping on a activity within a zone
    return findZoneForActivity(overId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveActivity(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceZoneId = findZoneForActivity(activeId);
    const targetZoneId = getTargetZoneId(overId);

    // Move activity to new zone if zones differ
    if (targetZoneId && sourceZoneId !== targetZoneId) {
      assignActivityToZone(activeId, targetZoneId);
    }

    // Handle reordering
    if (activeId !== overId) {
      const newItems = getReorderedItems(
        selectedActivities,
        event,
        (a) => a.id,
      );
      if (newItems) {
        reorderPlannedActivities(newItems.map((a) => a.id));
      }
    }
  };

  const handleManageZones = () => {
    setIsZoneManagerOpen(true);
  };

  const handleCreateActivity = () => {
    // Pass current context (date and active zone). If creating with a zone
    // context, also close this modal so the user immediately sees the new activity.
    const closeThisModal =
      activeZoneId != null
        ? () => {
            setIsModalOpen(false);
            setActiveZoneId(null);
          }
        : undefined;

    onOpenCreateActivity(
      { date: currentDate, zoneId: activeZoneId || undefined },
      closeThisModal,
    );
  };

  return (
    <Container>
      <DateSelectorRow>
        <DateSelector
          currentDate={currentDate}
          onGoToToday={onGoToToday}
          onNextDay={onNextDay}
          onPreviousDay={onPreviousDay}
          viewingToday={viewingToday}
        />
      </DateSelectorRow>

      <Header>
        <h2>Your Day Plan ({selectedActivities.length})</h2>
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
            onClick={() => setIsModalOpen(true)}
          >
            Manage Activities
          </Button>
        </ButtonGroup>
      </Header>

      <UsageSection>
        <UsageHeader>Energy Usage vs Capacity</UsageHeader>
        <UsageGrid>
          {energyTypes.map((type) => {
            const used = usage[type.id] || 0;
            const cap = dailyCapacity[type.id] || 0;
            const isOver = used > cap && cap > 0;
            // Both bars are expressed as % of 100 (max scale)
            const usagePercent = Math.min(used, 100);
            const capacityPercent = Math.min(cap, 100);

            return (
              <UsageRow key={type.id}>
                <UsageLabel>{type.label}</UsageLabel>
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
              </UsageRow>
            );
          })}
        </UsageGrid>
      </UsageSection>

      {warning.exceeded && <Warning>{warning.message}</Warning>}

      {viewedUncompletedActivities.length > 0 && (
        <UncompletedSection data-testid="uncompleted-activities">
          <UncompletedHeader>
            Uncompleted Activities ({viewedUncompletedActivities.length})
          </UncompletedHeader>
          <UncompletedList>
            {viewedUncompletedActivities.map(({ activity, fromDate }) => (
              <UncompletedActivityCard
                activity={activity}
                fromDate={fromDate}
                key={`${activity.id}-${fromDate}`}
              />
            ))}
          </UncompletedList>
        </UncompletedSection>
      )}

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
                isFutureDay={currentDate > getTodayDateString()}
                isPastDay={currentDate < getTodayDateString()}
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
            {activeActivity ? (
              <PlannerActivityCard
                activity={activeActivity}
                completed={activeActivity.completed}
                dragHandleProps={{
                  listeners: {} as DraggableSyntheticListeners,
                  attributes: {} as DraggableAttributes,
                  ref: () => {},
                }}
                isFutureDay={currentDate > getTodayDateString()}
                isPastDay={!viewingToday}
                onEdit={onEditActivity}
                onMove={moveActivityToDate}
                selected
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </SelectedSection>

      <AvailableActivitiesModal
        availableActivities={availableActivities}
        isOpen={isModalOpen}
        onAddActivity={handleAddToPlanForZone}
        onClose={() => {
          setIsModalOpen(false);
          setActiveZoneId(null);
        }}
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
        onClose={() => setIsZoneManagerOpen(false)}
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

const UsageSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
  isolation: isolate;
`;

const UsageHeader = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const UsageGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UsageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const UsageLabel = styled.div`
  width: 80px;
  font-size: 0.875rem;
  font-weight: 500;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
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
  width: ${({ $percent }) => $percent}%;
  background-color: ${({ $color }) => $color};
  border-radius: 7px;
  transition: width 0.3s ease;
  z-index: 2;
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
  transition: width 0.3s ease;
  z-index: 1;
`;

const UsageText = styled.div<{ $isOver: boolean }>`
  width: 60px;
  text-align: right;
  font-size: 0.8125rem;
  font-weight: ${({ $isOver }) => ($isOver ? "700" : "500")};
  color: ${({ $isOver }) =>
    $isOver
      ? "light-dark(var(--color-orange-700), var(--color-orange-400))"
      : "light-dark(var(--color-grey-700), var(--color-grey-300))"};
`;

const Container = styled.section`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-700));
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
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;

  h2 {
    color: light-dark(var(--color-grey-900), var(--color-grey-50));
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
`;
