"use client";

import { Settings } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import { Button } from "@/components/Button";
import { formatDateForDisplay, isToday } from "@/hooks/utils";
import {
  useDayPlanActions,
  useEnergyConfiguration,
} from "../../../lib/energy-planner/hooks";
import { usePoints } from "../../../lib/points/context";
import { Modal } from "../../Modal";
import { EnergyTypeManagerModal } from "../EnergyTypeManager";

interface EnergyCapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnergyCapacityModal({
  isOpen,
  onClose,
}: EnergyCapacityModalProps) {
  const { dailyCapacity, setDailyCapacity, energyTypes } =
    useEnergyConfiguration();
  const { currentDate } = useDayPlanActions();
  const { awardPoints } = usePoints();
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const viewingToday = isToday(currentDate);

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

  const description = viewingToday
    ? "How much energy do you have today?"
    : `Capacity for ${formatDateForDisplay(currentDate)}`;

  return (
    <Modal
      description={description}
      isOpen={isOpen}
      onClose={onClose}
      showDescription={true}
      title="Daily Energy Capacity"
    >
      <Container>
        <Grid>
          {energyTypes.map((type) => (
            <InputGroup key={type.id}>
              <Label htmlFor={`capacity-${type.id}`}>{type.label}</Label>
              <Value>{dailyCapacity[type.id] || 0}%</Value>
              <Input
                $energyColor={type.color}
                id={`capacity-${type.id}`}
                max="100"
                min="0"
                onChange={(e) => handleChange(type.id, e.target.value)}
                type="range"
                value={dailyCapacity[type.id] || 0}
              />
            </InputGroup>
          ))}
        </Grid>

        <Footer>
          <Button
            fullWidth
            intent="secondary"
            leftIcon={<Settings size={16} />}
            onClick={() => setIsManagerOpen(true)}
            variant="outline"
          >
            Manage Energy Types
          </Button>
          <Button
            fullWidth
            onClick={(e) => {
              awardPoints(3, e.currentTarget.getBoundingClientRect());
              onClose();
            }}
          >
            Save
          </Button>
        </Footer>

        {isManagerOpen && (
          <EnergyTypeManagerModal
            isOpen={isManagerOpen}
            onClose={() => setIsManagerOpen(false)}
          />
        )}
      </Container>
    </Modal>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Grid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  text-transform: capitalize;
  font-weight: 500;
  font-size: 0.95rem;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
`;

const Value = styled.span`
  font-size: 0.875rem;
  text-align: right;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;

const Input = styled.input<{ $energyColor: string }>`
  width: 100%;
  accent-color: ${({ $energyColor }) => $energyColor};
  grid-column: 1 / span 2;
  margin-top: 4px;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
`;
