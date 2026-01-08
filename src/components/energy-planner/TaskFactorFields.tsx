"use client";

import { styled } from "next-yak";
import type { TaskFactor } from "../../lib/energy-planner/schema";

interface TaskFactorFieldsProps {
  factors: TaskFactor;
  onChange: (factors: TaskFactor) => void;
}

export function TaskFactorFields({ factors, onChange }: TaskFactorFieldsProps) {
  return (
    <>
      <SectionTitle>Task Factors</SectionTitle>
      <Grid>
        <Field>
          <Label>Start Difficulty (1-10)</Label>
          <NumberInput
            max="10"
            min="1"
            onChange={(e) =>
              onChange({
                ...factors,
                initiationDifficulty: Number(e.target.value),
              })
            }
            type="number"
            value={factors.initiationDifficulty}
          />
        </Field>
        <Field>
          <Label>Stop Difficulty (1-10)</Label>
          <NumberInput
            max="10"
            min="1"
            onChange={(e) =>
              onChange({
                ...factors,
                terminationDifficulty: Number(e.target.value),
              })
            }
            type="number"
            value={factors.terminationDifficulty}
          />
        </Field>
        <Field>
          <Label>Restorative?</Label>
          <CheckboxInput
            checked={factors.isRestorative}
            onChange={(e) =>
              onChange({ ...factors, isRestorative: e.target.checked })
            }
            type="checkbox"
          />
        </Field>
      </Grid>
    </>
  );
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`;

const SectionTitle = styled.div`
    font-size: 0.875rem;
    font-weight: bold;
    margin-top: 0.5rem;
    color: var(--color-grey-500);
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

const CheckboxInput = styled.input`
    width: 1.5rem;
    height: 1.5rem;
    accent-color: var(--color-primary-600);
`;
