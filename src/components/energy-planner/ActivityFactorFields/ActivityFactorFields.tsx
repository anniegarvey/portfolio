"use client";

import { styled } from "next-yak";
import { useId } from "react";
import type { ActivityFactor } from "../../../lib/energy-planner/schema";

interface ActivityFactorFieldsProps {
  factors: ActivityFactor;
  onChange: (factors: ActivityFactor) => void;
}

export function ActivityFactorFields({
  factors,
  onChange,
}: ActivityFactorFieldsProps) {
  const idPrefix = useId();
  return (
    <Grid>
      <Field>
        <Label htmlFor={`${idPrefix}-start`}>Start Difficulty (0-10)</Label>
        <NumberInput
          id={`${idPrefix}-start`}
          max="10"
          min="0"
          onChange={(e) =>
            onChange({
              ...factors,
              initiationDifficulty: Number(e.target.value),
            })
          }
          type="number"
          value={
            factors.initiationDifficulty === 0
              ? ""
              : factors.initiationDifficulty
          }
        />
      </Field>
      <Field>
        <Label htmlFor={`${idPrefix}-stop`}>Stop Difficulty (0-10)</Label>
        <NumberInput
          id={`${idPrefix}-stop`}
          max="10"
          min="0"
          onChange={(e) =>
            onChange({
              ...factors,
              terminationDifficulty: Number(e.target.value),
            })
          }
          type="number"
          value={
            factors.terminationDifficulty === 0
              ? ""
              : factors.terminationDifficulty
          }
        />
      </Field>
      <Field>
        <CheckboxLabel htmlFor={`${idPrefix}-restorative`}>
          <CheckboxInput
            checked={factors.isRestorative}
            id={`${idPrefix}-restorative`}
            onChange={(e) =>
              onChange({ ...factors, isRestorative: e.target.checked })
            }
            type="checkbox"
          />
          Restorative?
        </CheckboxLabel>
      </Field>
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
  gap: 0.75rem;
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

const NumberInput = styled.input`
    padding: 0.5rem;
    border: 1px solid var(--color-grey-300);
    border-radius: 0.25rem;
    background: transparent;
    color: inherit;
`;

const CheckboxLabel = styled.label`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
`;

const CheckboxInput = styled.input`
    width: 1.5rem;
    height: 1.5rem;
    accent-color: var(--color-primary-600);
    flex-shrink: 0;
    cursor: pointer;
`;
