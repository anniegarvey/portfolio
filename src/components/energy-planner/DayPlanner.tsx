"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { formatDateForDisplay, isToday } from "@/hooks/utils";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Task } from "@/lib/energy-planner/schema";
import { Modal } from "../Modal";
import { PlannerTaskCard } from "./PlannerTaskCard";
import { UncompletedTaskCard } from "./UncompletedTaskCard";

interface DayPlannerProps {
  onEditTask: (task: Task) => void;
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: React component with comprehensive JSX layout
export function DayPlanner({ onEditTask }: DayPlannerProps) {
  const {
    currentDate,
    dayPlan,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    addToPlan,
    removeFromPlan,
    toggleTaskCompletion,
    checkExceedsCapacity,
    calculateEnergyUsage,
    energyTypes,
    getUncompleted,
    getAvailableTasks,
  } = useEnergyPlanner();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const usage = calculateEnergyUsage();
  const warning = checkExceedsCapacity();
  const viewingToday = isToday(currentDate);
  const uncompletedTasks = viewingToday ? getUncompleted() : [];

  const availableTasks = getAvailableTasks();

  // Get selected tasks from ALL tasks (including ones planned for this day)
  const { tasks } = useEnergyPlanner();
  const selectedTasksFromAll = tasks.filter((t) =>
    dayPlan.selectedTaskIds.includes(t.id),
  );

  const isCompleted = (taskId: string) =>
    dayPlan.completedTaskIds.includes(taskId);

  const handleAddToPlan = (taskId: string) => {
    addToPlan(taskId);
    setIsModalOpen(false);
  };

  return (
    <Container>
      <DateNavigation>
        <NavButton
          aria-label="Previous day"
          onClick={goToPreviousDay}
          type="button"
        >
          <ChevronLeft size={20} />
        </NavButton>
        <DateDisplay>
          <CurrentDate>{formatDateForDisplay(currentDate)}</CurrentDate>
          {!viewingToday && (
            <TodayButton onClick={goToToday} type="button">
              Go to Today
            </TodayButton>
          )}
          {viewingToday && <TodayIndicator>Today</TodayIndicator>}
        </DateDisplay>
        <NavButton aria-label="Next day" onClick={goToNextDay} type="button">
          <ChevronRight size={20} />
        </NavButton>
      </DateNavigation>

      <Header>
        <h3>Your Day Plan</h3>
        {warning.exceeded && <Warning>{warning.message}</Warning>}
      </Header>

      {uncompletedTasks.length > 0 && (
        <UncompletedSection>
          <UncompletedHeader>
            Uncompleted Tasks ({uncompletedTasks.length})
          </UncompletedHeader>
          <UncompletedList>
            {uncompletedTasks.map(({ task, fromDate }) => (
              <UncompletedTaskCard
                fromDate={fromDate}
                key={`${task.id}-${fromDate}`}
                onEdit={onEditTask}
                task={task}
              />
            ))}
          </UncompletedList>
        </UncompletedSection>
      )}

      <SelectedSection>
        <ColumnHeader>
          <div>Selected Tasks ({selectedTasksFromAll.length})</div>
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
          {selectedTasksFromAll.length === 0 && (
            <EmptyState>No tasks selected for this day.</EmptyState>
          )}
          {selectedTasksFromAll.map((task) => (
            <PlannerTaskCard
              completed={isCompleted(task.id)}
              isPastDay={!viewingToday}
              key={task.id}
              onEdit={onEditTask}
              onRemove={removeFromPlan}
              onToggleCompletion={toggleTaskCompletion}
              selected
              task={task}
            />
          ))}
        </TaskList>

        <AddTaskButton onClick={() => setIsModalOpen(true)} type="button">
          <Plus size={18} />
          Plan an available task
        </AddTaskButton>
      </SelectedSection>

      <Modal
        description="Manage your unplanned tasks."
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Available Tasks"
      >
        <ModalContent>
          {availableTasks.length === 0 ? (
            <ModalEmptyState>
              No tasks available. Create some tasks above!
            </ModalEmptyState>
          ) : (
            <ModalTaskList>
              {availableTasks.map((task) => (
                <PlannerTaskCard
                  key={task.id}
                  onAdd={handleAddToPlan}
                  onEdit={onEditTask}
                  task={task}
                />
              ))}
            </ModalTaskList>
          )}
        </ModalContent>
      </Modal>
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

const DateNavigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-grey-200);
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-700));
  border: 1px solid var(--color-grey-300);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s var(--ease);

  &:hover {
    background-color: light-dark(var(--color-grey-200), var(--color-grey-600));
  }

  &:active {
    transform: scale(0.95);
  }
`;

const DateDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 200px;
`;

const CurrentDate = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
`;

const TodayButton = styled.button`
  background: none;
  border: none;
  color: var(--color-primary-600);
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: var(--color-primary-700);
  }
`;

const TodayIndicator = styled.span`
  font-size: 0.75rem;
  color: var(--color-teal-600);
  font-weight: 500;
  background-color: light-dark(var(--color-teal-100), var(--color-teal-900));
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
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

const UncompletedSection = styled.div`
  background-color: light-dark(var(--color-orange-50), oklch(25% 0.05 50));
  border: 1px solid var(--color-orange-300);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const UncompletedHeader = styled.h4`
  color: var(--color-orange-900);
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
`;

const UncompletedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SelectedSection = styled.div`
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
  min-height: 150px;
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

const AddTaskButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--color-primary-600);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s var(--ease);

  &:hover {
    background-color: var(--color-primary-700);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ModalContent = styled.div`
  min-height: 200px;
`;

const ModalEmptyState = styled.div`
  text-align: center;
  color: var(--color-grey-500);
  padding: 2rem;
  font-style: italic;
`;

const ModalTaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;
