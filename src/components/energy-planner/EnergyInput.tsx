"use client";

import { Settings } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { useEnergyPlanner } from "../../lib/energy-planner/context";
import { EnergyTypeManagerModal } from "./EnergyTypeManager";

export function EnergyInput() {
  const { dailyCapacity, setDailyCapacity, energyTypes } = useEnergyPlanner();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (typeId: string, value: string) => {
    const numValue = Math.min(
      100,
      Math.max(0, Number.parseInt(value, 10) || 0),
    );
    setDailyCapacity({
      ...dailyCapacity,
      [typeId]: numValue,
    });
  };

  return (
    <Container>
      <Header>
        <div>
          <h2>Daily Energy Capacity</h2>
          <p>How much energy do you have today?</p>
        </div>
        <SettingsButton onClick={() => setIsModalOpen(true)} type="button">
          <Settings size={20} />
          Manage Energy Types
        </SettingsButton>
      </Header>
      <Grid>
        {energyTypes.map((type) => (
          <InputGroup key={type.id}>
            <Label htmlFor={`capacity-${type.id}`}>{type.label}</Label>
            <Input
              $energyColor={type.color}
              id={`capacity-${type.id}`}
              max="100"
              min="0"
              onChange={(e) => handleChange(type.id, e.target.value)}
              type="range"
              value={dailyCapacity[type.id] || 0}
            />
            <Value>{dailyCapacity[type.id] || 0}%</Value>
          </InputGroup>
        ))}
      </Grid>
      <EnergyTypeManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Container>
  );
}

const Container = styled.div`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-700));
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const SettingsButton = styled.button`
  --color: light-dark(var(--color-grey-700), var(--color-grey-300));
  background: transparent;
  border: 1px solid var(--color);
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--color);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.15s ease;

  &:hover {
    background-color: light-dark(var(--color-grey-100), var(--color-grey-600));
    color: light-dark(var(--color-grey-800), var(--color-grey-200));
  }
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

const Input = styled.input<{ $energyColor: string }>`
  width: 100%;
  accent-color: ${({ $energyColor }) => $energyColor};
`;
