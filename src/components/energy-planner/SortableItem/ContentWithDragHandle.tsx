import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { styled } from "next-yak";
import type { ReactNode } from "react";

interface ContentWithDragHandleProps {
  listeners: DraggableSyntheticListeners;
  attributes: DraggableAttributes;
  ariaLabel: string;
  children: ReactNode;
}

export function ContentWithDragHandle({
  listeners,
  attributes,
  ariaLabel,
  children,
}: ContentWithDragHandleProps) {
  return (
    <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
      <DragHandle {...listeners} {...attributes} aria-label={ariaLabel}>
        <GripVertical size={16} />
      </DragHandle>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

const DragHandle = styled.div`
  color: light-dark(var(--color-grey-400), var(--color-grey-500));
  cursor: grab;
  padding: 8px;
  &:active {
    cursor: grabbing;
  }
`;
