"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getTodayDateString } from "@/lib/date";
import { buildEntry } from "./entry";
import { getPeriodForDate, isCheckPending } from "./schedule";
import type { WellnessConfig, WellnessEntry } from "./schema";
import { DEFAULT_WELLNESS_METRICS } from "./schema";
import {
  fetchWellnessConfig,
  fetchWellnessEntries,
  storeWellnessConfig,
  storeWellnessEntries,
} from "./storage";

export interface WellnessCheckContextType {
  config: WellnessConfig;
  entries: WellnessEntry[];
  isPending: boolean;
  isLoading: boolean;
  currentPeriodEntry: WellnessEntry | undefined;
  saveEntry: (
    responses: Record<string, number | null>,
    note: string,
  ) => Promise<void>;
  amendEntry: (
    id: string,
    responses: Record<string, number | null>,
    note: string,
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  saveConfig: (config: WellnessConfig) => Promise<void>;
  disableCheck: () => Promise<void>;
  enableCheck: () => Promise<void>;
}

// biome-ignore lint/style/useComponentExportOnlyModules: context + provider + hook in one module
export const WellnessCheckContext = createContext<
  WellnessCheckContextType | undefined
>(undefined);

function getMsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

export function WellnessProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WellnessConfig>(() => ({
    enabled: true,
    anchorDate: getTodayDateString(),
    frequency: 1,
    unit: "weeks",
    metrics: DEFAULT_WELLNESS_METRICS,
  }));
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [today, setToday] = useState(getTodayDateString);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    function scheduleNext() {
      timeoutId = setTimeout(() => {
        setToday(getTodayDateString());
        scheduleNext();
      }, getMsUntilMidnight());
    }
    scheduleNext();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedConfig, storedEntries] = await Promise.all([
        fetchWellnessConfig(),
        fetchWellnessEntries(),
      ]);

      if (cancelled) return;

      if (storedConfig) {
        setConfig(storedConfig);
      } else {
        const defaultConfig: WellnessConfig = {
          enabled: true,
          anchorDate: getTodayDateString(),
          frequency: 1,
          unit: "weeks",
          metrics: DEFAULT_WELLNESS_METRICS,
        };
        await storeWellnessConfig(defaultConfig);
        setConfig(defaultConfig);
      }

      setEntries(storedEntries);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isPending = useMemo(
    () => isCheckPending(config, entries, today),
    [config, entries, today],
  );

  const currentPeriodEntry = useMemo(() => {
    const period = getPeriodForDate(config, today);
    if (!period) return undefined;
    return entries.find((e) => e.date >= period.start && e.date < period.end);
  }, [config, entries, today]);

  const saveEntry = useCallback(
    async (responses: Record<string, number | null>, note: string) => {
      const entry = buildEntry(config, responses, note, getTodayDateString());
      const newEntries = [...entries, entry];
      await storeWellnessEntries(newEntries);
      setEntries(newEntries);
    },
    [config, entries],
  );

  const amendEntry = useCallback(
    async (
      id: string,
      responses: Record<string, number | null>,
      note: string,
    ) => {
      const existing = entries.find((e) => e.id === id);
      if (!existing) return;
      const amended = buildEntry(config, responses, note, existing.date);
      const newEntries = entries.filter((e) => e.id !== id).concat(amended);
      await storeWellnessEntries(newEntries);
      setEntries(newEntries);
    },
    [config, entries],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const newEntries = entries.filter((e) => e.id !== id);
      await storeWellnessEntries(newEntries);
      setEntries(newEntries);
    },
    [entries],
  );

  const saveConfig = useCallback(async (newConfig: WellnessConfig) => {
    await storeWellnessConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const disableCheck = useCallback(
    () => saveConfig({ ...config, enabled: false }),
    [config, saveConfig],
  );

  const enableCheck = useCallback(
    () => saveConfig({ ...config, enabled: true }),
    [config, saveConfig],
  );

  return (
    <WellnessCheckContext.Provider
      value={{
        config,
        entries,
        isPending,
        isLoading,
        currentPeriodEntry,
        saveEntry,
        amendEntry,
        deleteEntry,
        saveConfig,
        disableCheck,
        enableCheck,
      }}
    >
      {children}
    </WellnessCheckContext.Provider>
  );
}

// biome-ignore lint/style/useComponentExportOnlyModules: Standard pattern for Context + Hook
export function useWellnessCheck() {
  const context = use(WellnessCheckContext);
  if (context === undefined) {
    throw new Error("useWellnessCheck must be used within a WellnessProvider");
  }
  return context;
}
