"use client";

import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  ArrowRight,
  Check,
  CopyPlus,
  GripVertical,
  RotateCw,
  Trash2,
  Undo2,
} from "lucide-react";
import { css, styled } from "next-yak";
import { Button } from "@/components/Button";
import { getNextDay } from "../../../hooks/utils";
import { useEnergyPlanner } from "../../../lib/energy-planner/context";
import type {
  Activity,
  PlannedInstance,
} from "../../../lib/energy-planner/schema";
import { usePoints } from "../../../lib/points/context";

type DragHandleProps = {
  listeners: DraggableSyntheticListeners;
  attributes: DraggableAttributes;
  ref: (node: HTMLElement | null) => void;
};

// ─── Planned Activity Card ────────────────────────────────────────────────────
// Used in ZoneSection (day plan) and DragOverlay.

interface PlannedActivityCardProps {
  activity: Activity;
  instance: PlannedInstance;
  completed?: boolean;
  dayContext: "today" | "past" | "future";
  onEdit: (activity: Activity) => void;
  onToggleCompletion?: (instanceId: string) => void;
  onRemove?: (instanceId: string) => void;
  onMove?: (instanceId: string, date: string) => void;
  dragHandleProps?: DragHandleProps;
}

export function PlannedActivityCard({
  activity,
  instance,
  completed,
  dayContext,
  onEdit,
  onToggleCompletion,
  onRemove,
  onMove,
  dragHandleProps,
}: PlannedActivityCardProps) {
  const { energyTypes } = useEnergyPlanner();
  const { awardPoints } = usePoints();
  const isToday = dayContext === "today";
  const isPast = dayContext === "past";

  return (
    <Card $completed={completed} $isProjected={instance.isProjected} $selected>
      {dragHandleProps ? (
        <DragHandle
          {...dragHandleProps.listeners}
          {...dragHandleProps.attributes}
          aria-label={`Reorder activity: ${activity.title}`}
          ref={dragHandleProps.ref}
        >
          <GripVertical size={20} />
        </DragHandle>
      ) : null}
      <ActivityContent $completed={completed}>
        <ActivityTitleRow>
          <ActivityTitle onClick={() => onEdit(activity)}>
            {activity.title}
          </ActivityTitle>
        </ActivityTitleRow>
        {activity.description ? (
          <ActivityDescription onClick={() => onEdit(activity)}>
            {activity.description}
          </ActivityDescription>
        ) : null}
        <EnergyBadges>
          {energyTypes.map((type) => {
            const value = activity.energyCost[type.id] || 0;
            if (value === 0) return null;
            return (
              <Badge $color={type.color} key={type.id}>
                {value} {type.label.charAt(0).toUpperCase()}
              </Badge>
            );
          })}
          {activity.repeatConfig ? (
            <RepeatBadge title="Repeating Activity">
              <RotateCw size={12} />
              <VisuallyHidden>Repeat</VisuallyHidden>
            </RepeatBadge>
          ) : null}
        </EnergyBadges>
      </ActivityContent>
      <Actions>
        {onToggleCompletion && isToday ? (
          <Button
            aria-label={completed ? "Mark as not done" : "Mark as done"}
            intent={completed ? "danger" : "secondary"}
            onClick={(e) => {
              if (!completed) {
                const rect = e.currentTarget.getBoundingClientRect();
                awardPoints(
                  10,
                  rect.left + rect.width / 2,
                  rect.top + rect.height / 2,
                );
              }
              onToggleCompletion(instance.id);
            }}
            size="icon"
            title={completed ? "Mark as not done" : "Mark as done"}
            variant="ghost"
          >
            {completed ? <Undo2 size={18} /> : <Check size={18} />}
          </Button>
        ) : null}
        {!(completed || isPast) ? (
          <MoveDropdown
            activity={activity}
            instance={instance}
            onMove={onMove}
            onRemove={onRemove}
          />
        ) : null}
      </Actions>
    </Card>
  );
}

interface MoveDropdownProps {
  activity: Activity;
  instance: PlannedInstance;
  onMove?: (instanceId: string, date: string) => void;
  onRemove?: (instanceId: string) => void;
}

function MoveDropdown({
  activity,
  instance,
  onMove,
  onRemove,
}: MoveDropdownProps) {
  const { currentDate, moveActivityToDate, skipActivity } = useEnergyPlanner();
  const tomorrow = getNextDay(currentDate);
  const dayAfter = getNextDay(tomorrow);
  const handleMove = onMove ?? moveActivityToDate;

  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Move activity"
          size="icon"
          title="Move activity"
          variant="ghost"
        >
          <ArrowRight size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleMove(instance.id, tomorrow)}>
            Tomorrow
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMove(instance.id, dayAfter)}>
            Day after tomorrow
          </DropdownMenuItem>
          {activity.repeatConfig ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => skipActivity(instance.id)}>
                Skip this time
              </DropdownMenuItem>
            </>
          ) : null}
          {onRemove && !activity.repeatConfig ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRemove(instance.id)}>
                Return to unplanned
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuPrimitive.Root>
  );
}

