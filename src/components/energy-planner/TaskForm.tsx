"use client";

import { styled } from "next-yak";
import { useState } from "react";
import { useEnergyPlanner } from "../../lib/energy-planner/context";
import type { EnergyCost, Task } from "../../lib/energy-planner/schema";
import { EnergyCostFields } from "./EnergyCostFields";
import { TaskFactorFields } from "./TaskFactorFields";

interface TaskFormProps {
  initialData?: Task;
  onClose?: () => void;
}

export function TaskForm({ initialData, onClose }: TaskFormProps) {
  const { addTask, updateTask } = useEnergyPlanner();
  const [title, setTitle] = useState(initialData?.title || "");
  const [energyCost, setEnergyCost] = useState<EnergyCost>(
    initialData?.energyCost || {
      physical: 10,
      social: 10,
      executive: 10,
    },
  );
  const [factors, setFactors] = useState(
    initialData?.factors || {
      initiationDifficulty: 5,
      terminationDifficulty: 5,
      isRestorative: false,
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    if (initialData) {
      updateTask({
        ...initialData,
        title,
        energyCost,
        factors,
      });
    } else {
      addTask({
        title,
        description: "",
        energyCost,
        factors,
      });
    }

    if (onClose) {
      onClose();
    } else {
      // Reset form if just adding
      setTitle("");
      setEnergyCost({ physical: 10, social: 10, executive: 10 });
      setFactors({
        initiationDifficulty: 5,
        terminationDifficulty: 5,
        isRestorative: false,
      });
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Field>
          <Label>Task Name</Label>
          <TextInput
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Do Laundry"
            required
            value={title}
          />
        </Field>

        <EnergyCostFields energyCost={energyCost} onChange={setEnergyCost} />

        <TaskFactorFields factors={factors} onChange={setFactors} />

        <Button type="submit">
          {initialData ? "Update Task" : "Add Task"}
        </Button>
      </Form>
    </Container>
  );
}

const Container = styled.div`
  /* Removed container styles as this will be in a modal */
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
`;

const Label = styled.label`
    text-transform: capitalize;
    font-size: 0.875rem;
    font-weight: 500;
`;

const TextInput = styled.input`
    padding: 0.5rem;
    border: 1px solid var(--color-grey-300);
    border-radius: 0.25rem;
    background: transparent;
    color: inherit;
`;

const Button = styled.button`
    background-color: var(--color-primary-600);
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.25rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;

    &:hover {
        background-color: var(--color-primary-700);
    }
`;
