"use client";

import { styled } from "next-yak";
import { useEnergyPlanner } from "../../lib/energy-planner/context";
import type { Task } from "../../lib/energy-planner/schema";
import { PlannerTaskCard } from "./PlannerTaskCard";

interface DayPlannerProps {
  onEditTask: (task: Task) => void;
}

export function DayPlanner({ onEditTask }: DayPlannerProps) {
  const {
    tasks,
    dayPlan,
    addToPlan,
    removeFromPlan,
    toggleTaskCompletion,
    checkExceedsCapacity,
    calculateEnergyUsage,
    energyTypes,
  } = useEnergyPlanner();

  const usage = calculateEnergyUsage();
  const warning = checkExceedsCapacity();

  const availableTasks = tasks.filter(
    (t) => !dayPlan.selectedTaskIds.includes(t.id),
  );
  const selectedTasks = tasks.filter((t) =>
    dayPlan.selectedTaskIds.includes(t.id),
  );

  const isCompleted = (taskId: string) =>
    (dayPlan.completedTaskIds || []).includes(taskId);

  return (
    <Container>
      <Header>
        <h3>Your Day Plan</h3>
        {warning.exceeded && <Warning>{warning.message}</Warning>}
      </Header>

      <Columns>
        <Column>
          <ColumnHeader>Available Tasks ({availableTasks.length})</ColumnHeader>
          <TaskList>
            {availableTasks.length === 0 && (
              <EmptyState>No tasks available. Create some above!</EmptyState>
            )}
            {availableTasks.map((task) => (
              <PlannerTaskCard
                key={task.id}
                onAdd={addToPlan}
                onEdit={onEditTask}
                task={task}
              />
            ))}
          </TaskList>
        </Column>

        <Column>
          <ColumnHeader>
            <div>Selected Tasks ({selectedTasks.length})</div>
            <UsageSummary>
              Usage:{" "}
              {energyTypes.map((type) => (
                <span key={type.id}>
                  {type.label.charAt(0)}:{usage[type.id] || 0}{" "}
                </span>
              ))}
            </UsageSummary>
          </ColumnHeader>
          <TaskList>
            {selectedTasks.length === 0 && (
              <EmptyState>No tasks selected for today.</EmptyState>
            )}
            {selectedTasks.map((task) => (
              <PlannerTaskCard
                completed={isCompleted(task.id)}
                key={task.id}
                onEdit={onEditTask}
                onRemove={removeFromPlan}
                onToggleCompletion={toggleTaskCompletion}
                selected
                task={task}
              />
            ))}
          </TaskList>
        </Column>
      </Columns>
    </Container>
  );
}

const Container = styled.div`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-top: 2rem;
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
`;

const Warning = styled.div`
    background-color: var(--color-orange-100);
    color: var(--color-orange-900);
    padding: 0.5rem 1rem;
    border-radius: 0.25rem;
    font-weight: 500;
    font-size: 0.875rem;
    border: 1px solid var(--color-orange-300);
`;

const Columns = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200ox, 1fr));
    gap: 2rem;
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const ColumnHeader = styled.div`
    font-weight: 600;
    color: var(--color-grey-600);
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const UsageSummary = styled.span`
    font-size: 0.75rem;
    color: var(--color-grey-500);
    font-weight: normal;
`;

const TaskList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-height: 200px;
    background-color: light-dark(var(--color-grey-100), var(--color-grey-900));
    padding: 1rem;
    border-radius: 0.5rem;
`;

const EmptyState = styled.div`
    text-align: center;
    color: var(--color-grey-400);
    font-style: italic;
    margin-top: 2rem;
`;
