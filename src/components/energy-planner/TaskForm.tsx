"use client";

import { styled } from "next-yak";
import { useTaskForm } from "@/hooks/useTaskForm";
import type { Task } from "@/lib/energy-planner/schema";
import { EnergyCostFields } from "./EnergyCostFields";
import { TaskFactorFields } from "./TaskFactorFields";

interface TaskFormProps {
  initialData?: Task;
  onClose?: () => void;
}

export function TaskForm({ initialData, onClose }: TaskFormProps) {
  const {
    title,
    setTitle,
    energyCost,
    setEnergyCost,
    factors,
    setFactors,
    handleSubmit,
    formId,
  } = useTaskForm({ initialData, onClose });

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor={`${formId}-title`}>Task Name</Label>
          <TextInput
            id={`${formId}-title`}
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
