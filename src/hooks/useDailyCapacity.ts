"use client";

import { useEffect, useState } from "react";
import type { EnergyCost } from "@/lib/energy-planner/schema";
import {
  getDailyCapacity,
  setDailyCapacity as saveCapacity,
} from "@/lib/energy-planner/storage";
import { defaultCapacity } from "./utils";

export function useDailyCapacity() {
  const [dailyCapacity, setDailyCapacity] =
    useState<EnergyCost>(defaultCapacity);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDailyCapacity().then((stored) => {
      if (stored) {
        setDailyCapacity(stored);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveCapacity(dailyCapacity);
    }
  }, [dailyCapacity, isLoading]);

  return { dailyCapacity, isLoading, setDailyCapacity };
}
