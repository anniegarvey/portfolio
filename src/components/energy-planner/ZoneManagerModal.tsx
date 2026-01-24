"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DraggableAttributes,
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
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { styled } from "next-yak";
import { useState } from "react";
import type { ZoneConfig } from "@/lib/energy-planner/schema";
import { Modal } from "../Modal";
import { ZoneFormModal } from "./ZoneFormModal";

interface ZoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: ZoneConfig[];
  onAddZone: (zone: Omit<ZoneConfig, "id">) => void;
  onUpdateZone: (zone: ZoneConfig) => void;
  onRemoveZone: (zoneId: string) => void;
  onReorderZones: (newOrder: ZoneConfig[]) => void;
}

export function ZoneManagerModal({
  isOpen,
  onClose,
  zones,
  onAddZone,
  onUpdateZone,
  onRemoveZone,
  onReorderZones,
}: ZoneManagerModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneConfig | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = zones.findIndex((z) => z.id === active.id);
      const newIndex = zones.findIndex((z) => z.id === over.id);
      onReorderZones(arrayMove(zones, oldIndex, newIndex));
    }
  };

  const startAdding = () => {
    setEditingZone(null);
    setIsFormOpen(true);
  };

  const startEditing = (zone: ZoneConfig) => {
    setEditingZone(zone);
    setIsFormOpen(true);
  };

  return (
    <Modal
      description="Add, remove, rename, and reorder your energy zones."
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Zones"
    >
      <Container>
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext
            items={zones.map((z) => z.id)}
            strategy={verticalListSortingStrategy}
          >
            <ZoneList>
              {zones.map((zone) => (
                <SortableZoneItem id={zone.id} key={zone.id}>
                  <ZoneContent>
                    <ZoneName>
                      {zone.name}
                      {zone.description && (
                        <ZoneDescriptionPreview>
                          {zone.description}
                        </ZoneDescriptionPreview>
                      )}
                    </ZoneName>
                    <Actions>
                      <IconButton
                        aria-label={`Edit ${zone.name}`}
                        onClick={() => startEditing(zone)}
                        type="button"
                      >
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton
                        disabled={zones.length <= 1}
                        onClick={() => setDeleteConfirmation(zone.id)}
                        title={
                          zones.length <= 1
                            ? "Cannot remove last zone"
                            : `Remove ${zone.name}`
                        }
                        type="button"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Actions>
                  </ZoneContent>
                </SortableZoneItem>
              ))}
            </ZoneList>
          </SortableContext>
        </DndContext>

        <AddButton onClick={startAdding} type="button">
          <Plus size={16} /> Add Zone
        </AddButton>
      </Container>

      {deleteConfirmation && (
        <Modal
          description="This action cannot be undone. Any tasks in this zone will be moved to the default zone."
          isOpen={true}
          onClose={() => setDeleteConfirmation(null)}
          showDescription={true}
          title="Delete Zone?"
        >
          <ConfirmationActions>
            <Button
              onClick={() => {
                onRemoveZone(deleteConfirmation);
                setDeleteConfirmation(null);
              }}
              style={{ backgroundColor: "var(--color-rose-600)" }}
            >
              Delete
            </Button>
            <Button
              onClick={() => setDeleteConfirmation(null)}
              variant="secondary"
            >
              Cancel
            </Button>
          </ConfirmationActions>
        </Modal>
      )}

      <ZoneFormModal
        editingZone={editingZone}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingZone(null);
        }}
        onSubmit={(zone) => {
          if (editingZone) {
            onUpdateZone(zone as ZoneConfig);
          } else {
            onAddZone(zone);
          }
        }}
      />
    </Modal>
  );
}

const ConfirmationActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

function SortableZoneItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // We clone the first child (ZoneContent) to inject the handle with listeners
  // Or better, we just provide a context or render prop.
  // For simplicity since I control usage:
  // I will assume children is ZoneContent and I want to attach listeners to the DragHandle inside it.

  // Actually, sticking the listeners on the root "Item" is easier but prevents text selection in inputs.
  // We MUST use a handle.

  return (
    <Item ref={setNodeRef} style={style}>
      <ZoneContentWithHandle attributes={attributes} listeners={listeners}>
        {children}
      </ZoneContentWithHandle>
    </Item>
  );
}

import type { ReactNode } from "react";

function ZoneContentWithHandle({
  listeners,
  attributes,
  children,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: dnd-kit listeners are complex
  listeners: Record<string, any> | undefined;
  attributes: DraggableAttributes;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
      <DragHandle {...listeners} {...attributes}>
        <GripVertical size={16} />
      </DragHandle>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

// Correct implementation used above
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 200px;
`;

const ZoneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.div`
  background-color: light-dark(#ffffff, var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  border-radius: 6px;
  /* We use handle for drag */
`;

const ZoneContent = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 12px;
`;

const DragHandle = styled.div`
  color: light-dark(var(--color-grey-400), var(--color-grey-500));
  cursor: grab;
  padding: 8px;
  /* This needs to receive the dnd listeners */
  &:active {
    cursor: grabbing;
  }
`;

const ZoneName = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  font-weight: 500;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
`;

const ZoneDescriptionPreview = styled.span`
  font-size: 0.8rem;
  font-weight: 400;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: light-dark(var(--color-grey-100), var(--color-grey-700));
    color: light-dark(var(--color-grey-900), var(--color-grey-100));
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: 1px dashed var(--color-grey-300);
  border-radius: 6px;
  background: transparent;
  color: var(--color-grey-600);
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--color-primary-500);
    color: var(--color-primary-600);
    background-color: var(--color-primary-50);
  }
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 6px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.9rem;
  border: none;
  
  ${(props) =>
    props.variant === "secondary"
      ? `
    background-color: transparent;
    color: light-dark(var(--color-grey-600), var(--color-grey-400));
    border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
    &:hover { 
      background-color: light-dark(var(--color-grey-50), var(--color-grey-800)); 
      color: light-dark(var(--color-grey-800), var(--color-grey-200));
    }
  `
      : `
    background-color: var(--color-primary-600);
    color: white;
    &:hover { background-color: var(--color-primary-700); }
  `}
`;
