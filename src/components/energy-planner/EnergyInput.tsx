"use client";

import { Pencil, Settings } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { formatDateForDisplay, isToday } from "@/hooks/utils";
import { useEnergyPlanner } from "../../lib/energy-planner/context";
import { EnergyTypeManagerModal } from "./EnergyTypeManager";

export function EnergyInput() {
  const { dailyCapacity, setDailyCapacity, energyTypes, currentDate } =
    useEnergyPlanner();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const viewingToday = isToday(currentDate);
  const canEdit = viewingToday || isEditMode;

  const handleChange = (typeId: string, value: string) => {
    if (!canEdit) return;
    const numValue = Math.min(
      100,
      Math.max(0, Number.parseInt(value, 10) || 0),
    );
    setDailyCapacity({
      ...dailyCapacity,
      [typeId]: numValue,
    });
  };

  const headerText = viewingToday
    ? "How much energy do you have today?"
    : `Capacity for ${formatDateForDisplay(currentDate)}`;

  return (
    <Container>
      <Header>
        <div>
          <h2>Daily Energy Capacity</h2>
          <p>{headerText}</p>
        </div>
        <ButtonGroup>
          {!(viewingToday || isEditMode) && (
            <EditButton onClick={() => setIsEditMode(true)} type="button">
              <Pencil size={16} />
              Edit Capacities
            </EditButton>
          )}
          {!viewingToday && isEditMode && (
            <EditButton onClick={() => setIsEditMode(false)} type="button">
              Done Editing
            </EditButton>
          )}
          <SettingsButton onClick={() => setIsModalOpen(true)} type="button">
            <Settings size={20} />
            Manage Energy Types
          </SettingsButton>
        </ButtonGroup>
      </Header>
      {!(viewingToday || isEditMode) && (
        <ReadOnlyBadge>Viewing past/future date (read-only)</ReadOnlyBadge>
      )}
      {!viewingToday && isEditMode && (
        <EditingBadge>Editing capacities for a different day</EditingBadge>
      )}
      <Grid>
        {energyTypes.map((type) => (
          <InputGroup key={type.id}>
            <Label htmlFor={`capacity-${type.id}`}>{type.label}</Label>
            <Input
              $energyColor={type.color}
              disabled={!canEdit}
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const EditButton = styled.button`
  --color: var(--color-primary-600);
  background: transparent;
  border: 1px solid var(--color);
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--color);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--color-primary-50);
    color: var(--color-primary-700);
  }
`;

const ReadOnlyBadge = styled.div`
  background-color: light-dark(var(--color-grey-100), var(--color-grey-600));
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
`;

const EditingBadge = styled.div`
  background-color: light-dark(var(--color-orange-100), oklch(25% 0.05 50));
  color: var(--color-orange-800);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 1rem;
  border: 1px solid var(--color-orange-300);
`;
