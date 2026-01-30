import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { styled } from "next-yak";
import type { ReactNode } from "react";

interface RenderProps {
  dragHandleProps: {
    listeners: DraggableSyntheticListeners;
    attributes: DraggableAttributes;
    ref: (node: HTMLElement | null) => void;
  };
  isDragging: boolean;
}

interface SortableItemProps {
  id: string;
  children: (props: RenderProps) => ReactNode;
  disabled?: boolean;
}

export function SortableItem({ id, children, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : "auto",
    position: "relative" as const,
  };

  return (
    <Item ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: {
          listeners,
          attributes,
          ref: setActivatorNodeRef,
        },
        isDragging,
      })}
    </Item>
  );
}

const Item = styled.div`
  touch-action: none;
`;
