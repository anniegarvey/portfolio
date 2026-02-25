"use client";

import { useRef } from "react";
import { ActivityForm } from "@/components/energy-planner/ActivityForm";
import { Modal } from "@/components/Modal";
import type { Activity } from "@/lib/energy-planner/schema";

interface CreateActivityProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, we are editing this activity. otherwise creating new.
  editingActivity?: Activity;
  // Context for creating a new activity (e.g. pre-filled date/zone)
  creationContext?: { date: string; zoneId?: string };
  // Called after a new one-off activity is successfully created with context
  onCreated?: () => void;
}

export function CreateActivity({
  isOpen,
  onClose,
  editingActivity,
  creationContext,
  onCreated,
}: CreateActivityProps) {
  const focusRef = useRef<HTMLInputElement>(null);

  return (
    <Modal
      description="Record how completing this activity may affect your energy levels."
      isOpen={isOpen}
      onClose={onClose}
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        focusRef.current?.focus();
      }}
      showDescription={false}
      title={editingActivity ? "Edit Activity" : "Create New Activity"}
    >
      <ActivityForm
        focusRef={focusRef}
        initialContext={creationContext}
        initialData={editingActivity}
        onClose={onClose}
        onCreated={onCreated}
      />
    </Modal>
  );
}
