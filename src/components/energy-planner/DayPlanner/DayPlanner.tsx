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
import type { PlannedTask, Task } from "../../../lib/energy-planner/schema";
import { AvailableTasksModal } from "../AvailableTasksModal";
import { Button } from "../common";
import { PlannerTaskCard } from "../PlannerTaskCard";
import { UncompletedTaskCard } from "../UncompletedTaskCard";
import { ZoneManagerModal } from "../ZoneManagerModal";
import { ZoneSection } from "../ZoneSection";

interface DayPlannerProps {
  onEditTask: (task: Task) => void;
  onOpenCreateTask: (context?: { date: string; zoneId?: string }) => void;
}

export function DayPlanner({ onEditTask, onOpenCreateTask }: DayPlannerProps) {
  const {
    currentDate,
    dayPlan,
    addToPlan,
    removeFromPlan,
    removeTask,
    toggleTaskCompletion,
    checkExceedsCapacity,
    calculateEnergyUsage,
    energyTypes,
    uncompletedTasks,
    availableTasks,
    repeatingTasks,
    reorderPlannedTasks,
    reorderTasks,
    zones,
    assignTaskToZone,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
  } = useEnergyPlanner();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<PlannedTask | null>(null);

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
  const viewedUncompletedTasks = viewingToday ? uncompletedTasks : [];

  const selectedTasks = dayPlan.tasks ?? [];

  // Group tasks by zone
  const tasksByZone = useMemo(() => {
    const grouped = new Map<string, PlannedTask[]>();

    // Initialize all zones with empty arrays
    for (const zone of zones) {
      grouped.set(zone.id, []);
    }

    // Assign tasks to their zones
    for (const task of selectedTasks) {
      const zoneId = task.zoneId ?? zones[0]?.id;
      if (zoneId && grouped.has(zoneId)) {
        grouped.get(zoneId)?.push(task);
      } else if (zones[0]) {
        // Fallback to first zone if zone doesn't exist
        grouped.get(zones[0].id)?.push(task);
      }
    }

    return grouped;
  }, [selectedTasks, zones]);

  const handleAddToPlanForZone = (taskId: string) => {
    if (activeZoneId) {
      addToPlan(taskId, activeZoneId);
    } else {
      addToPlan(taskId);
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
    const task = selectedTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const findZoneForTask = (taskId: string): string | null => {
    for (const zone of zones) {
      const zoneTasks = tasksByZone.get(zone.id) ?? [];
      if (zoneTasks.some((t) => t.id === taskId)) {
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
    // Check if dropping on a task within a zone
    return findZoneForTask(overId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceZoneId = findZoneForTask(activeId);
    const targetZoneId = getTargetZoneId(overId);

    // Move task to new zone if zones differ
    if (targetZoneId && sourceZoneId !== targetZoneId) {
      assignTaskToZone(activeId, targetZoneId);
    }

    // Handle reordering
    if (activeId !== overId) {
      const newItems = getReorderedItems(selectedTasks, event, (t) => t.id);
      if (newItems) {
        reorderPlannedTasks(newItems.map((t) => t.id));
      }
    }
  };

  const handleManageZones = () => {
    setIsZoneManagerOpen(true);
  };

  const handleCreateTask = () => {
    // Pass current context (date and active zone)
    onOpenCreateTask({
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
          Manage Tasks
        </Button>
      </Header>
      {warning.exceeded && <Warning>{warning.message}</Warning>}

      {viewedUncompletedTasks.length > 0 && (
        <UncompletedSection data-testid="uncompleted-tasks">
          <UncompletedHeader>
            Uncompleted Tasks ({viewedUncompletedTasks.length})
          </UncompletedHeader>
          <UncompletedList>
            {viewedUncompletedTasks.map(({ task, fromDate }) => (
              <UncompletedTaskCard
                fromDate={fromDate}
                key={`${task.id}-${fromDate}`}
                task={task}
              />
            ))}
          </UncompletedList>
        </UncompletedSection>
      )}

      <SelectedSection>
        <ColumnHeader>
          <h3>Selected Tasks ({selectedTasks.length})</h3>
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
          <ZonesContainer data-testid="selected-tasks">
            {zones.map((zone) => (
              <ZoneSection
                isFutureDay={currentDate > getTodayDateString()}
                isPastDay={currentDate < getTodayDateString()}
                key={zone.id}
                onAddTask={() => handleOpenModalForZone(zone.id)}
                onEditTask={onEditTask}
                onManageZones={handleManageZones}
                onRemove={removeFromPlan}
                onToggleCompletion={toggleTaskCompletion}
                tasks={tasksByZone.get(zone.id) ?? []}
                zone={zone}
              />
            ))}
          </ZonesContainer>
          <DragOverlay>
            {activeTask ? (
              <PlannerTaskCard
                completed={activeTask.completed}
                dragHandleProps={{
                  listeners: {} as DraggableSyntheticListeners,
                  attributes: {} as DraggableAttributes,
                  ref: () => {},
                }}
                isFutureDay={currentDate > getTodayDateString()}
                isPastDay={!viewingToday}
                onEdit={onEditTask}
                selected
                task={activeTask}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </SelectedSection>

      <AvailableTasksModal
        availableTasks={availableTasks}
        isOpen={isModalOpen}
        onAddTask={handleAddToPlanForZone}
        onClose={() => {
          setIsModalOpen(false);
          setActiveZoneId(null);
        }}
        onDeleteTask={removeTask}
        onEditTask={onEditTask}
        onOpenCreateTask={handleCreateTask}
        onReorderTasks={reorderTasks}
        repeatingTasks={repeatingTasks}
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
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
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
