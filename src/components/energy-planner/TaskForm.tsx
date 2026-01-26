"use client";

import { styled } from "next-yak";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useTaskForm } from "@/hooks/useTaskForm";
import type { Task } from "@/lib/energy-planner/schema";
import { EnergyCostFields } from "./EnergyCostFields";
import { TaskFactorFields } from "./TaskFactorFields";

interface TaskFormProps {
  initialData?: Task;
  initialContext?: {
    date: string;
    zoneId?: string;
  };
  onClose?: () => void;
}

export function TaskForm({
  initialData,
  initialContext,
  onClose,
}: TaskFormProps) {
  const {
    title,
    setTitle,
    energyCost,
    setEnergyCost,
    factors,
    setFactors,
    isRepeating,
    setIsRepeating,
    frequency,
    setFrequency,
    unit,
    setUnit,
    handleSubmit,
    formId,
    isLoading,
  } = useTaskForm({ initialData, initialContext, onClose });

  return (
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

      <Field>
        <CheckboxLabel>
          <input
            checked={isRepeating}
            onChange={(e) => setIsRepeating(e.target.checked)}
            type="checkbox"
          />
          Repeat this task
        </CheckboxLabel>
      </Field>

      {isRepeating && (
        <RepeatConfigRow>
          <div>Every</div>
          <FrequencyInput
            aria-label="Frequency"
            data-testid="frequency-input"
            max={31}
            min={1}
            onChange={(e) => setFrequency(parseInt(e.target.value, 10) || 1)}
            type="number"
            value={frequency}
          />
          <Select onValueChange={(val: any) => setUnit(val)} value={unit}>
            <SelectTrigger aria-label="Repeat Unit">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </RepeatConfigRow>
      )}

      <Button disabled={isLoading} type="submit">
        {isLoading ? "Loading..." : initialData ? "Update Task" : "Add Task"}
      </Button>
    </Form>
  );
}

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
`;

const RepeatConfigRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-left: 1.5rem;
`;

const FrequencyInput = styled.input`
    padding: 0.25rem 0.5rem;
    width: 60px;
    height: 36px; /* Match Select height */
    border: 1px solid var(--color-grey-300);
    border-radius: 6px;
    background: transparent;
    color: inherit;
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
