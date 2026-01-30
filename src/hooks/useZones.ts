"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_ZONES, type ZoneConfig } from "@/lib/energy-planner/schema";
import { fetchZones, storeZones } from "@/lib/energy-planner/storage";

export function useZones() {
  const [zones, storeZonesState] = useState<ZoneConfig[]>(DEFAULT_ZONES);
  const [isLoading, setIsLoading] = useState(true);

  // Load zones from storage on mount
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await fetchZones();
      if (cancelled) return;

      if (stored && stored.length > 0) {
        storeZonesState(stored);
      } else {
        // Initialize with defaults
        storeZonesState(DEFAULT_ZONES);
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
      storeZones(zones);
    }
  }, [zones, isLoading]);

  const addZone = useCallback((zoneData: Omit<ZoneConfig, "id">) => {
    const id = uuidv4();
    storeZonesState((prev) => {
      const maxOrder =
        prev.length > 0 ? Math.max(...prev.map((z) => z.order)) : -1;

      const newZone: ZoneConfig = {
        ...zoneData,
        id,
        order: maxOrder + 1,
      };
      return [...prev, newZone];
    });
  }, []);

  const updateZone = useCallback((updatedZone: ZoneConfig) => {
    storeZonesState((prev) =>
      prev.map((zone) => (zone.id === updatedZone.id ? updatedZone : zone)),
    );
  }, []);

  const removeZone = useCallback((zoneId: string) => {
    storeZonesState((prev) => {
      // Prevent removing the last zone
      if (prev.length <= 1) return prev;
      return prev.filter((zone) => zone.id !== zoneId);
    });
  }, []);

  const reorderZones = useCallback((newOrder: ZoneConfig[]) => {
    storeZonesState(
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
