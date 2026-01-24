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
import type { Task } from "@/lib/energy-planner/schema";
import { getReorderedItems } from "@/lib/energy-planner/utils";
import { Modal } from "../Modal";
import { PlannerTaskCard } from "./PlannerTaskCard";
import { SortableItem } from "./SortableItem";

interface AvailableTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTasks: Task[];
  onOpenCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onAddTask: (taskId: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
}

export function AvailableTasksModal({
  isOpen,
  onClose,
  availableTasks,
  onOpenCreateTask,
  onEditTask,
  onAddTask,
  onReorderTasks,
}: AvailableTasksModalProps) {
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

  const handleDragEnd = (event: DragEndEvent) => {
    const newItems = getReorderedItems(availableTasks, event, (t) => t.id);

    if (newItems) {
      onReorderTasks(newItems);
    }
  };

  return (
    <Modal
      description="Manage your unplanned tasks."
      isOpen={isOpen}
      onClose={onClose}
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
          onDragEnd={handleDragEnd}
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
                      onAdd={onAddTask}
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
  );
}

const ModalContent = styled.div`
  min-height: 200px;
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
