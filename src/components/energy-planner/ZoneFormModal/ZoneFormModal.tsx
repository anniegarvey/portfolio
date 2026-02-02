"use client";

import { styled } from "next-yak";
import { useEffect, useId, useState } from "react";
import type { ZoneConfig } from "@/lib/energy-planner/schema";
import { Modal } from "../../Modal";
import { Button } from "../common";

interface ZoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (zone: Omit<ZoneConfig, "id"> | ZoneConfig) => void;
  editingZone?: ZoneConfig | null;
}

export function ZoneFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingZone,
}: ZoneFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const nameId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (isOpen) {
      if (editingZone) {
        setName(editingZone.name);
        setDescription(editingZone.description || "");
      } else {
        setName("");
        setDescription("");
      }
    }
  }, [isOpen, editingZone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingZone) {
      onSubmit({
        ...editingZone,
        name: name.trim(),
        description: description.trim(),
      });
    } else {
      onSubmit({
        name: name.trim(),
        description: description.trim(),
        order: 0, // Order will be handled by the parent
      });
    }
    onClose();
  };

  return (
    <Modal
      description={
        editingZone
          ? "Update the details of your energy zone."
          : "Create a new energy zone to organize your tasks."
      }
      isOpen={isOpen}
      onClose={onClose}
      title={editingZone ? "Edit Zone" : "Add New Zone"}
    >
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor={nameId}>Name</Label>
          <Input
            autoFocus
            id={nameId}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Focus"
            required
            value={name}
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor={descriptionId}>Description (Optional)</Label>
          <TextArea
            id={descriptionId}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What kind of tasks happen here?"
            rows={3}
            value={description}
          />
        </FormGroup>

        <Actions>
          <Button intent="secondary" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button type="submit">
            {editingZone ? "Save Changes" : "Create Zone"}
          </Button>
        </Actions>
      </Form>
    </Modal>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-200));
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  font-size: 1rem;
  background-color: light-dark(#ffffff, var(--color-grey-900));
  color: light-dark(var(--color-grey-900), var(--color-grey-100));

  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-100);
  }
`;

const TextArea = styled.textarea`
  padding: 8px 12px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  background-color: light-dark(#ffffff, var(--color-grey-900));
  color: light-dark(var(--color-grey-900), var(--color-grey-100));

  &:focus {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-100);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;
