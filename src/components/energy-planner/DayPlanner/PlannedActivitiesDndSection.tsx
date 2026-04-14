import {
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
import { PlannedActivityCard } from "../PlannerActivityCard";
import { ZoneSection } from "../ZoneSection";

interface PlannedActivitiesDndSectionProps {
  zones: ZoneConfig[];
  activitiesByZone: Map<string, ResolvedActivity[]>;
  dayContext: "today" | "past" | "future";
  activeResolved: ResolvedActivity | null;
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
  return (
    <Section>
      <DndContext
        collisionDetection={rectIntersection}
        modifiers={[restrictToVerticalAxis]}
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
        <DragOverlay>
          {activeResolved ? (
            <PlannedActivityCard
              activity={activeResolved.activity}
              completed={activeResolved.instance.completed}
              dayContext={dayContext}
              dragHandleProps={{
                listeners: {} as DraggableSyntheticListeners,
                attributes: {} as DraggableAttributes,
                ref: () => {},
              }}
              instance={activeResolved.instance}
              onEdit={onEditActivity}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </Section>
  );
}

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
