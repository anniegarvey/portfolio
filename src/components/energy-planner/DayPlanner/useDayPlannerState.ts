"use client";

import {
  type DragEndEvent,
  type DragOverEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { getTodayDateString, isToday } from "@/hooks/utils";
import { getReorderedItems } from "@/lib/energy-planner/utils";
import { useEnergyPlanner } from "../../../lib/energy-planner/context";
import type { ResolvedActivity } from "../../../lib/energy-planner/schema";

interface UseDayPlannerStateOptions {
  onOpenCreateActivity: (
    context?: { date: string; zoneId?: string },
    onCreated?: () => void,
    onCreatedWithType?: (type: "one-off" | "repeating") => void,
  ) => void;
}

export function useDayPlannerState({
  onOpenCreateActivity,
}: UseDayPlannerStateOptions) {
  const {
    isLoading,
    currentDate,
    goToToday,
    goToNextDay,
    goToPreviousDay,
    resolvedActivities,
    addToPlan,
    removeFromPlan,
    removeActivity,
    toggleActivityCompletion,
    energyUsage,
    capacityWarnings,
    energyTypes,
    uncompletedActivities,
    availableActivities,
    repeatingActivities,
    reorderPlannedActivities,
    reorderActivities,
    reorderRepeatingActivities,
    zones,
    assignActivityToZone,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    moveActivityToDate,
    dailyCapacity,
  } = useEnergyPlanner();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isZoneManagerOpen, setIsZoneManagerOpen] = useState(false);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeResolved, setActiveResolved] = useState<ResolvedActivity | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const viewingToday = isToday(currentDate);
  const viewedUncompletedActivities = viewingToday ? uncompletedActivities : [];
  const today = getTodayDateString();
  const dayContext: "past" | "today" | "future" =
    currentDate < today ? "past" : currentDate > today ? "future" : "today";

  const activitiesByZone = useMemo(() => {
    const grouped = new Map<string, ResolvedActivity[]>();

    for (const zone of zones) {
      grouped.set(zone.id, []);
    }

    for (const resolved of resolvedActivities) {
      const zoneId = resolved.instance.zoneId ?? zones[0]?.id;
      if (zoneId && grouped.has(zoneId)) {
        grouped.get(zoneId)?.push(resolved);
      } else if (zones[0]) {
        grouped.get(zones[0].id)?.push(resolved);
      }
    }

    return grouped;
  }, [resolvedActivities, zones]);

  // --- Modal handlers ---

  const handleOpenManageActivities = () => setIsModalOpen(true);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveZoneId(null);
  };

  const handleOpenModalForZone = (zoneId: string) => {
    setActiveZoneId(zoneId);
    setIsModalOpen(true);
  };

  const handleAddToPlanForZone = (activityId: string) => {
    if (activeZoneId) {
      addToPlan(activityId, activeZoneId);
    } else {
      addToPlan(activityId);
    }
    handleCloseModal();
  };

  const handleManageZones = () => setIsZoneManagerOpen(true);
  const handleCloseZoneManager = () => setIsZoneManagerOpen(false);

  const handleCreateActivity = (
    onCreatedWithType?: (type: "one-off" | "repeating") => void,
  ) => {
    // Pass current context (date and active zone). If creating with a zone
    // context, also close this modal so the user immediately sees the new activity.
    const closeThisModal = activeZoneId != null ? handleCloseModal : undefined;

    onOpenCreateActivity(
      { date: currentDate, zoneId: activeZoneId || undefined },
      closeThisModal,
      onCreatedWithType,
    );
  };

  // --- Drag-and-drop handlers ---

  const findZoneForInstance = (instanceId: string): string | null => {
    for (const zone of zones) {
      const zoneResolved = activitiesByZone.get(zone.id) ?? [];
      if (zoneResolved.some(({ instance }) => instance.id === instanceId)) {
        return zone.id;
      }
    }
    return null;
  };

  const getTargetZoneId = (overId: string): string | null => {
    const targetZone = zones.find((z) => z.id === overId);
    if (targetZone) return targetZone.id;
    return findZoneForInstance(overId);
  };

  const handleDragStart = (event: DragOverEvent) => {
    const resolved = resolvedActivities.find(
      ({ instance }) => instance.id === event.active.id,
    );
    if (resolved) setActiveResolved(resolved);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveResolved(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceZoneId = findZoneForInstance(activeId);
    const targetZoneId = getTargetZoneId(overId);

    if (targetZoneId && sourceZoneId !== targetZoneId) {
      assignActivityToZone(activeId, targetZoneId);
    }

    if (activeId !== overId) {
      const newItems = getReorderedItems(
        resolvedActivities,
        event,
        ({ instance }) => instance.id,
      );
      if (newItems) {
        reorderPlannedActivities(newItems.map(({ instance }) => instance.id));
      }
    }
  };

  return {
    // Loading
    isLoading,
    // Date navigation
    currentDate,
    goToToday,
    goToNextDay,
    goToPreviousDay,
    viewingToday,
    dayContext,
    // Activities
    resolvedActivities,
    availableActivities,
    repeatingActivities,
    viewedUncompletedActivities,
    // Energy
    energyTypes,
    usage: energyUsage,
    capacityWarnings,
    dailyCapacity,
    // Zones
    zones,
    activitiesByZone,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
    // Context actions passed through for modals
    removeActivity,
    removeFromPlan,
    toggleActivityCompletion,
    moveActivityToDate,
    reorderActivities,
    reorderRepeatingActivities,
    // Modal state
    isModalOpen,
    isZoneManagerOpen,
    activeResolved,
    // Handlers
    sensors,
    handleOpenManageActivities,
    handleCloseModal,
    handleOpenModalForZone,
    handleAddToPlanForZone,
    handleManageZones,
    handleCloseZoneManager,
    handleCreateActivity,
    handleDragStart,
    handleDragEnd,
  };
}
