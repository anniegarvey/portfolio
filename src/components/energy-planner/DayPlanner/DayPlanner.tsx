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
import { Plus } from "lucide-react";
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
import { PlannerActivityCard } from "../PlannerActivityCard";
import { UncompletedActivityCard } from "../UncompletedActivityCard";
import { ZoneManagerModal } from "../ZoneManagerModal";
import { ZoneSection } from "../ZoneSection";

interface DayPlannerProps {
  onEditActivity: (activity: Activity) => void;
  onOpenCreateActivity: (context?: { date: string; zoneId?: string }) => void;
}

export function DayPlanner({
  onEditActivity,
  onOpenCreateActivity,
}: DayPlannerProps) {
  const {
    currentDate,
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
    zones,
    assignActivityToZone,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
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
    // Pass current context (date and active zone)
    onOpenCreateActivity({
      date: currentDate,
      zoneId: activeZoneId || undefined,
    });
  };

  return (
    <Container>
      <Header>
        <h2>Your Day Plan</h2>
        <Button
          leftIcon={<Plus size={24} />}
          onClick={() => setIsModalOpen(true)}
        >
          Manage Activities
        </Button>
      </Header>
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
        <ColumnHeader>
          <h3>Selected Activities ({selectedActivities.length})</h3>
          <UsageSummary>
            Usage:{" "}
            {energyTypes.map((type) => (
              <span key={type.id}>
                {type.label.charAt(0)}:{usage[type.id] || 0}{" "}
              </span>
            ))}
          </UsageSummary>
        </ColumnHeader>

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

const Container = styled.section`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-700));
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-inline: -32px;
  padding-inline: 32px;
  border-radius: 0;

  @media (${QUERIES.PHABLET_UP}) {
    margin-inline: 0;
    padding-inline: 24px;
    border-radius: 8px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
`;

const Warning = styled.div`
  background-color: var(--color-orange-100);
  color: var(--color-orange-900);
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

const ColumnHeader = styled.div`
  font-weight: 600;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0 12px;

  @media (${QUERIES.PHABLET_UP}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding-inline: 0.5rem;
  }
`;

const UsageSummary = styled.span`
`;

const ZonesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
