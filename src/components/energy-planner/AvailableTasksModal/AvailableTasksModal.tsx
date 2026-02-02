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
import type { Task } from "@/lib/energy-planner/schema";
import { getReorderedItems } from "@/lib/energy-planner/utils";
import { Modal } from "../../Modal";
import { Button } from "../common";
import { PlannerTaskCard } from "../PlannerTaskCard";
import { SortableItem } from "../SortableItem";

interface AvailableTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTasks: Task[];
  repeatingTasks: Task[];
  onOpenCreateTask: () => void;
  onEditTask: (task: Task) => void;
  onAddTask: (taskId: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onDeleteTask: (taskId: string) => void;
}

export function AvailableTasksModal({
  isOpen,
  onClose,
  availableTasks,
  repeatingTasks,
  onOpenCreateTask,
  onEditTask,
  onAddTask,
  onReorderTasks,
  onDeleteTask,
}: AvailableTasksModalProps) {
  const [activeTab, setActiveTab] = useState<"one-off" | "repeating">(
    "one-off",
  );
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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

  const confirmDelete = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  const requestDelete = (taskId: string) => {
    const task =
      availableTasks.find((t) => t.id === taskId) ||
      repeatingTasks.find((t) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
    }
  };

  return (
    <>
      <Modal
        description="Manage your unplanned tasks."
        isOpen={isOpen}
        onClose={onClose}
        title="Available Tasks"
      >
        <ModalContent>
          <ModalActions>
            <Button leftIcon={<Plus size={18} />} onClick={onOpenCreateTask}>
              New Task
            </Button>
          </ModalActions>

          <TabList>
            <Tab
              $active={activeTab === "one-off"}
              onClick={() => setActiveTab("one-off")}
            >
              One-Off Tasks
            </Tab>
            <Tab
              $active={activeTab === "repeating"}
              onClick={() => setActiveTab("repeating")}
            >
              Repeating Tasks
            </Tab>
          </TabList>

          {activeTab === "one-off" && (
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
                    No one-off tasks available. Create a new task to get
                    started!
                  </ModalEmptyState>
                ) : (
                  <ModalTaskList>
                    {availableTasks.map((task) => (
                      <SortableItem id={task.id} key={task.id}>
                        {({ dragHandleProps }) => (
                          <PlannerTaskCard
                            dragHandleProps={dragHandleProps}
                            onAdd={onAddTask}
                            onDelete={requestDelete}
                            onEdit={onEditTask}
                            task={task}
                          />
                        )}
                      </SortableItem>
                    ))}
                  </ModalTaskList>
                )}
              </SortableContext>
            </DndContext>
          )}

          {activeTab === "repeating" && (
            <ModalTaskList>
              {repeatingTasks.length === 0 ? (
                <ModalEmptyState>
                  No repeating tasks configured.
                </ModalEmptyState>
              ) : (
                repeatingTasks.map((task) => (
                  <PlannerTaskCard
                    key={task.id}
                    // No drag handle for repeating tasks list (for now)
                    // No onAdd (automatically planned)
                    onDelete={requestDelete}
                    onEdit={onEditTask}
                    task={task}
                  />
                ))
              )}
            </ModalTaskList>
          )}
        </ModalContent>
      </Modal>

      <Modal
        description="This action cannot be undone."
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        showDescription
        title="Delete Task?"
      >
        <div>
          <p>
            Are you sure you want to delete &quot;
            <strong>{taskToDelete?.title}</strong>&quot;?
          </p>
          <p style={{ marginTop: "8px", color: "var(--color-grey-500)" }}>
            This will permanently remove the task
            {taskToDelete?.repeatConfig
              ? " and all its future occurrences"
              : ""}
            .
          </p>

          <ConfirmActions>
            <Button
              intent="secondary"
              onClick={() => setTaskToDelete(null)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button intent="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </ConfirmActions>
        </div>
      </Modal>
    </>
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
  padding-bottom: 16px;
`;

const TabList = styled.div`
    display: flex;
    gap: 1rem;
    border-bottom: 2px solid var(--color-grey-200);
    margin-bottom: 1rem;
`;

const Tab = styled.button<{ $active?: boolean }>`
    background: none;
    border: none;
    padding: 0.5rem 1rem;
    font-weight: 600;
    color: ${({ $active }) =>
      $active
        ? "light-dark(var(--color-primary-700), var(--color-primary-100))"
        : "light-dark(var(--color-grey-600), var(--color-grey-400))"};
    border-bottom: 2px solid ${({ $active }) =>
      $active ? "var(--color-primary-600)" : "transparent"};
    margin-bottom: -2px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        color: light-dark(var(--color-primary-800), var(--color-primary-200));
    }
`;

const ConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;
