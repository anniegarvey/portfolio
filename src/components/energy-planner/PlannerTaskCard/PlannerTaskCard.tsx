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
  Trash2,
  X,
} from "lucide-react";
import { css, styled } from "next-yak";
import { useEnergyPlanner } from "../../../lib/energy-planner/context";
import type { PlannedTask, Task } from "../../../lib/energy-planner/schema";
import { Button } from "../common";

interface PlannerTaskCardProps {
  task: Task;
  selected?: boolean;
  completed?: boolean;
  isPastDay?: boolean;
  onEdit: (task: Task) => void;
  onToggleCompletion?: (taskId: string) => void;
  onRemove?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
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
  onDelete,
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
        {task.description && (
          <TaskDescription>{task.description}</TaskDescription>
        )}
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
          <Button
            aria-label={completed ? "Mark as not done" : "Mark as done"}
            intent={completed ? "teal" : "primary"}
            onClick={() => onToggleCompletion(task.id)}
            size="icon"
            title={completed ? "Mark as not done" : "Mark as done"}
            variant="ghost"
          >
            <Check size={18} />
          </Button>
        )}

        <Button
          aria-label="Edit task"
          onClick={() => onEdit(task)}
          size="icon"
          title="Edit task"
          variant="ghost"
        >
          <Pencil size={18} />
        </Button>

        {onDelete && (
          <Button
            aria-label="Delete task"
            intent="danger"
            onClick={() => onDelete(task.id)}
            size="icon"
            title="Delete task"
            variant="ghost"
          >
            <Trash2 size={18} />
          </Button>
        )}

        {selected && onRemove && !isPastDay && (
          <Button
            aria-label="Remove from day"
            intent="danger"
            onClick={() => onRemove(task.id)}
            size="icon"
            title="Remove from day"
            variant="ghost"
          >
            <X size={18} />
          </Button>
        )}

        {!selected && onAdd && !isPastDay && !task.repeatConfig && (
          <Button
            aria-label="Add to day"
            onClick={() => onAdd(task.id)}
            size="icon"
            title="Add to day"
            variant="ghost"
          >
            <CopyPlus size={18} />
          </Button>
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
      color: light-dark(var(--color-grey-700), var(--color-grey-300));
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

const TaskDescription = styled.p`
    font-size: 0.8rem;
    color: var(--color-grey-500);
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
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
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  background-color: ${({ $color }) => `${$color}30`};
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
  border: 1px solid ${({ $color }) => `${$color}50`};
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;
