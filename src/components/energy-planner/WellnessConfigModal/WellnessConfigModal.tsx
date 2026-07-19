"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { styled } from "next-yak";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/Button";
import { useWellnessCheck } from "@/lib/wellness/context";
import type { WellnessConfig, WellnessMetric } from "@/lib/wellness/schema";
import { WellnessUnitSchema } from "@/lib/wellness/schema";
import { Modal } from "../../Modal";
import { ContentWithDragHandle } from "../SortableItem";
import { WellnessMetricFormModal } from "./WellnessMetricFormModal";

interface WellnessConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WellnessConfigModal({
  isOpen,
  onClose,
}: WellnessConfigModalProps) {
  const { config, saveConfig } = useWellnessCheck();
  const [draft, setDraft] = useState<WellnessConfig>(config);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(
    null,
  );
  const [isMetricFormOpen, setIsMetricFormOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<WellnessMetric | null>(
    null,
  );

  const frequencyId = useId();
  const unitId = useId();

  useEffect(() => {
    if (isOpen) setDraft(config);
  }, [isOpen, config]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = draft.metrics.findIndex((m) => m.id === active.id);
      const newIndex = draft.metrics.findIndex((m) => m.id === over.id);
      setDraft((d) => ({
        ...d,
        metrics: arrayMove(d.metrics, oldIndex, newIndex),
      }));
    }
  };

  const startAdding = () => {
    setEditingMetric(null);
    setIsMetricFormOpen(true);
  };

  const startEditing = (metric: WellnessMetric) => {
    setEditingMetric(metric);
    setIsMetricFormOpen(true);
  };

  const handleMetricSubmit = (
    metric: Omit<WellnessMetric, "id"> | WellnessMetric,
  ) => {
    if (editingMetric) {
      setDraft((d) => ({
        ...d,
        metrics: d.metrics.map((m) =>
          m.id === editingMetric.id ? { ...metric, id: editingMetric.id } : m,
        ),
      }));
    } else {
      setDraft((d) => ({
        ...d,
        metrics: [...d.metrics, { ...metric, id: uuidv4() }],
      }));
    }
  };

  const handleDeleteConfirmed = () => {
    if (!deleteConfirmation) return;
    setDraft((d) => ({
      ...d,
      metrics: d.metrics.filter((m) => m.id !== deleteConfirmation),
    }));
    setDeleteConfirmation(null);
  };

  const handleSave = async () => {
    await saveConfig(draft);
    onClose();
  };

  const units = WellnessUnitSchema.options;

  return (
    <Modal
      description="Configure your wellness check cadence and metrics."
      isOpen={isOpen}
      onClose={onClose}
      title="Wellness Check Settings"
    >
      <Container>
        <Section>
          <SectionTitle>Check cadence</SectionTitle>
          <CadenceRow>
            <CadenceLabel htmlFor={frequencyId}>Every</CadenceLabel>
            <FrequencyInput
              id={frequencyId}
              min={1}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  frequency: Math.max(
                    1,
                    Number.parseInt(e.target.value, 10) || 1,
                  ),
                }))
              }
              type="number"
              value={draft.frequency}
            />
            <UnitSelect
              id={unitId}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  unit: e.target.value as WellnessConfig["unit"],
                }))
              }
              value={draft.unit}
            >
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </UnitSelect>
          </CadenceRow>
        </Section>

        <Section>
          <SectionTitle>Metrics</SectionTitle>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={draft.metrics.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <MetricList>
                {draft.metrics.map((metric) => (
                  <SortableMetricItem id={metric.id} key={metric.id}>
                    <MetricContent>
                      <MetricInfo>
                        <MetricName>{metric.label}</MetricName>
                        {(metric.lowLabel || metric.highLabel) && (
                          <MetricEndpoints>
                            {metric.lowLabel && (
                              <EndpointChip>1 – {metric.lowLabel}</EndpointChip>
                            )}
                            {metric.highLabel && (
                              <EndpointChip>
                                5 – {metric.highLabel}
                              </EndpointChip>
                            )}
                          </MetricEndpoints>
                        )}
                      </MetricInfo>
                      <Actions>
                        <Button
                          aria-label={`Edit ${metric.label}`}
                          intent="secondary"
                          onClick={() => startEditing(metric)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          aria-label={
                            draft.metrics.length <= 1
                              ? "Cannot remove last metric"
                              : `Remove ${metric.label}`
                          }
                          disabled={draft.metrics.length <= 1}
                          intent="secondary"
                          onClick={() => setDeleteConfirmation(metric.id)}
                          size="icon"
                          title={
                            draft.metrics.length <= 1
                              ? "Cannot remove last metric"
                              : `Remove ${metric.label}`
                          }
                          variant="ghost"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </Actions>
                    </MetricContent>
                  </SortableMetricItem>
                ))}
              </MetricList>
            </SortableContext>
          </DndContext>

          <Button
            fullWidth
            leftIcon={<Plus size={16} />}
            onClick={startAdding}
            variant="dashed"
          >
            Add Metric
          </Button>
        </Section>

        <FooterActions>
          <Button intent="secondary" onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </FooterActions>
      </Container>

      {deleteConfirmation && (
        <Modal
          description="This metric will be removed from future checks. Past entries that recorded this metric are not affected."
          isOpen={true}
          onClose={() => setDeleteConfirmation(null)}
          showDescription={true}
          title="Remove Metric?"
        >
          <ConfirmationActions>
            <Button intent="danger" onClick={handleDeleteConfirmed}>
              Remove
            </Button>
            <Button
              intent="secondary"
              onClick={() => setDeleteConfirmation(null)}
              variant="outline"
            >
              Cancel
            </Button>
          </ConfirmationActions>
        </Modal>
      )}

      <WellnessMetricFormModal
        editingMetric={editingMetric}
        isOpen={isMetricFormOpen}
        onClose={() => {
          setIsMetricFormOpen(false);
          setEditingMetric(null);
        }}
        onSubmit={handleMetricSubmit}
      />
    </Modal>
  );
}

function SortableMetricItem({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Item ref={setNodeRef} style={style}>
      <ContentWithDragHandle
        ariaLabel="Reorder metric"
        attributes={attributes}
        listeners={listeners}
      >
        {children}
      </ContentWithDragHandle>
    </Item>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CadenceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CadenceLabel = styled.label`
  font-size: 0.95rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  white-space: nowrap;
`;

const FrequencyInput = styled.input`
  width: 64px;
  padding: 8px 12px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  font-size: 1rem;
  background-color: light-dark(#ffffff, var(--color-grey-900));
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  text-align: center;

  &:focus-visible {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-100);
  }
`;

const UnitSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 6px;
  font-size: 1rem;
  background-color: light-dark(#ffffff, var(--color-grey-900));
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  cursor: pointer;

  &:focus-visible {
    outline: none;
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 2px var(--color-primary-100);
  }
`;

const MetricList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.div`
  background-color: light-dark(#ffffff, var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  border-radius: 6px;
`;

const MetricContent = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
`;

const MetricInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MetricName = styled.span`
  font-weight: 500;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
`;

const MetricEndpoints = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const EndpointChip = styled.span`
  font-size: 0.75rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  background-color: light-dark(var(--color-grey-100), var(--color-grey-700));
  border-radius: 4px;
  padding: 2px 6px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ConfirmationActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;
