"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Settings } from "lucide-react";
import { styled } from "next-yak";
import type {
  PlannedTask,
  Task,
  ZoneConfig,
} from "@/lib/energy-planner/schema";
import { PlannerTaskCard } from "../PlannerTaskCard";
import { SortableItem } from "../SortableItem";

interface ZoneSectionProps {
  zone: ZoneConfig;
  tasks: PlannedTask[];
  isPastDay: boolean;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onRemove: (taskId: string) => void;
  onToggleCompletion: (taskId: string) => void;
  onManageZones: () => void;
}

export function ZoneSection({
  zone,
  tasks,
  isPastDay,
  onAddTask,
  onEditTask,
  onRemove,
  onToggleCompletion,
  onManageZones,
}: ZoneSectionProps) {
  const { setNodeRef } = useDroppable({
    id: zone.id,
  });

  return (
    <ZoneContainer data-testid={`zone-${zone.id}`} ref={setNodeRef}>
      <ZoneHeaderWrapper>
        <HeaderContent>
          <ZoneTitle>{zone.name}</ZoneTitle>
          {zone.description && (
            <ZoneDescription>{zone.description}</ZoneDescription>
          )}
        </HeaderContent>
        <ManageButton
          onClick={onManageZones}
          title="Manage Zones"
          type="button"
        >
          <Settings size={16} />
        </ManageButton>
      </ZoneHeaderWrapper>
      <SortableContext
        id={zone.id}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ZoneTaskList data-testid={`zone-tasks-${zone.id}`}>
          {tasks.length === 0 && <EmptyZone>No tasks in this zone</EmptyZone>}
          {tasks.map((task) => (
            <SortableItem id={task.id} key={task.id}>
              {({ dragHandleProps }) => (
                <PlannerTaskCard
                  completed={task.completed}
                  dragHandleProps={dragHandleProps}
                  isPastDay={isPastDay}
                  onEdit={onEditTask}
                  onRemove={onRemove}
                  onToggleCompletion={onToggleCompletion}
                  selected
                  task={task}
                />
              )}
            </SortableItem>
          ))}
        </ZoneTaskList>
      </SortableContext>
      <AddTaskButton
        aria-label={`Add task to ${zone.name}`}
        onClick={onAddTask}
        type="button"
      >
        <Plus size={16} />
        Add Task
      </AddTaskButton>
    </ZoneContainer>
  );
}

const ZoneContainer = styled.div`
  border: 2px dotted light-dark(var(--color-grey-300), var(--color-grey-500));
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ZoneTitle = styled.h4`
  font-weight: 600;
  font-size: 0.95rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-200));
  margin: 0;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ZoneDescription = styled.p`
  font-size: 0.8rem;
  font-weight: 400;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  margin: 0;
`;

const ZoneHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid light-dark(var(--color-grey-200), var(--color-grey-600));
`;

const ManageButton = styled.button`
  background: transparent;
  border: 1px solid light-dark(var(--color-grey-400), var(--color-grey-300));
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: light-dark(var(--color-grey-100), var(--color-grey-800));
    color: light-dark(var(--color-grey-800), var(--color-grey-200));
  }
`;

const ZoneTaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 50px;
`;

const EmptyZone = styled.div`
  text-align: center;
  color: var(--color-grey-400);
  font-style: italic;
  font-size: 0.875rem;
  padding: 16px 0;
`;

const AddTaskButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px dashed light-dark(var(--color-grey-300), var(--color-grey-500));
  border-radius: 6px;
  background: transparent;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: light-dark(var(--color-grey-100), var(--color-grey-700));
    border-color: var(--color-primary-500);
    color: var(--color-primary-600);
  }
`;
