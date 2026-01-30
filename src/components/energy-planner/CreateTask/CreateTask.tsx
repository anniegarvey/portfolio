"use client";

import { useRef } from "react";
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
  const focusRef = useRef<HTMLInputElement>(null);

  return (
    <Modal
      description="Record how completing this task may affect your energy levels."
      isOpen={isOpen}
      onClose={onClose}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        focusRef.current?.focus();
      }}
      showDescription={false}
      title={editingTask ? "Edit Task" : "Create New Task"}
    >
      <TaskForm
        focusRef={focusRef}
        initialContext={creationContext}
        initialData={editingTask}
        onClose={onClose}
      />
    </Modal>
  );
}
