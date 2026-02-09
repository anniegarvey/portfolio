"use client";

import { styled } from "next-yak";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { useTaskForm } from "@/hooks/useTaskForm";
import type { RepeatUnit, Task } from "@/lib/energy-planner/schema";
import { Button } from "../common";
import { EnergyCostFields } from "../EnergyCostFields";
import { TaskFactorFields } from "../TaskFactorFields";

interface TaskFormProps {
  initialData?: Task;
  initialContext?: {
    date: string;
    zoneId?: string;
  };
  onClose?: () => void;
  focusRef?: React.RefObject<HTMLInputElement | null>;
}

export function TaskForm({
  initialData,
  initialContext,
  onClose,
  focusRef,
}: TaskFormProps) {
  const {
    title,
    setTitle,
    description,
    setDescription,
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
    nextDueDate,
    setNextDueDate,
    handleSubmit,
    formId,
    isLoading,
    zones,
    defaultZoneId,
    setDefaultZoneId,
  } = useTaskForm({ initialData, initialContext, onClose });

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Label htmlFor={`${formId}-title`}>Task Name</Label>
        <TextInput
          id={`${formId}-title`}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Do Laundry"
          ref={focusRef}
          required
          value={title}
        />
      </Field>

      <Field>
        <Label htmlFor={`${formId}-description`}>Description</Label>
        <TextArea
          id={`${formId}-description`}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details..."
          value={description}
        />
      </Field>

      <EnergyCostFields energyCost={energyCost} onChange={setEnergyCost} />

      <TaskFactorFields factors={factors} onChange={setFactors} />

      <Field>
        <Label htmlFor={`${formId}-defaultZoneId`}>Default Zone</Label>
        <Select
          onValueChange={(val) =>
            setDefaultZoneId(val === "none" ? undefined : val)
          }
          value={defaultZoneId || "none"}
        >
          <SelectTrigger id={`${formId}-defaultZoneId`}>
            <SelectValue placeholder="Select a default zone..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

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
          <Select
            onValueChange={(val: RepeatUnit) => setUnit(val)}
            value={unit}
          >
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
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Label
              htmlFor={`${formId}-nextDueDate`}
              style={{ fontSize: "0.8rem" }}
            >
              Next:
            </Label>
            <DateInput
              aria-label="Next Due Date"
              id={`${formId}-nextDueDate`}
              onChange={(e) => setNextDueDate(e.target.value)}
              type="date"
              value={nextDueDate}
            />
          </div>
        </RepeatConfigRow>
      )}

      <Button disabled={isLoading} isLoading={isLoading} type="submit">
        {initialData ? "Update Task" : "Add Task"}
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
    flex-wrap: wrap; /* Allow wrapping on small screens */
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

const DateInput = styled.input`
    padding: 0.25rem 0.5rem;
    height: 36px;
    border: 1px solid var(--color-grey-300);
    border-radius: 6px;
    background: transparent;
    color: inherit;
    font-family: inherit;
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

const TextArea = styled.textarea`
    padding: 0.5rem;
    border: 1px solid var(--color-grey-300);
    border-radius: 0.25rem;
    background: transparent;
    color: inherit;
    min-height: 80px;
    resize: vertical;
    font-family: inherit;
`;
