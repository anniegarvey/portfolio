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
import { v4 as uuidv4 } from "uuid";
import { getTodayDateString } from "@/lib/date";
import { isCheckPending } from "./schedule";
import type {
  WellnessConfig,
  WellnessEntry,
  WellnessEntryMetric,
} from "./schema";
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
  saveEntry: (metrics: WellnessEntryMetric[], note?: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  saveConfig: (config: WellnessConfig) => Promise<void>;
  disableCheck: () => Promise<void>;
  enableCheck: () => Promise<void>;
}

// biome-ignore lint/style/useComponentExportOnlyModules: context + provider + hook in one module
export const WellnessCheckContext = createContext<
  WellnessCheckContextType | undefined
>(undefined);

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
    () => isCheckPending(config, entries, getTodayDateString()),
    [config, entries],
  );

  const saveEntry = useCallback(
    async (metrics: WellnessEntryMetric[], note?: string) => {
      const entry: WellnessEntry = {
        id: uuidv4(),
        date: getTodayDateString(),
        metrics,
        ...(note ? { note } : {}),
      };
      const newEntries = [...entries, entry];
      await storeWellnessEntries(newEntries);
      setEntries(newEntries);
    },
    [entries],
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
        saveEntry,
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
