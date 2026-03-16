"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Settings } from "lucide-react";
import { styled } from "next-yak";
import type {
  Activity,
  ResolvedActivity,
  ZoneConfig,
} from "@/lib/energy-planner/schema";
import { Button } from "../common";
import { PlannedActivityCard } from "../PlannerActivityCard";
import { SortableItem } from "../SortableItem";

interface ZoneSectionProps {
  zone: ZoneConfig;
  activities: ResolvedActivity[];
  dayContext: "today" | "past" | "future";
  onAddActivity: () => void;
  onEditActivity: (activity: Activity) => void;
  onRemove: (instanceId: string) => void;
  onMove: (instanceId: string, date: string) => void;
  onToggleCompletion: (instanceId: string) => void;
  onManageZones: () => void;
}

export function ZoneSection({
  zone,
  activities,
  dayContext,
  onAddActivity,
  onEditActivity,
  onRemove,
  onMove,
  onToggleCompletion,
  onManageZones,
}: ZoneSectionProps) {
  const { setNodeRef } = useDroppable({
    id: zone.id,
  });

  return (
    <ZoneContainer data-testid={`zone-${zone.id}`} ref={setNodeRef}>
      <ZoneHeaderWrapper>
        <HeaderContent>
          <ZoneTitle>{zone.name}</ZoneTitle>
          {zone.description && (
            <ZoneDescription>{zone.description}</ZoneDescription>
          )}
        </HeaderContent>
        <Button
          intent="secondary"
          onClick={onManageZones}
          size="icon"
          title="Manage Zones"
          variant="outline"
        >
          <Settings size={16} />
        </Button>
      </ZoneHeaderWrapper>
      <SortableContext
        id={zone.id}
        items={activities.map(({ instance }) => instance.id)}
        strategy={verticalListSortingStrategy}
      >
        <ZoneActivityList data-testid={`zone-activities-${zone.id}`}>
          {activities.length === 0 && (
            <EmptyZone>No activities in this zone</EmptyZone>
          )}
          {activities.map(({ instance, activity }) => (
            <SortableItem id={instance.id} key={instance.id}>
              {({ dragHandleProps }) => (
                <PlannedActivityCard
                  activity={activity}
                  completed={instance.completed}
                  dayContext={dayContext}
                  dragHandleProps={dragHandleProps}
                  instance={instance}
                  onEdit={onEditActivity}
                  onMove={onMove}
                  onRemove={onRemove}
                  onToggleCompletion={onToggleCompletion}
                />
              )}
            </SortableItem>
          ))}
        </ZoneActivityList>
      </SortableContext>
      <Button
        aria-label={`Add activity to ${zone.name}`}
        leftIcon={<Plus size={16} />}
        onClick={onAddActivity}
        variant="dashed"
      >
        Add Activity
      </Button>
    </ZoneContainer>
  );
}

const ZoneContainer = styled.div`
  border: 2px dotted light-dark(var(--color-grey-300), var(--color-grey-500));
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ZoneTitle = styled.h4`
  font-weight: 600;
  font-size: 0.95rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-200));
  margin: 0;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ZoneDescription = styled.p`
  font-size: 0.8rem;
  font-weight: 400;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  margin: 0;
`;

const ZoneHeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid light-dark(var(--color-grey-200), var(--color-grey-600));
`;

const ZoneActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 50px;
`;

const EmptyZone = styled.div`
  text-align: center;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
  font-style: italic;
  font-size: 0.875rem;
  padding: 16px 0;
`;
