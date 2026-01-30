"use client";

import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  Check,
  CopyPlus,
  GripVertical,
  Pencil,
  RotateCw,
  X,
} from "lucide-react";
import { css, styled } from "next-yak";
import { useEnergyPlanner } from "../../../lib/energy-planner/context";
import type { PlannedTask, Task } from "../../../lib/energy-planner/schema";

interface PlannerTaskCardProps {
  task: Task;
  selected?: boolean;
  completed?: boolean;
  isPastDay?: boolean;
  onEdit: (task: Task) => void;
  onToggleCompletion?: (taskId: string) => void;
  onRemove?: (taskId: string) => void;
  onAdd?: (taskId: string) => void;
  dragHandleProps?: {
    listeners: DraggableSyntheticListeners;
    attributes: DraggableAttributes;
    ref: (node: HTMLElement | null) => void;
  };
}

export function PlannerTaskCard({
  task,
  selected,
  completed,
  isPastDay,
  onEdit,
  onToggleCompletion,
  onRemove,
  onAdd,
  dragHandleProps,
}: PlannerTaskCardProps) {
  const { energyTypes } = useEnergyPlanner();

  return (
    <Card
      $completed={completed}
      $isProjected={(task as PlannedTask).isProjected}
      $selected={selected}
    >
      {dragHandleProps && (
        <DragHandle
          {...dragHandleProps.listeners}
          {...dragHandleProps.attributes}
          aria-label={`Reorder task: ${task.title}`}
          ref={dragHandleProps.ref}
        >
          <GripVertical size={20} />
        </DragHandle>
      )}
      <TaskContent $completed={completed}>
        <TaskTitleRow>
          {task.repeatConfig && (
            <RepeatIconWrapper title="Repeating Task">
              <RotateCw size={14} />
            </RepeatIconWrapper>
          )}
          <TaskTitle>{task.title}</TaskTitle>
        </TaskTitleRow>
        <EnergyBadges>
          {energyTypes.map((type) => {
            const value = task.energyCost[type.id] || 0;
            if (value === 0) return null;
            return (
              <Badge $color={type.color} key={type.id}>
                {value} {type.label.charAt(0).toUpperCase()}
              </Badge>
            );
          })}
        </EnergyBadges>
      </TaskContent>
      <Actions>
        {selected && onToggleCompletion && !isPastDay && (
          <ActionButton
            $completed={completed}
            aria-label={completed ? "Mark as not done" : "Mark as done"}
            onClick={() => onToggleCompletion(task.id)}
            title={completed ? "Mark as not done" : "Mark as done"}
          >
            <Check size={18} />
          </ActionButton>
        )}

        <ActionButton
          aria-label="Edit task"
          onClick={() => onEdit(task)}
          title="Edit task"
        >
          <Pencil size={18} />
        </ActionButton>

        {selected && onRemove && !isPastDay && (
          <ActionButton
            $remove
            aria-label="Remove from day"
            onClick={() => onRemove(task.id)}
            title="Remove from day"
            // Start of Selection
          >
            <X size={18} />
          </ActionButton>
        )}

        {!selected && onAdd && !isPastDay && !task.repeatConfig && (
          <ActionButton
            aria-label="Add to day"
            onClick={() => onAdd(task.id)}
            title="Add to day"
          >
            <CopyPlus size={18} />
          </ActionButton>
        )}
      </Actions>
    </Card>
  );
}

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-right: 4px;
  color: var(--color-grey-400);
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
    color: var(--color-grey-600);
  }

  &:hover {
    color: var(--color-grey-500);
  }
`;

const Card = styled.article<{
  $selected?: boolean;
  $completed?: boolean;
  $isProjected?: boolean;
}>`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--color-grey-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: transform 0.1s;

  ${({ $isProjected }) =>
    $isProjected &&
    css`
        background-color: light-dark(var(--color-blue-50), var(--color-blue-950));
        border-style: dashed;
        border-color: var(--color-blue-300);
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: var(--color-primary-300);
      background-color: light-dark(var(--color-primary-50), var(--color-primary-950));
      border-style: solid; 
  `}

  ${({ $completed }: { $completed?: boolean }) =>
    $completed &&
    css`
      background-color: light-dark(var(--color-grey-100), var(--color-grey-800));
      border-color: var(--color-grey-300);
      opacity: 0.8;
    `}

  &:has(${DragHandle}:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
`;

const TaskContent = styled.div<{ $completed?: boolean }>`
  flex: 1;
  ${({ $completed }) =>
    $completed &&
    css`
      text-decoration: line-through;
      color: var(--color-grey-500);
  `}
`;

const TaskTitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 0.25rem;
`;

const TaskTitle = styled.div`
  font-weight: 500;
`;

const RepeatIconWrapper = styled.div`
    color: var(--color-grey-500);
    display: flex;
    align-items: center;
`;

const EnergyBadges = styled.div`
  display: flex;
  gap: 8px;
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 999px;
  background-color: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
  border: 1px solid ${({ $color }) => `${$color}40`};
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionButton = styled.button<{ $remove?: boolean; $completed?: boolean }>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ $remove, $completed }) => {
    if ($remove) return "var(--color-rose-500)";
    if ($completed) return "var(--color-teal-600)";
    return "var(--color-primary-500)";
  }};

  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: light-dark(var(--color-grey-200), var(--color-grey-700));
  }
`;
