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
import type { Activity } from "@/lib/energy-planner/schema";
import { getReorderedItems } from "@/lib/energy-planner/utils";
import { Modal } from "../../Modal";
import { Button } from "../common";
import { PlannerActivityCard } from "../PlannerActivityCard";
import { SortableItem } from "../SortableItem";

interface AvailableActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableActivities: Activity[];
  repeatingActivities: Activity[];
  onOpenCreateActivity: () => void;
  onEditActivity: (activity: Activity) => void;
  onAddActivity: (activityId: string) => void;
  onReorderActivities: (activities: Activity[]) => void;
  onReorderRepeatingActivities: (activities: Activity[]) => void;
  onDeleteActivity: (activityId: string) => void;
}

export function AvailableActivitiesModal({
  isOpen,
  onClose,
  availableActivities,
  repeatingActivities,
  onOpenCreateActivity,
  onEditActivity,
  onAddActivity,
  onReorderActivities,
  onReorderRepeatingActivities,
  onDeleteActivity,
}: AvailableActivitiesModalProps) {
  const [activeTab, setActiveTab] = useState<"one-off" | "repeating">(
    "one-off",
  );
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(
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

  const handleDragEnd = (event: DragEndEvent) => {
    const newItems = getReorderedItems(availableActivities, event, (a) => a.id);

    if (newItems) {
      onReorderActivities(newItems);
    }
  };

  const handleRepeatingDragEnd = (event: DragEndEvent) => {
    const newItems = getReorderedItems(repeatingActivities, event, (a) => a.id);

    if (newItems) {
      onReorderRepeatingActivities(newItems);
    }
  };

  const confirmDelete = () => {
    if (activityToDelete) {
      onDeleteActivity(activityToDelete.id);
      setActivityToDelete(null);
    }
  };

  const requestDelete = (activityId: string) => {
    const activity =
      availableActivities.find((a) => a.id === activityId) ||
      repeatingActivities.find((ra) => ra.id === activityId);
    if (activity) {
      setActivityToDelete(activity);
    }
  };

  return (
    <>
      <Modal
        description="Manage your unplanned activities."
        isOpen={isOpen}
        onClose={onClose}
        title="Available Activities"
      >
        <ModalContent>
          <ModalActions>
            <Button
              leftIcon={<Plus size={18} />}
              onClick={onOpenCreateActivity}
            >
              New Activity
            </Button>
          </ModalActions>

          <TabList>
            <Tab
              $active={activeTab === "one-off"}
              onClick={() => setActiveTab("one-off")}
            >
              One-Off Activities
            </Tab>
            <Tab
              $active={activeTab === "repeating"}
              onClick={() => setActiveTab("repeating")}
            >
              Repeating Activities
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
                items={availableActivities.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                {availableActivities.length === 0 ? (
                  <ModalEmptyState>
                    No one-off activities available. Create a new activity to
                    get started!
                  </ModalEmptyState>
                ) : (
                  <ModalActivityList>
                    {availableActivities.map((activity) => (
                      <SortableItem id={activity.id} key={activity.id}>
                        {({ dragHandleProps }) => (
                          <PlannerActivityCard
                            activity={activity}
                            dragHandleProps={dragHandleProps}
                            onAdd={onAddActivity}
                            onDelete={requestDelete}
                            onEdit={onEditActivity}
                          />
                        )}
                      </SortableItem>
                    ))}
                  </ModalActivityList>
                )}
              </SortableContext>
            </DndContext>
          )}

          {activeTab === "repeating" && (
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleRepeatingDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={repeatingActivities.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <ModalActivityList>
                  {repeatingActivities.length === 0 ? (
                    <ModalEmptyState>
                      No repeating activities configured.
                    </ModalEmptyState>
                  ) : (
                    repeatingActivities.map((activity) => (
                      <SortableItem id={activity.id} key={activity.id}>
                        {({ dragHandleProps }) => (
                          <PlannerActivityCard
                            activity={activity}
                            dragHandleProps={dragHandleProps}
                            key={activity.id}
                            onDelete={requestDelete}
                            onEdit={onEditActivity}
                          />
                        )}
                      </SortableItem>
                    ))
                  )}
                </ModalActivityList>
              </SortableContext>
            </DndContext>
          )}
        </ModalContent>
      </Modal>

      <Modal
        description="This action cannot be undone."
        isOpen={!!activityToDelete}
        onClose={() => setActivityToDelete(null)}
        showDescription
        title="Delete Activity?"
      >
        <div>
          <p>
            Are you sure you want to delete &quot;
            <strong>{activityToDelete?.title}</strong>&quot;?
          </p>
          <p style={{ marginTop: "8px", color: "var(--color-grey-500)" }}>
            This will permanently remove the activity
            {activityToDelete?.repeatConfig
              ? " and all its future occurrences"
              : ""}
            .
          </p>

          <ConfirmActions>
            <Button
              intent="secondary"
              onClick={() => setActivityToDelete(null)}
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

const ModalActivityList = styled.div`
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
