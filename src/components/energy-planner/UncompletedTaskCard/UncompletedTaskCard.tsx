"use client";

import { ArrowRight, Check, Undo2 } from "lucide-react";
import { styled } from "next-yak";
import { formatDateForDisplay } from "@/hooks/utils";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Task } from "@/lib/energy-planner/schema";

interface UncompletedTaskCardProps {
  task: Task;
  fromDate: string;
}

export function UncompletedTaskCard({
  task,
  fromDate,
}: UncompletedTaskCardProps) {
  const {
    energyTypes,
    markTaskCompleteOnDate,
    moveTaskToToday,
    moveTaskToUnplanned,
  } = useEnergyPlanner();

  const handleMarkComplete = () => {
    markTaskCompleteOnDate(task.id, fromDate);
  };

  const handleMoveToToday = () => {
    moveTaskToToday(task.id, fromDate);
  };

  const handleReturnToUnplanned = () => {
    moveTaskToUnplanned(task.id, fromDate);
  };

  return (
    <Card>
      <TaskContent>
        <TaskHeader>
          <TaskTitle>{task.title}</TaskTitle>
          <FromDate>from {formatDateForDisplay(fromDate)}</FromDate>
        </TaskHeader>
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
        <ActionButton
          aria-label="Mark as complete"
          onClick={handleMarkComplete}
          title="Mark as complete"
        >
          <Check size={16} />
          <span>Complete</span>
        </ActionButton>
        <ActionButton
          aria-label="Move to today"
          onClick={handleMoveToToday}
          title="Move to today"
        >
          <ArrowRight size={16} />
          <span>Move to Today</span>
        </ActionButton>
        <ActionButton
          $secondary
          aria-label="Return to unplanned"
          onClick={handleReturnToUnplanned}
          title="Return to unplanned"
        >
          <Undo2 size={16} />
          <span>Unplan</span>
        </ActionButton>
      </Actions>
    </Card>
  );
}

const Card = styled.article`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
  padding: 12px;
  border-radius: 8px;
  border: 2px solid var(--color-orange-400);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskContent = styled.div`
  flex: 1;
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const TaskTitle = styled.span`
  font-weight: 600;
  color: light-dark(var(--color-orange-900), var(--color-orange-100));
`;

const FromDate = styled.span`
  font-size: 0.75rem;
  color: light-dark(var(--color-orange-700), var(--color-orange-300));
  white-space: nowrap;
`;

const EnergyBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $secondary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  padding-right: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s var(--ease);

  background-color: ${({ $secondary }) =>
    $secondary
      ? "light-dark(var(--color-grey-100), var(--color-grey-700))"
      : "var(--color-teal-600)"};
  color: ${({ $secondary }) =>
    $secondary
      ? "light-dark(var(--color-grey-700), var(--color-grey-200))"
      : "white"};
  border: 1px solid
    ${({ $secondary }) =>
      $secondary ? "var(--color-grey-300)" : "var(--color-teal-700)"};

  &:hover {
    background-color: ${({ $secondary }) =>
      $secondary
        ? "light-dark(var(--color-grey-200), var(--color-grey-600))"
        : "var(--color-teal-700)"};
  }

  span {
    display: none;

    @media (min-width: 640px) {
      display: inline;
    }
  }
`;
