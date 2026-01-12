"use client";

import { Check, CopyPlus, Pencil, X } from "lucide-react";
import { css, styled } from "next-yak";
import { useEnergyPlanner } from "../../lib/energy-planner/context";
import type { Task } from "../../lib/energy-planner/schema";

interface PlannerTaskCardProps {
  task: Task;
  selected?: boolean;
  completed?: boolean;
  onEdit: (task: Task) => void;
  onToggleCompletion?: (taskId: string) => void;
  onRemove?: (taskId: string) => void;
  onAdd?: (taskId: string) => void;
}

export function PlannerTaskCard({
  task,
  selected,
  completed,
  onEdit,
  onToggleCompletion,
  onRemove,
  onAdd,
}: PlannerTaskCardProps) {
  const { energyTypes } = useEnergyPlanner();

  return (
    <Card $completed={completed} $selected={selected}>
      <TaskContent $completed={completed}>
        <TaskTitle onClick={() => onEdit(task)} title="Edit Task">
          {task.title}
        </TaskTitle>
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
        {selected && onToggleCompletion && (
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

        {selected && onRemove && (
          <ActionButton
            $remove
            aria-label="Remove from day"
            onClick={() => onRemove(task.id)}
            title="Remove from day"
          >
            <X size={18} />
          </ActionButton>
        )}

        {!selected && onAdd && (
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

const Card = styled.div<{ $selected?: boolean; $completed?: boolean }>`
    background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
    padding: 0.75rem;
    border-radius: 0.25rem;
    border: 1px solid var(--color-grey-200);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    transition: transform 0.1s;

    ${({ $selected }) =>
      $selected &&
      css`
        border-color: var(--color-primary-300);
        background-color: light-dark(var(--color-primary-50), var(--color-primary-950));
    `}

    ${({ $completed }: { $completed?: boolean }) =>
      $completed &&
      css`
            background-color: light-dark(var(--color-grey-100), var(--color-grey-800));
            border-color: var(--color-grey-300);
            opacity: 0.8;
       `}

    &:hover {
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

const TaskTitle = styled.div`
    font-weight: 500;
    margin-bottom: 0.25rem;
    cursor: pointer;
    &:hover {
        text-decoration: underline;
    }
`;

const EnergyBadges = styled.div`
    display: flex;
    gap: 0.5rem;
`;

const Badge = styled.span<{ $color: string }>`
    font-size: 0.7rem;
    padding: 0.1rem 0.3rem;
    border-radius: 999px;
    background-color: ${({ $color }) => `${$color}20`};
    color: ${({ $color }) => $color};
    border: 1px solid ${({ $color }) => `${$color}40`};
`;

const Actions = styled.div`
    display: flex;
    gap: 0.25rem;
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
    padding: 0.25rem;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;

    &:hover {
        background-color: light-dark(var(--color-grey-200), var(--color-grey-700));
    }
`;
