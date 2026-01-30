"use client";

import { TaskForm } from "@/components/energy-planner/TaskForm";
import { Modal } from "@/components/Modal";
import type { Task } from "@/lib/energy-planner/schema";

interface CreateTaskProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, we are editing this task. otherwise creating new.
  editingTask?: Task;
  // Context for creating a new task (e.g. pre-filled date/zone)
  creationContext?: { date: string; zoneId?: string };
}

export function CreateTask({
  isOpen,
  onClose,
  editingTask,
  creationContext,
}: CreateTaskProps) {
  return (
    <Modal
      description="Record how completing this task may affect your energy levels."
      isOpen={isOpen}
      onClose={onClose}
      showDescription={false}
      title={editingTask ? "Edit Task" : "Create New Task"}
    >
      <TaskForm
        initialContext={creationContext}
        initialData={editingTask}
        onClose={onClose}
      />
    </Modal>
  );
}
