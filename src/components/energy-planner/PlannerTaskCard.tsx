"use client";

import { Check, CopyPlus, Pencil, X } from "lucide-react";
import { css, styled } from "next-yak";
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
  return (
    <Card $completed={completed} $selected={selected}>
      <TaskContent $completed={completed}>
        <TaskTitle onClick={() => onEdit(task)} title="Edit Task">
          {task.title}
        </TaskTitle>
        <EnergyBadges>
          <Badge $type="physical">{task.energyCost.physical} P</Badge>
          <Badge $type="social">{task.energyCost.social} S</Badge>
          <Badge $type="executive">{task.energyCost.executive} E</Badge>
        </EnergyBadges>
      </TaskContent>
      <Actions>
        {selected && onToggleCompletion && (
          <ActionButton
            $completed={completed}
            onClick={() => onToggleCompletion(task.id)}
            title={completed ? "Mark as not done" : "Mark as done"}
          >
            <Check size={18} />
          </ActionButton>
        )}

        <ActionButton onClick={() => onEdit(task)} title="Edit task">
          <Pencil size={18} />
        </ActionButton>

        {selected && onRemove && (
          <ActionButton
            $remove
            onClick={() => onRemove(task.id)}
            title="Remove from day"
          >
            <X size={18} />
          </ActionButton>
        )}

        {!selected && onAdd && (
          <ActionButton onClick={() => onAdd(task.id)} title="Add to day">
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

const Badge = styled.span<{ $type: "physical" | "social" | "executive" }>`
    font-size: 0.7rem;
    padding: 0.1rem 0.3rem;
    border-radius: 999px;
    background-color: ${({ $type }) => {
      if ($type === "physical") return "var(--color-teal-100)";
      if ($type === "social") return "var(--color-rose-100)";
      return "var(--color-orange-100)";
    }};
    color: ${({ $type }) => {
      if ($type === "physical") return "var(--color-teal-900)";
      if ($type === "social") return "var(--color-rose-900)";
      return "var(--color-orange-900)";
    }};
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
