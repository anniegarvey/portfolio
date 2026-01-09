"use client";

import { Download, Plus, Upload } from "lucide-react";
import { styled } from "next-yak";
import { useRef, useState } from "react";
import { DayPlanner } from "../../components/energy-planner/DayPlanner";
import { EnergyInput } from "../../components/energy-planner/EnergyInput";
import { TaskForm } from "../../components/energy-planner/TaskForm";
import MaxWidthWrapper from "../../components/MaxWidthWrapper";
import { Modal } from "../../components/Modal";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import type { Task } from "../../lib/energy-planner/schema";
import {
  exportEnergyPlannerData,
  importEnergyPlannerData,
} from "../../lib/energy-planner/utils";

function PlannerContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreate = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(undefined);
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
      alert(
        error instanceof Error
          ? error.message
          : "Failed to import data. Please check the file format.",
      );
    }
  };

  return (
    <MaxWidthWrapper>
      <PageLayout>
        <HeaderSection>
          <HeaderTop>
            <div>
              <h1>Energy Planner</h1>
              <p>
                Plan your day according to your energy levels. Based on extended
                Spoon Theory.
              </p>
            </div>
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
          </HeaderTop>
        </HeaderSection>

        <EnergyInput />

        <HeaderActions>
          <h3>Your Task Bank</h3>
          <CreateButton onClick={handleOpenCreate}>
            <Plus size={18} />
            New Task
          </CreateButton>
        </HeaderActions>

        <DayPlanner onEditTask={handleEditTask} />

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingTask ? "Edit Task" : "Create New Task"}
        >
          <TaskForm initialData={editingTask} onClose={handleCloseModal} />
        </Modal>
      </PageLayout>
    </MaxWidthWrapper>
  );
}

export default function EnergyPlannerPage() {
  return (
    <EnergyPlannerProvider>
      <PlannerContent />
    </EnergyPlannerProvider>
  );
}

const PageLayout = styled.div`
    padding-block: 2rem;
`;

const HeaderSection = styled.div`
    margin-bottom: 3rem;
`;

const HeaderTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
    margin-bottom: 0.5rem;
    
    h1 {
        margin-bottom: 0.5rem;
    }
    
    p {
        font-size: 1.1rem;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
`;

const HeaderActions = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
`;

const CreateButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--color-primary-600);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    font-weight: 600;
    cursor: pointer;
    
    &:hover {
        background-color: var(--color-primary-700);
    }
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
