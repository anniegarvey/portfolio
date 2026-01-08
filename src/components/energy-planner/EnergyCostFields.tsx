"use client";

import { styled } from "next-yak";
import { useId } from "react";
import type { EnergyCost } from "../../lib/energy-planner/schema";
import { EnergyTypeEnum } from "../../lib/energy-planner/schema";

interface EnergyCostFieldsProps {
  energyCost: EnergyCost;
  onChange: (cost: EnergyCost) => void;
}

export function EnergyCostFields({
  energyCost,
  onChange,
}: EnergyCostFieldsProps) {
  const idPrefix = useId();
  return (
    <>
      <SectionTitle>Energy Cost (0-100)</SectionTitle>
      <Grid>
        {Object.keys(EnergyTypeEnum.enum).map((type) => (
          <Field key={type}>
            <Label htmlFor={`${idPrefix}-${type}`}>{type}</Label>
            <NumberInput
              id={`${idPrefix}-${type}`}
              max="100"
              min="0"
              onChange={(e) =>
                onChange({
                  ...energyCost,
                  [type]: Number(e.target.value),
                })
              }
              type="number"
              value={energyCost[type as keyof EnergyCost]}
            />
          </Field>
        ))}
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
