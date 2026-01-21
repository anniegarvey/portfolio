"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { EnergyTypeConfig } from "@/lib/energy-planner/schema";
import { DEFAULT_ENERGY_TYPES } from "@/lib/energy-planner/schema";
import {
  getEnergyTypes,
  setEnergyTypes as saveEnergyTypes,
} from "@/lib/energy-planner/storage";

export function useEnergyTypes() {
  const [energyTypes, setEnergyTypes] =
    useState<EnergyTypeConfig[]>(DEFAULT_ENERGY_TYPES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getEnergyTypes().then((stored) => {
      if (stored) {
        setEnergyTypes(stored);
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
    const newType: EnergyTypeConfig = {
      ...typeData,
      id: uuidv4(),
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
