"use client";

import { styled } from "next-yak";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/Button";
import type { WellnessMetric } from "@/lib/wellness/schema";
import { Modal } from "../../Modal";

interface WellnessMetricFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (metric: Omit<WellnessMetric, "id"> | WellnessMetric) => void;
  editingMetric?: WellnessMetric | null;
}

export function WellnessMetricFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingMetric,
}: WellnessMetricFormModalProps) {
  const [label, setLabel] = useState("");
  const [lowLabel, setLowLabel] = useState("");
  const [highLabel, setHighLabel] = useState("");
  const labelId = useId();
  const lowLabelId = useId();
  const highLabelId = useId();

  useEffect(() => {
    if (isOpen) {
      if (editingMetric) {
        setLabel(editingMetric.label);
        setLowLabel(editingMetric.lowLabel ?? "");
        setHighLabel(editingMetric.highLabel ?? "");
      } else {
        setLabel("");
        setLowLabel("");
        setHighLabel("");
      }
    }
  }, [isOpen, editingMetric]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const metric = {
      ...(editingMetric ?? {}),
      label: label.trim(),
      lowLabel: lowLabel.trim() || undefined,
      highLabel: highLabel.trim() || undefined,
    };
    onSubmit(metric as Omit<WellnessMetric, "id"> | WellnessMetric);
    onClose();
  };

  return (
    <Modal
      description={
        editingMetric
          ? "Update this metric's name and endpoint labels."
          : "Add a new metric to your wellness check."
      }
      isOpen={isOpen}
      onClose={onClose}
      title={editingMetric ? "Edit Metric" : "Add Metric"}
    >
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor={labelId}>Metric name</Label>
          <Input
            autoComplete="off"
            autoFocus
            id={labelId}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Sleep quality"
            required
            value={label}
          />
        </FormGroup>

        <EndpointRow>
          <FormGroup>
            <Label htmlFor={lowLabelId}>Low label (optional)</Label>
            <Input
              autoComplete="off"
              id={lowLabelId}
              onChange={(e) => setLowLabel(e.target.value)}
              placeholder="e.g., Low"
              value={lowLabel}
            />
          </FormGroup>
          <FormGroup>
            <Label htmlFor={highLabelId}>High label (optional)</Label>
            <Input
              autoComplete="off"
              id={highLabelId}
              onChange={(e) => setHighLabel(e.target.value)}
              placeholder="e.g., Great"
              value={highLabel}
            />
          </FormGroup>
        </EndpointRow>

        <Actions>
          <Button intent="secondary" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button type="submit">
            {editingMetric ? "Save Changes" : "Add Metric"}
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
  flex: 1;
`;

const EndpointRow = styled.div`
  display: flex;
  gap: 12px;
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
  width: 100%;
  box-sizing: border-box;

  &:focus-visible {
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
