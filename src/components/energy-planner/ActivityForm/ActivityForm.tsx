"use client";

import { styled } from "next-yak";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { useActivityForm } from "@/hooks/useActivityForm";
import { QUERIES } from "@/lib/constants";
import type { Activity, RepeatUnit } from "@/lib/energy-planner/schema";
import { ActivityFactorFields } from "../ActivityFactorFields";
import { Button } from "../common";
import { EnergyCostFields } from "../EnergyCostFields";

interface ActivityFormProps {
  initialData?: Activity;
  initialContext?: {
    date: string;
    zoneId?: string;
  };
  onClose?: () => void;
  // Called after a new one-off activity is successfully created with context
  onCreated?: () => void;
  focusRef?: React.RefObject<HTMLInputElement | null>;
}

export function ActivityForm({
  initialData,
  initialContext,
  onClose,
  onCreated,
  focusRef,
}: ActivityFormProps) {
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
  } = useActivityForm({ initialData, initialContext, onClose, onCreated });

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Label htmlFor={`${formId}-title`}>Activity Name</Label>
        <TextInput
          autoComplete="off"
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
          autoComplete="off"
          id={`${formId}-description`}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details…"
          value={description}
        />
      </Field>

      <EnergyCostFields energyCost={energyCost} onChange={setEnergyCost} />

      <ActivityFactorFields factors={factors} onChange={setFactors} />

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
          Repeat this activity
        </CheckboxLabel>
      </Field>

      {isRepeating && (
        <RepeatConfigRow>
          <RepeatFrequency>
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
          </RepeatFrequency>
          <RepeatNextDate>
            <Label
              htmlFor={`${formId}-nextDueDate`}
              style={{ fontSize: "0.8rem" }}
            >
              Next:
            </Label>
            <FrequencyInput
              aria-label="Next Due Date"
              id={`${formId}-nextDueDate`}
              onChange={(e) => setNextDueDate(e.target.value)}
              style={{ width: "auto" }}
              type="date"
              value={nextDueDate}
            />
          </RepeatNextDate>
        </RepeatConfigRow>
      )}

      <Button disabled={isLoading} isLoading={isLoading} type="submit">
        {initialData ? "Update Activity" : "Add Activity"}
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
    padding-left: 0;
    flex-wrap: wrap;

    @media (${QUERIES.PHONE_UP}) {
        padding-left: 1.5rem;
        gap: 0.75rem;
    }
`;

const RepeatFrequency = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const RepeatNextDate = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  @media (${QUERIES.PHONE_UP}) {
    margin-left: auto;
  }
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
