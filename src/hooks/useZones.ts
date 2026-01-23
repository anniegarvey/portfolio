"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_ZONES, type ZoneConfig } from "@/lib/energy-planner/schema";
import { getZones, setZones } from "@/lib/energy-planner/storage";

export function useZones() {
  const [zones, setZonesState] = useState<ZoneConfig[]>(DEFAULT_ZONES);
  const [isLoading, setIsLoading] = useState(true);

  // Load zones from storage on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await getZones();
      if (cancelled) return;

      if (stored && stored.length > 0) {
        setZonesState(stored);
      } else {
        // Initialize with defaults
        setZonesState(DEFAULT_ZONES);
      }
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Save zones when they change
  useEffect(() => {
    if (!isLoading) {
      setZones(zones);
    }
  }, [zones, isLoading]);

  const addZone = useCallback((zoneData: Omit<ZoneConfig, "id">) => {
    const newZone: ZoneConfig = {
      ...zoneData,
      id: uuidv4(),
    };
    setZonesState((prev) => [...prev, newZone]);
  }, []);

  const updateZone = useCallback((updatedZone: ZoneConfig) => {
    setZonesState((prev) =>
      prev.map((zone) => (zone.id === updatedZone.id ? updatedZone : zone)),
    );
  }, []);

  const removeZone = useCallback((zoneId: string) => {
    setZonesState((prev) => {
      // Prevent removing the last zone
      if (prev.length <= 1) return prev;
      return prev.filter((zone) => zone.id !== zoneId);
    });
  }, []);

  const reorderZones = useCallback((newOrder: ZoneConfig[]) => {
    setZonesState(
      newOrder.map((zone, index) => ({
        ...zone,
        order: index,
      })),
    );
  }, []);

  // Get zones sorted by order
  const sortedZones = [...zones].sort((a, b) => a.order - b.order);

  return {
    zones: sortedZones,
    isLoading,
    addZone,
    updateZone,
    removeZone,
    reorderZones,
  };
}
