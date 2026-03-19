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
  // Called after any new activity is created, with the type of activity
  onCreatedWithType?: (type: "one-off" | "repeating") => void;
}

export function CreateActivity({
  isOpen,
  onClose,
  editingActivity,
  creationContext,
  onCreated,
  onCreatedWithType,
}: CreateActivityProps) {
  const focusRef = useRef<HTMLInputElement>(null);
  const suggestionsOpenRef = useRef(false);

  return (
    <Modal
      description="Record how completing this activity may affect your energy levels."
      isOpen={isOpen}
      onClose={onClose}
      onEscapeKeyDown={(e) => {
        // When suggestions are visible, dismiss them instead of closing the dialog
        if (suggestionsOpenRef.current) {
          e.preventDefault();
        }
      }}
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
        onCreatedWithType={onCreatedWithType}
        onSuggestionsChange={(open) => {
          suggestionsOpenRef.current = open;
        }}
      />
    </Modal>
  );
}
