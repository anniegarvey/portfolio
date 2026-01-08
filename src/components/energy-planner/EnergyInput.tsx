"use client";

import { styled } from "next-yak";
import { useEnergyPlanner } from "../../lib/energy-planner/context";
import type { EnergyCost } from "../../lib/energy-planner/schema";
import { EnergyTypeEnum } from "../../lib/energy-planner/schema";

export function EnergyInput() {
  const { dailyCapacity, setDailyCapacity } = useEnergyPlanner();

  const handleChange = (type: keyof EnergyCost, value: string) => {
    const numValue = Math.min(
      100,
      Math.max(0, Number.parseInt(value, 10) || 0),
    );
    setDailyCapacity({
      ...dailyCapacity,
      [type]: numValue,
    });
  };

  return (
    <Container>
      <h3>Daily Energy Capacity</h3>
      <p>How much energy do you have today?</p>
      <Grid>
        {Object.keys(EnergyTypeEnum.enum).map((type) => (
          <InputGroup key={type}>
            <Label htmlFor={`capacity-${type}`}>{type}</Label>
            <Input
              $energyType={type}
              id={`capacity-${type}`}
              max="100"
              min="0"
              onChange={(e) =>
                handleChange(type as keyof EnergyCost, e.target.value)
              }
              type="range"
              value={dailyCapacity[type as keyof EnergyCost]}
            />
            <Value>{dailyCapacity[type as keyof EnergyCost]}%</Value>
          </InputGroup>
        ))}
      </Grid>
    </Container>
  );
}

const Container = styled.div`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
`;

const Grid = styled.div`
  display: grid;
  gap: 1.5rem;
  margin-top: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  text-transform: capitalize;
  font-weight: 500;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
`;

const Value = styled.span`
  font-size: 0.875rem;
  text-align: right;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const Input = styled.input<{ $energyType: string }>`
  width: 100%;
  accent-color: ${({ $energyType }) => {
    if ($energyType === "physical") return "var(--color-teal-500)";
    if ($energyType === "social") return "var(--color-rose-500)";
    return "var(--color-orange-500)";
  }};
`;
