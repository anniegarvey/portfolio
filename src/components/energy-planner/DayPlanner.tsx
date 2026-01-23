"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { isToday } from "@/hooks/utils";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Task } from "@/lib/energy-planner/schema";
import { getReorderedItems } from "@/lib/energy-planner/utils";
import { Modal } from "../Modal";
import { PlannerTaskCard } from "./PlannerTaskCard";
import { SortableItem } from "./SortableItem";
import { UncompletedTaskCard } from "./UncompletedTaskCard";

interface DayPlannerProps {
  onEditTask: (task: Task) => void;
  onOpenCreateTask: () => void;
}

export function DayPlanner({ onEditTask, onOpenCreateTask }: DayPlannerProps) {
  const {
    currentDate,
    dayPlan,
    addToPlan,
    removeFromPlan,
    toggleTaskCompletion,
    checkExceedsCapacity,
    calculateEnergyUsage,
    energyTypes,
    uncompletedTasks,
    availableTasks,
    reorderPlannedTasks,
    reorderTasks,
  } = useEnergyPlanner();

  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleAddToPlan = (taskId: string) => {
    addToPlan(taskId);
    setIsModalOpen(false);
  };

  const handleDragEndSelected = (event: DragEndEvent) => {
    const newItems = getReorderedItems(dayPlan.tasks ?? [], event, (t) => t.id);

    if (newItems) {
      reorderPlannedTasks(newItems.map((t) => t.id));
    }
  };

  const handleDragEndAvailable = (event: DragEndEvent) => {
    const newItems = getReorderedItems(availableTasks, event, (t) => t.id);

    if (newItems) {
      reorderTasks(newItems);
    }
  };

  return (
    <Container>
      <Header>
        <h2>Your Day Plan</h2>
        <ManageTasksButton onClick={() => setIsModalOpen(true)} type="button">
          <Plus size={24} />
          Manage Tasks
        </ManageTasksButton>
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
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEndSelected}
          sensors={sensors}
        >
          <SortableContext
            items={selectedTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <TaskList data-testid="selected-tasks">
              {selectedTasks.length === 0 && (
                <EmptyState>No tasks selected for this day.</EmptyState>
              )}
              {selectedTasks.map((task) => (
                <SortableItem id={task.id} key={task.id}>
                  <PlannerTaskCard
                    completed={task.completed}
                    isPastDay={!viewingToday}
                    onEdit={onEditTask}
                    onRemove={removeFromPlan}
                    onToggleCompletion={toggleTaskCompletion}
                    selected
                    task={task}
                  />
                </SortableItem>
              ))}
            </TaskList>
          </SortableContext>
        </DndContext>
      </SelectedSection>

      <Modal
        description="Manage your unplanned tasks."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Available Tasks"
      >
        <ModalContent>
          <ModalActions>
            <CreateTaskButton onClick={onOpenCreateTask} type="button">
              <Plus size={18} />
              New Task
            </CreateTaskButton>
          </ModalActions>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEndAvailable}
            sensors={sensors}
          >
            <SortableContext
              items={availableTasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {availableTasks.length === 0 ? (
                <ModalEmptyState>
                  No tasks available. Create a new task to get started!
                </ModalEmptyState>
              ) : (
                <ModalTaskList>
                  {availableTasks.map((task) => (
                    <SortableItem id={task.id} key={task.id}>
                      <PlannerTaskCard
                        onAdd={handleAddToPlan}
                        onEdit={onEditTask}
                        task={task}
                      />
                    </SortableItem>
                  ))}
                </ModalTaskList>
              )}
            </SortableContext>
          </DndContext>
        </ModalContent>
      </Modal>
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

const ManageTasksButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-primary-600);
  color: white;
  padding: 8px;
  padding-right: 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--color-primary-700);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: center;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--color-grey-200);
`;

const CreateTaskButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--color-primary-600);
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: var(--color-primary-700);
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
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  padding-left: 28px;
  padding-right: 32px;
`;

const UsageSummary = styled.span`
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 150px;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-900));
  padding: 16px;
  border-radius: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  color: var(--color-grey-400);
  font-style: italic;
  margin-top: 32px;
`;

const ModalContent = styled.div`
  min-height: 200px;
`;

const ModalEmptyState = styled.div`
  text-align: center;
  color: var(--color-grey-500);
  padding: 32px;
  font-style: italic;
`;

const ModalTaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
