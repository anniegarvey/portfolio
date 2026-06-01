import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useWellnessCheck, WellnessProvider } from "./context";
import { DEFAULT_WELLNESS_METRICS } from "./schema";

function wrapper({ children }: { children: React.ReactNode }) {
  return <WellnessProvider>{children}</WellnessProvider>;
}

describe("useWellnessCheck", () => {
  it("throws when used outside WellnessProvider", () => {
    expect(() => renderHook(() => useWellnessCheck())).toThrow(
      "useWellnessCheck must be used within a WellnessProvider",
    );
  });

  it("starts loading and resolves to default config", async () => {
    const { result } = renderHook(() => useWellnessCheck(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config.enabled).toBe(true);
    expect(result.current.config.frequency).toBe(1);
    expect(result.current.config.unit).toBe("weeks");
    expect(result.current.config.metrics).toEqual(DEFAULT_WELLNESS_METRICS);
  });

  it("isPending is true with no entries", async () => {
    const { result } = renderHook(() => useWellnessCheck(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPending).toBe(true);
  });

  it("isPending becomes false after saving an entry", async () => {
    const { result } = renderHook(() => useWellnessCheck(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await result.current.saveEntry([
        {
          metricId: DEFAULT_WELLNESS_METRICS[0].id,
          label: DEFAULT_WELLNESS_METRICS[0].label,
          value: 3,
        },
      ]);
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].metrics[0].value).toBe(3);
  });

  it("saved entry snapshots the metric label at capture time", async () => {
    const { result } = renderHook(() => useWellnessCheck(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveEntry([
        {
          metricId: DEFAULT_WELLNESS_METRICS[0].id,
          label: "Overall mood",
          value: 5,
        },
      ]);
    });

    expect(result.current.entries[0].metrics[0].label).toBe("Overall mood");
    expect(result.current.entries[0].metrics[0].metricId).toBe(
      DEFAULT_WELLNESS_METRICS[0].id,
    );
  });

  it("deleteEntry removes the entry by id", async () => {
    const { result } = renderHook(() => useWellnessCheck(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const countBefore = result.current.entries.length;

    await act(async () => {
      await result.current.saveEntry([
        {
          metricId: DEFAULT_WELLNESS_METRICS[0].id,
          label: "Overall mood",
          value: 4,
        },
      ]);
    });
    expect(result.current.entries).toHaveLength(countBefore + 1);
    const id = result.current.entries[result.current.entries.length - 1].id;

    await act(async () => {
      await result.current.deleteEntry(id);
    });
    expect(result.current.entries).toHaveLength(countBefore);
    expect(result.current.entries.find((e) => e.id === id)).toBeUndefined();
  });

  it("saveConfig updates the config and persists it", async () => {
    const { result } = renderHook(() => useWellnessCheck(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveConfig({
        ...result.current.config,
        frequency: 2,
        unit: "months",
      });
    });
    expect(result.current.config.frequency).toBe(2);
    expect(result.current.config.unit).toBe("months");
  });

  it("disableCheck sets enabled to false and preserves entries", async () => {
    const { result } = renderHook(() => useWellnessCheck(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const countBefore = result.current.entries.length;

    await act(async () => {
      await result.current.saveEntry([
        {
          metricId: DEFAULT_WELLNESS_METRICS[0].id,
          label: "Overall mood",
          value: 3,
        },
      ]);
    });
    expect(result.current.entries).toHaveLength(countBefore + 1);

    await act(async () => {
      await result.current.disableCheck();
    });
    expect(result.current.config.enabled).toBe(false);
    expect(result.current.entries).toHaveLength(countBefore + 1);
  });

  it("enableCheck sets enabled to true and preserves entries", async () => {
    const { result } = renderHook(() => useWellnessCheck(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const countBefore = result.current.entries.length;

    await act(async () => {
      await result.current.saveEntry([
        {
          metricId: DEFAULT_WELLNESS_METRICS[0].id,
          label: "Overall mood",
          value: 5,
        },
      ]);
      await result.current.disableCheck();
    });
    expect(result.current.config.enabled).toBe(false);
    expect(result.current.entries).toHaveLength(countBefore + 1);

    await act(async () => {
      await result.current.enableCheck();
    });
    expect(result.current.config.enabled).toBe(true);
    expect(result.current.entries).toHaveLength(countBefore + 1);
  });
});
