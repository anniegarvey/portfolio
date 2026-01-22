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

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: React component with comprehensive JSX layout
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
        <HeaderLeft>
          <h3>Your Day Plan</h3>
          <ManageTasksButton onClick={() => setIsModalOpen(true)} type="button">
            <Plus size={16} />
            Manage Tasks
          </ManageTasksButton>
        </HeaderLeft>
        {warning.exceeded && <Warning>{warning.message}</Warning>}
      </Header>

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
                onEdit={onEditTask}
                task={task}
              />
            ))}
          </UncompletedList>
        </UncompletedSection>
      )}

      <SelectedSection>
        <ColumnHeader>
          <div>Selected Tasks ({selectedTasks.length})</div>
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
          <ModalActions>
            <CreateTaskButton onClick={onOpenCreateTask} type="button">
              <Plus size={18} />
              New Task
            </CreateTaskButton>
          </ModalActions>
        </ModalContent>
      </Modal>
    </Container>
  );
}

const Container = styled.div`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-top: 2rem;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const ManageTasksButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background-color: var(--color-primary-600);
  color: white;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
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
  justify-content: flex-end;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid var(--color-grey-200);
`;

const CreateTaskButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-primary-600);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
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
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Warning = styled.div`
  background-color: var(--color-orange-100);
  color: var(--color-orange-900);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: 1px solid var(--color-orange-300);
`;

const UncompletedSection = styled.div`
  background-color: light-dark(var(--color-orange-50), oklch(25% 0.05 50));
  border: 1px solid var(--color-orange-300);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const UncompletedHeader = styled.h4`
  color: var(--color-orange-900);
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
`;

const UncompletedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SelectedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ColumnHeader = styled.div`
  font-weight: 600;
  color: var(--color-grey-600);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UsageSummary = styled.span`
  font-size: 0.75rem;
  color: var(--color-grey-500);
  font-weight: normal;
`;

const TaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 150px;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-900));
  padding: 1rem;
  border-radius: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: var(--color-grey-400);
  font-style: italic;
  margin-top: 2rem;
`;

const ModalContent = styled.div`
  min-height: 200px;
`;

const ModalEmptyState = styled.div`
  text-align: center;
  color: var(--color-grey-500);
  padding: 2rem;
  font-style: italic;
`;

const ModalTaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
