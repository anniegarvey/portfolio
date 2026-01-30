"use client";

import { styled } from "next-yak";
import { useState } from "react";
import { CreateTask } from "@/components/energy-planner/CreateTask";
import { DateSelector } from "@/components/energy-planner/DateSelector";
import { DayPlanner } from "@/components/energy-planner/DayPlanner";
import { EnergyInput } from "@/components/energy-planner/EnergyInput";
import { ImportExport } from "@/components/energy-planner/ImportExport";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { isToday } from "@/hooks/utils";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Task } from "@/lib/energy-planner/schema";

export function EnergyPlanner() {
  const { currentDate, goToPreviousDay, goToNextDay, goToToday } =
    useEnergyPlanner();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  const [creationContext, setCreationContext] = useState<
    { date: string; zoneId?: string } | undefined
  >(undefined);

  const viewingToday = isToday(currentDate);

  const handleOpenCreate = (context?: { date: string; zoneId?: string }) => {
    setEditingTask(undefined);
    setCreationContext(context);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setCreationContext(undefined); // Editing doesn't use creation context (yet)
    setIsTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(undefined);
    setCreationContext(undefined);
  };

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Energy Planner</PageTitle>
        <ImportExport />
      </PageHeader>

      <p>
        Plan your day according to your energy levels. Based on extended Spoon
        Theory.
      </p>

      <Layout>
        <DateSelector
          currentDate={currentDate}
          onGoToToday={goToToday}
          onNextDay={goToNextDay}
          onPreviousDay={goToPreviousDay}
          viewingToday={viewingToday}
        />

        <EnergyInput />

        <DayPlanner
          onEditTask={handleEditTask}
          onOpenCreateTask={handleOpenCreate}
        />

        <CreateTask
          creationContext={creationContext}
          editingTask={editingTask}
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
        />
      </Layout>
    </MaxWidthWrapper>
  );
}

const Layout = styled.div`
  display: flex;
  gap: 32px;
  flex-direction: column;
  padding-block: 32px;
`;
