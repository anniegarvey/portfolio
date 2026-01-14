"use client";

import { styled } from "next-yak";
import { useId, useState } from "react";
import { useEnergyPlanner } from "../../lib/energy-planner/context";
import { PRESET_ENERGY_TYPES } from "../../lib/energy-planner/schema";
import { Modal } from "../Modal";

function EnergyTypeDialog({
  isOpen,
  onClose,
  onSave,
  editingType,
  label,
  setLabel,
  color,
  setColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingType: string | null;
  label: string;
  setLabel: (label: string) => void;
  color: string;
  setColor: (color: string) => void;
}) {
  const labelId = useId();
  const colorId = useId();

  const handlePresetClick = (preset: { label: string; color: string }) => {
    setLabel(preset.label);
    setColor(preset.color);
  };

  return (
    <Modal
      description="Manage what energy types matter most to you."
      isOpen={isOpen}
      onClose={onClose}
      showDescription
      title={editingType ? "Edit Energy Type" : "Add Energy Type"}
    >
      <FormField>
        <Label htmlFor={labelId}>Label</Label>
        <Input
          id={labelId}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g., Executive Functioning"
          type="text"
          value={label}
        />
      </FormField>

      <FormField>
        <Label>Preset Suggestions</Label>
        <PresetGrid>
          {PRESET_ENERGY_TYPES.map((preset) => (
            <PresetButton
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              type="button"
            >
              <ColorIndicator $color={preset.color} />
              {preset.label}
            </PresetButton>
          ))}
        </PresetGrid>
      </FormField>

      <FormField>
        <Label htmlFor={colorId}>Color</Label>
        <ColorPickerWrapper>
          <ColorInput
            id={colorId}
            onChange={(e) => setColor(e.target.value)}
            type="color"
            value={color}
          />
          <ColorValue>{color}</ColorValue>
        </ColorPickerWrapper>
      </FormField>

      <DialogActions>
        <CancelButton onClick={onClose} type="button">
          Cancel
        </CancelButton>
        <SaveButton onClick={onSave} type="button">
          {editingType ? "Update" : "Add"}
        </SaveButton>
      </DialogActions>
    </Modal>
  );
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Component complexity is acceptable
export function EnergyTypeManager() {
  const { energyTypes, addEnergyType, updateEnergyType, removeEnergyType } =
    useEnergyPlanner();
  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(
    null,
  );
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#14b8a6");

  const handleOpenDialog = (typeId?: string) => {
    if (typeId) {
      const type = energyTypes.find((t) => t.id === typeId);
      if (type) {
        setEditingType(typeId);
        setLabel(type.label);
        setColor(type.color);
      }
    } else {
      setEditingType(null);
      setLabel("");
      setColor("#14b8a6");
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingType(null);
    setLabel("");
    setColor("#14b8a6");
  };

  const handleSave = () => {
    if (!label.trim()) return;

    if (editingType) {
      const existingType = energyTypes.find((t) => t.id === editingType);
      if (existingType) {
        updateEnergyType({
          ...existingType,
          label: label.trim(),
          color,
        });
      }
    } else {
      addEnergyType({
        label: label.trim(),
        color,
      });
    }
    handleClose();
  };

  const handleDeleteCallback = (e: React.MouseEvent, typeId: string) => {
    e.stopPropagation();
    setDeleteCandidateId(typeId);
  };

  const confirmDelete = () => {
    removeEnergyType(deleteCandidateId as string);
    setDeleteCandidateId(null);
  };

  const cancelDelete = () => {
    setDeleteCandidateId(null);
  };

  return (
    <Container>
      <Header>
        <h3>Energy Types</h3>
        <AddButton onClick={() => handleOpenDialog()}>
          + Add Energy Type
        </AddButton>
      </Header>

      <TypeList>
        {energyTypes.map((type) => (
          <TypeItem key={type.id}>
            <ColorIndicator $color={type.color} />
            <TypeLabel>{type.label}</TypeLabel>
            <Actions>
              <ActionButton onClick={() => handleOpenDialog(type.id)}>
                Edit
              </ActionButton>
              <ActionButton
                onClick={(e) => handleDeleteCallback(e, type.id)}
                type="button"
              >
                Delete
              </ActionButton>
            </Actions>
          </TypeItem>
        ))}
      </TypeList>

      <EnergyTypeDialog
        color={color}
        editingType={editingType}
        isOpen={isOpen}
        label={label}
        onClose={handleClose}
        onSave={handleSave}
        setColor={setColor}
        setLabel={setLabel}
      />

      <Modal
        description="Are you sure you want to delete this energy type?"
        isOpen={!!deleteCandidateId}
        onClose={cancelDelete}
        showDescription
        title="Delete Energy Type"
      >
        <DialogActions>
          <CancelButton onClick={cancelDelete} type="button">
            Cancel
          </CancelButton>
          <DeleteConfirmButton onClick={confirmDelete} type="button">
            Delete
          </DeleteConfirmButton>
        </DialogActions>
      </Modal>
    </Container>
  );
}

const Container = styled.div`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h3 {
    margin: 0;
    color: light-dark(var(--color-grey-900), var(--color-grey-100));
  }
`;

const AddButton = styled.button`
  background-color: var(--color-teal-500);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: var(--color-teal-600);
  }
`;

const TypeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TypeItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: light-dark(white, var(--color-grey-700));
  border-radius: 0.25rem;
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-600));
`;

const ColorIndicator = styled.div<{ $color: string }>`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const TypeLabel = styled.span`
  flex: 1;
  font-weight: 500;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid var(--color-grey-300);
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));

  &:hover {
    background-color: light-dark(var(--color-grey-100), var(--color-grey-600));
  }
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-grey-300);
  border-radius: 0.25rem;
  background: light-dark(white, var(--color-grey-700));
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: var(--color-teal-500);
  }
`;

const PresetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
`;

const PresetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--color-grey-300);
  border-radius: 0.25rem;
  background: light-dark(white, var(--color-grey-700));
  cursor: pointer;
  font-size: 0.875rem;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));

  &:hover {
    background-color: light-dark(var(--color-grey-100), var(--color-grey-600));
  }
`;

const ColorPickerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ColorInput = styled.input`
  width: 4rem;
  height: 2.5rem;
  border: 1px solid var(--color-grey-300);
  border-radius: 0.25rem;
  cursor: pointer;
`;

const ColorValue = styled.span`
  font-family: monospace;
  font-size: 0.875rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid var(--color-grey-300);
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));

  &:hover {
    background-color: light-dark(var(--color-grey-100), var(--color-grey-600));
  }
`;

const SaveButton = styled.button`
  background-color: var(--color-teal-500);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: var(--color-teal-600);
  }
`;

const DeleteConfirmButton = styled.button`
  background-color: var(--color-rose-500, #f43f5e);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: var(--color-rose-600, #e11d48);
  }
`;
