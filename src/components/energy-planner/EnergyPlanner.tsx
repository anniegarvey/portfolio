"use client";

import { Download, Upload } from "lucide-react";
import { styled } from "next-yak";
import { useRef, useState } from "react";
import { CreateTask } from "@/components/energy-planner/CreateTask";
import { DateSelector } from "@/components/energy-planner/DateSelector";
import { DayPlanner } from "@/components/energy-planner/DayPlanner";
import { EnergyInput } from "@/components/energy-planner/EnergyInput";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { isToday } from "@/hooks/utils";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Task } from "@/lib/energy-planner/schema";
import {
  exportEnergyPlannerData,
  importEnergyPlannerData,
} from "@/lib/energy-planner/utils";

const handleFileImportError = (error: Error | unknown) => {
  alert(
    error instanceof Error
      ? error.message
      : "Failed to import data. Please check the file format.",
  );
};

export function EnergyPlanner() {
  const { currentDate, goToPreviousDay, goToNextDay, goToToday } =
    useEnergyPlanner();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = () => {
    exportEnergyPlannerData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importEnergyPlannerData(file);
    } catch (error) {
      handleFileImportError(error);
    }
  };

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Energy Planner</PageTitle>
        <ButtonGroup>
          <ActionButton onClick={handleExport} title="Export data">
            <Download size={18} />
            Export
          </ActionButton>
          <ActionButton onClick={handleImportClick} title="Import data">
            <Upload size={18} />
            Import
          </ActionButton>
          <input
            accept=".json"
            onChange={handleImportFile}
            ref={fileInputRef}
            style={{ display: "none" }}
            type="file"
          />
        </ButtonGroup>
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-neutral-200);
  color: var(--color-neutral-900);
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-neutral-300);
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
      background-color: var(--color-neutral-300);
      border-color: var(--color-neutral-400);
  }
`;

const Layout = styled.div`
  display: flex;
  gap: 32px;
  flex-direction: column;
  padding-block: 32px;
`;
