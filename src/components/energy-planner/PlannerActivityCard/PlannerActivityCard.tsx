"use client";

import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
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
import { getNextDay } from "../../../hooks/utils";
import { useEnergyPlanner } from "../../../lib/energy-planner/context";
import type {
  Activity,
  PlannedActivity,
} from "../../../lib/energy-planner/schema";
import { Button } from "../common";

interface PlannerActivityCardProps {
  activity: Activity;
  selected?: boolean;
  completed?: boolean;
  isPastDay?: boolean;
  isFutureDay?: boolean;
  onEdit: (activity: Activity) => void;
  onToggleCompletion?: (activityId: string) => void;
  onRemove?: (activityId: string) => void;
  onMove?: (activityId: string, date: string) => void;
  onDelete?: (activityId: string) => void;
  onAdd?: (activityId: string) => void;
  dragHandleProps?: {
    listeners: DraggableSyntheticListeners;
    attributes: DraggableAttributes;
    ref: (node: HTMLElement | null) => void;
  };
}

export function PlannerActivityCard({
  activity,
  selected,
  completed,
  isPastDay,
  isFutureDay,
  onEdit,
  onToggleCompletion,
  onRemove,
  onMove,
  onDelete,
  onAdd,
  dragHandleProps,
}: PlannerActivityCardProps) {
  const {
    energyTypes,
    currentDate,
    moveActivityToDate,
    removeFromPlan,
    skipActivity,
  } = useEnergyPlanner();

  const tomorrow = getNextDay(currentDate);
  const dayAfter = getNextDay(tomorrow);

  const handleMove = onMove || moveActivityToDate;
  const handleRemove = onRemove || removeFromPlan;

  return (
    <Card
      $completed={completed}
      $isProjected={(activity as PlannedActivity).isProjected}
      $selected={selected}
    >
      {dragHandleProps && (
        <DragHandle
          {...dragHandleProps.listeners}
          {...dragHandleProps.attributes}
          aria-label={`Reorder activity: ${activity.title}`}
          ref={dragHandleProps.ref}
        >
          <GripVertical size={20} />
        </DragHandle>
      )}
      <ActivityContent $completed={completed}>
        <ActivityTitleRow>
          {activity.repeatConfig && (
            <RepeatIconWrapper title="Repeating Activity">
              <RotateCw size={14} />
            </RepeatIconWrapper>
          )}
          <ActivityTitle onClick={() => onEdit(activity)}>
            {activity.title}
          </ActivityTitle>
        </ActivityTitleRow>
        {activity.description && (
          <ActivityDescription>{activity.description}</ActivityDescription>
        )}
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
        {selected && onToggleCompletion && !isPastDay && !isFutureDay && (
          <Button
            aria-label={completed ? "Mark as not done" : "Mark as done"}
            intent={completed ? "danger" : "teal"}
            onClick={() => onToggleCompletion(activity.id)}
            size="icon"
            title={completed ? "Mark as not done" : "Mark as done"}
            variant="ghost"
          >
            {completed ? <Undo2 size={18} /> : <Check size={18} />}
          </Button>
        )}

        {onDelete && (
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
        )}

        {selected && !completed && !isPastDay && (
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
                <DropdownMenuItem
                  onClick={() => handleMove?.(activity.id, tomorrow)}
                >
                  Tomorrow
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleMove?.(activity.id, dayAfter)}
                >
                  Day after tomorrow
                </DropdownMenuItem>
                {activity.repeatConfig && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => skipActivity(activity.id)}>
                      Skip this time
                    </DropdownMenuItem>
                  </>
                )}
                {handleRemove && !activity.repeatConfig && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleRemove(activity.id)}>
                      Return to unplanned
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuPrimitive.Root>
        )}

        {!selected && onAdd && !isPastDay && !activity.repeatConfig && (
          <Button
            aria-label="Add to day"
            onClick={() => onAdd(activity.id)}
            size="icon"
            title="Add to day"
            variant="ghost"
          >
            <CopyPlus size={18} />
          </Button>
        )}
      </Actions>
    </Card>
  );
}

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-right: 4px;
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
  background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--color-grey-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: transform 0.1s;

  ${({ $isProjected }) =>
    $isProjected &&
    css`
        background-color: light-dark(var(--color-blue-50), var(--color-blue-950));
        border-style: dashed;
        border-color: var(--color-blue-300);
    `}

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: var(--color-primary-300);
      background-color: light-dark(var(--color-primary-50), var(--color-primary-950));
      border-style: solid; 
  `}

  ${({ $completed }: { $completed?: boolean }) =>
    $completed &&
    css`
      background-color: light-dark(var(--color-grey-100), var(--color-grey-800));
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
    color: var(--color-primary-600);
    text-decoration: underline; 
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-600);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const ActivityDescription = styled.p`
    font-size: 0.8rem;
    color: var(--color-grey-500);
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
`;

const RepeatIconWrapper = styled.div`
    color: var(--color-grey-500);
    display: flex;
    align-items: center;
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
