"use client";

import { useDraggable } from "@dnd-kit/core";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Clock, Inbox } from "lucide-react";
import { styled } from "next-yak";
import { useId, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import type { Activity } from "@/lib/energy-planner/schema";
import {
  formatIdeaAge,
  IDEA_DRAG_PREFIX,
  type IdeaSort,
  sortIdeas,
} from "@/lib/energy-planner/utils";
import {
  AvailableActivityCard,
  type DragHandleProps,
} from "../PlannerActivityCard";

const SORT_STORAGE_KEY = "energy-planner-idea-sort";

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "least-energy": "Least energy first",
  "most-energy": "Most energy first",
};

function loadSort(): IdeaSort {
  try {
    return (localStorage.getItem(SORT_STORAGE_KEY) as IdeaSort) || "newest";
  } catch {
    return "newest";
  }
}

// Each helper once (ignoring case), from the ideas that use it
function getIdeaHelpers(ideas: Activity[]): string[] {
  const helpers = new Map<string, string>();
  for (const helper of ideas.flatMap((idea) => idea.helpers ?? [])) {
    const key = helper.toLowerCase();
    if (!helpers.has(key)) helpers.set(key, helper);
  }
  return [...helpers.values()];
}

interface IdeasShelfProps {
  ideas: Activity[];
  onEditActivity: (activity: Activity) => void;
}

// Unplanned one-offs, kept in view on the day plan so they aren't forgotten.
// They're planned by dragging them into a zone.
export function IdeasShelf({ ideas, onEditActivity }: IdeasShelfProps) {
  const headingId = useId();
  const [storedSort, setStoredSort] = useState<IdeaSort>(loadSort);
  const helpers = getIdeaHelpers(ideas);
  // A remembered helper may now be spelt differently on the ideas using it
  const storedHelper = helpers.find(
    (h) => `helper:${h}`.toLowerCase() === storedSort.toLowerCase(),
  );
  const sort: IdeaSort = storedHelper
    ? `helper:${storedHelper}`
    : storedSort in SORT_LABELS
      ? storedSort
      : "newest";
  const now = new Date();

  const handleSortChange = (value: string) => {
    setStoredSort(value as IdeaSort);
    try {
      localStorage.setItem(SORT_STORAGE_KEY, value);
    } catch {
      // Remembering the sort is only a convenience
    }
  };

  return (
    <Shelf aria-labelledby={headingId} data-testid="ideas-shelf">
      <Header>
        <Heading id={headingId}>
          <Inbox aria-hidden size={16} />
          Waiting to be planned ({ideas.length})
        </Heading>
        {ideas.length > 1 ? (
          <Select onValueChange={handleSortChange} value={sort}>
            <SortTrigger aria-label="Sort ideas">
              <SelectValue />
            </SortTrigger>
            <SelectContent>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
              {helpers.map((helper) => (
                <SelectItem key={helper} value={`helper:${helper}`}>
                  {helper} first
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </Header>
      {ideas.length === 0 ? (
        <Empty>
          Ideas you jot down wait here until you drag them into the day.
        </Empty>
      ) : (
        <List>
          {sortIdeas(ideas, sort).map((idea) => (
            <DraggableIdea
              age={formatIdeaAge(idea.createdAt, now)}
              idea={idea}
              key={idea.id}
              onEdit={onEditActivity}
            />
          ))}
        </List>
      )}
    </Shelf>
  );
}

function DraggableIdea({
  idea,
  age,
  onEdit,
}: {
  idea: Activity;
  age: string;
  onEdit: (activity: Activity) => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({ id: `${IDEA_DRAG_PREFIX}${idea.id}` });

  // The whole card is measured for the drag overlay; only the grip starts it
  return (
    <IdeaItem $isDragging={isDragging} ref={setNodeRef}>
      <IdeaCard
        activity={idea}
        age={age}
        dragHandleProps={{ attributes, listeners, ref: setActivatorNodeRef }}
        onEdit={onEdit}
      />
    </IdeaItem>
  );
}

// Also drawn under the pointer while dragging
export function IdeaCard({
  activity,
  age,
  onEdit,
  dragHandleProps,
}: {
  activity: Activity;
  age: string;
  onEdit: (activity: Activity) => void;
  dragHandleProps: DragHandleProps;
}) {
  return (
    <AvailableActivityCard
      activity={activity}
      dragHandleProps={dragHandleProps}
      dragLabel={`Drag into the day: ${activity.title}`}
      meta={
        <Age>
          <Clock aria-hidden size={12} />
          <VisuallyHidden>Waiting:</VisuallyHidden>
          {age}
        </Age>
      }
      onEdit={onEdit}
      showHelpers
    />
  );
}

const Shelf = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;

const Heading = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-200));

  svg {
    color: light-dark(var(--color-primary-600), var(--color-primary-300));
  }
`;

const SortTrigger = styled(SelectTrigger)`
  width: auto;
  min-width: 180px;
`;

const List = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 8px;
`;

const IdeaItem = styled.div<{ $isDragging: boolean }>`
  opacity: ${({ $isDragging }) => ($isDragging ? 0.4 : 1)};
`;

const Age = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: center;
  font-size: 0.75rem;
  white-space: nowrap;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Empty = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
