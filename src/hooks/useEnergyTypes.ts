"use client";

import { useEffect, useState } from "react";
import type { EnergyTypeConfig } from "@/lib/energy-planner/schema";
import { DEFAULT_ENERGY_TYPES } from "@/lib/energy-planner/schema";
import {
  fetchEnergyTypes,
  storeEnergyTypes as saveEnergyTypes,
} from "@/lib/energy-planner/storage";
import { generateUniqueKey } from "./utils";

export function useEnergyTypes() {
  const [energyTypes, storeEnergyTypes] =
    useState<EnergyTypeConfig[]>(DEFAULT_ENERGY_TYPES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEnergyTypes().then((stored) => {
      if (stored) {
        storeEnergyTypes(stored);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveEnergyTypes(energyTypes);
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
    storeEnergyTypes((prev) => [...prev, newType]);
  };

  const updateEnergyType = (updatedType: EnergyTypeConfig) => {
    storeEnergyTypes((prev) =>
      prev.map((t) => (t.id === updatedType.id ? updatedType : t)),
    );
  };

  const removeEnergyType = (typeId: string) => {
    storeEnergyTypes((prev) => prev.filter((t) => t.id !== typeId));
  };

  return {
    energyTypes,
    isLoading,
    addEnergyType,
    updateEnergyType,
    removeEnergyType,
  };
}
