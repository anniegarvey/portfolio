"use client";

import { useEffect, useState } from "react";
import type { EnergyTypeConfig } from "@/lib/energy-planner/schema";
import { DEFAULT_ENERGY_TYPES } from "@/lib/energy-planner/schema";
import {
  fetchEnergyTypes,
  storeEnergyTypes,
} from "@/lib/energy-planner/storage";
import { generateUniqueKey } from "./utils";

export function useEnergyTypes() {
  const [energyTypes, setEnergyTypes] =
    useState<EnergyTypeConfig[]>(DEFAULT_ENERGY_TYPES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchEnergyTypes().then((stored) => {
      if (cancelled) return;
      if (stored) {
        setEnergyTypes(stored);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      storeEnergyTypes(energyTypes);
    }
  }, [energyTypes, isLoading]);

  const addEnergyType = (
    typeData: Omit<EnergyTypeConfig, "id" | "isPreset">,
  ) => {
    const existingIds = energyTypes.map((t) => t.id);
    const newType: EnergyTypeConfig = {
      ...typeData,
      id: generateUniqueKey(typeData.label, existingIds),
      isPreset: false,
    };
    setEnergyTypes((prev) => [...prev, newType]);
  };

  const updateEnergyType = (updatedType: EnergyTypeConfig) => {
    setEnergyTypes((prev) =>
      prev.map((t) => (t.id === updatedType.id ? updatedType : t)),
    );
  };

  const removeEnergyType = (typeId: string) => {
    setEnergyTypes((prev) => prev.filter((t) => t.id !== typeId));
  };

  return {
    energyTypes,
    isLoading,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
  };
}