// ─── Available Activity Card ──────────────────────────────────────────────────
// Used in AvailableActivitiesModal (unplanned activities list).

interface AvailableActivityCardProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onAdd?: (activityId: string) => void;
  onDelete?: (activityId: string) => void;
  dragHandleProps?: DragHandleProps;
}

export function AvailableActivityCard({
  activity,
  onEdit,
  onAdd,
  onDelete,
  dragHandleProps,
}: AvailableActivityCardProps) {
  const { energyTypes } = useEnergyPlanner();
  const { awardPoints } = usePoints();

  return (
    <Card>
      {dragHandleProps ? (
        <DragHandle
          {...dragHandleProps.listeners}
          {...dragHandleProps.attributes}
          aria-label={`Reorder activity: ${activity.title}`}
          ref={dragHandleProps.ref}
        >
          <GripVertical size={20} />
        </DragHandle>
      ) : null}
      <ActivityContent>
        <ActivityTitleRow>
          <ActivityTitle onClick={() => onEdit(activity)}>
            {activity.title}
          </ActivityTitle>
        </ActivityTitleRow>
        {activity.description ? (
          <ActivityDescription onClick={() => onEdit(activity)}>
            {activity.description}
          </ActivityDescription>
        ) : null}
        <EnergyBadges>
          {energyTypes.map((type) => {
            const value = activity.energyCost[type.id] || 0;
            if (value === 0) return null;
            return (
              <Badge $color={type.color} key={type.id}>
                {value} {type.label.charAt(0).toUpperCase()}
              </Badge>
            );
          })}
        </EnergyBadges>
      </ActivityContent>
      <Actions>
        {onDelete ? (
          <Button
            aria-label="Delete activity"
            intent="danger"
            onClick={() => onDelete(activity.id)}
            size="icon"
            title="Delete activity"
            variant="ghost"
          >
            <Trash2 size={18} />
          </Button>
        ) : null}
        {onAdd && !activity.repeatConfig ? (
          <Button
            aria-label="Add to day"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              awardPoints(
                3,
                rect.left + rect.width / 2,
                rect.top + rect.height / 2,
              );
              onAdd(activity.id);
            }}
            size="icon"
            title="Add to day"
            variant="ghost"
          >
            <CopyPlus size={18} />
          </Button>
        ) : null}
      </Actions>
    </Card>
  );
}

// ─── Shared Styled Components ─────────────────────────────────────────────────

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  margin-left: -14px;
  margin-right: -10px;
  color: var(--color-grey-400);
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
    color: var(--color-grey-600);
  }

  &:hover {
    color: var(--color-grey-500);
  }
`;

const Card = styled.article<{
  $selected?: boolean;
  $completed?: boolean;
  $isProjected?: boolean;
}>`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-900));
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--color-grey-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  transition: transform 0.1s;

  ${({ $isProjected }) =>
    $isProjected &&
    css`
      border-style: dashed;
      border-color: var(--color-blue-300);
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: var(--color-primary-400);
      border-style: solid;
    `}

  ${({ $completed }) =>
    $completed &&
    css`
      background-color: light-dark(var(--color-grey-100), var(--color-grey-700));
      border-color: var(--color-grey-300);
      opacity: 0.8;
    `}

  &:has(${DragHandle}:hover) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
`;

const ActivityContent = styled.div<{ $completed?: boolean }>`
  flex: 1;
  ${({ $completed }) =>
    $completed &&
    css`
      text-decoration: line-through;
      color: light-dark(var(--color-grey-700), var(--color-grey-300));
    `}
`;

const ActivityTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 0.25rem;
`;

const ActivityTitle = styled.button`
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  color: inherit;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-600);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const ActivityDescription = styled.button`
  font-size: 0.8rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  margin-bottom: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-600);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const RepeatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 6px;
  border-radius: 999px;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-800));
  color: light-dark(var(--color-grey-700), var(--color-grey-200));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));

  svg {
    flex-shrink: 0;
  }
`;

const EnergyBadges = styled.div`
  display: flex;
  gap: 8px;
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  background-color: ${({ $color }) => `${$color}30`};
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
  border: 1px solid ${({ $color }) => `${$color}50`};
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;

// Dropdown Styles
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuContent = styled(DropdownMenuPrimitive.Content)`
  min-width: 180px;
  background-color: light-dark(white, var(--color-grey-800));
  border-radius: 6px;
  padding: 5px;
  box-shadow: 0px 10px 38px -10px rgba(22, 23, 24, 0.35),
    0px 10px 20px -15px rgba(22, 23, 24, 0.2);
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  z-index: 50;
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
`;

const DropdownMenuItem = styled(DropdownMenuPrimitive.Item)`
  font-size: 0.875rem;
  line-height: 1;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  border-radius: 3px;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  position: relative;
  user-select: none;
  outline: none;
  cursor: pointer;

  &[data-highlighted] {
    background-color: var(--color-primary-600);
    color: white;
  }
`;

const DropdownMenuSeparator = styled(DropdownMenuPrimitive.Separator)`
  height: 1px;
  background-color: var(--color-grey-200);
  margin: 5px;
`;
