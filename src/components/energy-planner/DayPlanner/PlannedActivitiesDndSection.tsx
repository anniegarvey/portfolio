import {
  type Announcements,
  DndContext,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragOverEvent,
  DragOverlay,
  rectIntersection,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { styled } from "next-yak";
import type {
  Activity,
  ResolvedActivity,
  ZoneConfig,
} from "../../../lib/energy-planner/schema";
import {
  formatIdeaAge,
  IDEA_DRAG_PREFIX,
} from "../../../lib/energy-planner/utils";
import { IdeaCard, IdeasShelf } from "../IdeasShelf";
import { PlannedActivityCard } from "../PlannerActivityCard";
import { ZoneSection } from "../ZoneSection";

interface PlannedActivitiesDndSectionProps {
  zones: ZoneConfig[];
  activitiesByZone: Map<string, ResolvedActivity[]>;
  dayContext: "today" | "past" | "future";
  activeResolved: ResolvedActivity | null;
  // Unplanned one-offs for the shelf; left out on days that can't be planned
  ideas?: Activity[];
  activeIdea: Activity | null;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragStart: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAddActivity: (zoneId: string) => void;
  onEditActivity: (activity: Activity) => void;
  onManageZones: () => void;
  onMove: (instanceId: string, date: string) => void;
  onRemove: (instanceId: string) => void;
  onToggleCompletion: (instanceId: string) => void;
}

export function PlannedActivitiesDndSection({
  zones,
  activitiesByZone,
  dayContext,
  activeResolved,
  ideas,
  activeIdea,
  sensors,
  onDragStart,
  onDragEnd,
  onAddActivity,
  onEditActivity,
  onManageZones,
  onMove,
  onRemove,
  onToggleCompletion,
}: PlannedActivitiesDndSectionProps) {
  // Screen readers hear titles and zone names rather than internal ids
  const zoneOf = (id: string) =>
    zones.find(
      (zone) =>
        zone.id === id ||
        activitiesByZone
          .get(zone.id)
          ?.some(({ instance }) => instance.id === id),
    );
  const titleOf = (id: string) =>
    id.startsWith(IDEA_DRAG_PREFIX)
      ? ideas?.find((idea) => `${IDEA_DRAG_PREFIX}${idea.id}` === id)?.title
      : [...activitiesByZone.values()]
          .flat()
          .find(({ instance }) => instance.id === id)?.activity.title;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(String(active.id))}.`,
    onDragOver: ({ active, over }) => {
      const zone = over && zoneOf(String(over.id));
      return zone
        ? `${titleOf(String(active.id))} is over ${zone.name}.`
        : `${titleOf(String(active.id))} is not over a zone.`;
    },
    onDragEnd: ({ active, over }) => {
      const zone = over && zoneOf(String(over.id));
      return zone
        ? `Dropped ${titleOf(String(active.id))} in ${zone.name}.`
        : `Dropped ${titleOf(String(active.id))}.`;
    },
    onDragCancel: ({ active }) =>
      `Stopped dragging ${titleOf(String(active.id))}.`,
  };

  return (
    <Section>
      <DndContext
        accessibility={{ announcements }}
        collisionDetection={rectIntersection}
        // Ideas travel from the shelf to any zone, so only reordering is held
        // to the vertical axis
        modifiers={activeIdea ? undefined : [restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        sensors={sensors}
      >
        <ZonesContainer data-testid="selected-activities">
          {zones.map((zone) => (
            <ZoneSection
              activities={activitiesByZone.get(zone.id) ?? []}
              dayContext={dayContext}
              key={zone.id}
              onAddActivity={() => onAddActivity(zone.id)}
              onEditActivity={onEditActivity}
              onManageZones={onManageZones}
              onMove={onMove}
              onRemove={onRemove}
              onToggleCompletion={onToggleCompletion}
              zone={zone}
            />
          ))}
        </ZonesContainer>
        {ideas ? (
          <IdeasShelf ideas={ideas} onEditActivity={onEditActivity} />
        ) : null}
        <DragOverlay>
          {activeIdea ? (
            <IdeaCard
              activity={activeIdea}
              age={formatIdeaAge(activeIdea.createdAt, new Date())}
              dragHandleProps={OVERLAY_HANDLE}
              onEdit={onEditActivity}
            />
          ) : null}
          {activeResolved ? (
            <PlannedActivityCard
              activity={activeResolved.activity}
              completed={activeResolved.instance.completed}
              dayContext={dayContext}
              dragHandleProps={OVERLAY_HANDLE}
              instance={activeResolved.instance}
              onEdit={onEditActivity}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Section>
  );
}

// The overlay copy only needs to look draggable
const OVERLAY_HANDLE = {
  listeners: {} as DraggableSyntheticListeners,
  attributes: {} as DraggableAttributes,
  ref: () => {},
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ZonesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-inline: -12px;
`;
