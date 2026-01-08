"use client";

import { Plus } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { DayPlanner } from "../../components/energy-planner/DayPlanner";
import { EnergyInput } from "../../components/energy-planner/EnergyInput";
import { TaskForm } from "../../components/energy-planner/TaskForm";
import MaxWidthWrapper from "../../components/MaxWidthWrapper";
import { Modal } from "../../components/Modal";
import { EnergyPlannerProvider } from "../../lib/energy-planner/context";
import type { Task } from "../../lib/energy-planner/schema";

function PlannerContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

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

  return (
    <MaxWidthWrapper>
      <PageLayout>
        <HeaderSection>
          <h1>Energy Planner</h1>
          <p>
            Plan your day according to your energy levels. Based on extended
            Spoon Theory.
          </p>
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
    
    h1 {
        margin-bottom: 0.5rem;
    }
    
    p {
        color: var(--color-grey-600);
        font-size: 1.1rem;
    }
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
