"use client";

import { useEffect, useState } from "react";
import type { EnergyCost } from "@/lib/energy-planner/schema";
import { defaultCapacity } from "./utils";

export function useDailyCapacity() {
  const [dailyCapacity, setDailyCapacity] =
    useState<EnergyCost>(defaultCapacity);

  useEffect(() => {
    const stored = localStorage.getItem("energy_planner_capacity");
    if (stored) setDailyCapacity(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "energy_planner_capacity",
      JSON.stringify(dailyCapacity),
    );
  }, [dailyCapacity]);

  return { dailyCapacity, setDailyCapacity };
}
