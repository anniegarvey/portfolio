import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAll,
  fetchActivities,
  fetchDayPlan,
  fetchEnergyTypes,
  fetchZones,
  storeActivities,
  storeDayPlan,
  storeEnergyTypes,
} from "@/lib/energy-planner/storage";
import {
  fetchWellnessConfig,
  fetchWellnessEntries,
} from "@/lib/wellness/storage";
import {
  exportEnergyPlannerData,
  importEnergyPlannerData,
} from "./ImportExport.utils";

describe("exportEnergyPlannerData", () => {
  let _createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let _revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
  };

  async function setupExportMocks() {
    await clearAll();
    // Pre-populate storage with a one-off activity (no repeatConfig)
    await storeActivities([
      {
        id: "1",
        title: "Test",
        createdAt: new Date(),
        energyCost: { physical: 10 },
        factors: {
          initiationDifficulty: 1,
          terminationDifficulty: 1,
          isRestorative: false,
        },
      },
    ]);
    await storeEnergyTypes([
      { id: "physical", label: "Physical", color: "#14b8a6", isPreset: true },
    ]);

    mockLink = { href: "", download: "", click: vi.fn() };
    _createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockLink as unknown as HTMLElement);
    vi.spyOn(document.body, "appendChild").mockReturnValue(
      mockLink as unknown as Node,
    );
    vi.spyOn(document.body, "removeChild").mockReturnValue(
      mockLink as unknown as Node,
    );

    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    _revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
  }

  beforeEach(async () => {
    await setupExportMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports the correct JSON content with version and data", async () => {
    await exportEnergyPlannerData();

    const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
    const reader = new FileReader();
    reader.readAsText(blobCall);

    return new Promise<void>((resolve) => {
      reader.onload = () => {
        const exportedData = JSON.parse(reader.result as string);
        expect(exportedData).toHaveProperty("version", "6.0.0");
        expect(exportedData).toHaveProperty("exportDate");
        expect(exportedData.data).toHaveProperty("oneOffActivities");
        expect(exportedData.data).toHaveProperty("repeatingActivities");
        expect(exportedData.data).toHaveProperty("energyTypes");
        expect(exportedData.data).toHaveProperty("zones");
        expect(exportedData.data).toHaveProperty("wellnessConfig");
        expect(exportedData.data).toHaveProperty("wellnessEntries");
        resolve();
      };
    });
  });

  it("exports day plans if present", async () => {
    // Setup day plan
    await storeDayPlan("2026-01-01", {
      date: "2026-01-01",
      plannedInstances: [],
      dailyCapacity: { physical: 100 },
    });

    await exportEnergyPlannerData();

    const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
    const reader = new FileReader();
    reader.readAsText(blobCall);

    return new Promise<void>((resolve) => {
      reader.onload = () => {
        const exportedData = JSON.parse(reader.result as string);
        expect(exportedData.data.dayPlans).toHaveLength(1);
        expect(exportedData.data.dayPlans[0].date).toBe("2026-01-01");
        resolve();
      };
    });
  });
});

describe("importEnergyPlannerData", () => {
  let reloadSpy: ReturnType<typeof vi.fn>;

  function setupImportMocks() {
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy },
      writable: true,
    });
  }

  beforeEach(async () => {
    await clearAll();
    setupImportMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("imports valid JSON data and updates IndexedDB", async () => {
    const validData = {
      version: "4.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffActivities: [
          {
            id: "1",
            title: "Imported Activity",
            createdAt: new Date().toISOString(),
            energyCost: { physical: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
          },
        ],
        repeatingActivities: [
          {
            id: "2",
            title: "Repeating Activity",
            createdAt: new Date().toISOString(),
            energyCost: { physical: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
            repeatConfig: {
              frequency: 1,
              unit: "days",
              nextDueDate: "2026-01-01",
              defaultZoneId: "afternoon",
            },
          },
        ],
        energyTypes: [
          {
            id: "physical",
            label: "Physical",
            color: "#14b8a6",
            isPreset: true,
          },
        ],
        zones: [{ id: "morning", name: "Morning", order: 0 }],
        dayPlans: [
          {
            date: "2026-01-01",
            plan: {
              date: "2026-01-01",
              plannedInstances: [
                {
                  id: "inst-1",
                  sourceActivityId: "1",
                  completed: false,
                },
              ],
              dailyCapacity: { physical: 75 },
            },
          },
        ],
      },
    };

    const fileContent = JSON.stringify(validData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await importEnergyPlannerData(file);

    // Verify all activities were imported into the unified store
    const activities = await fetchActivities();
    expect(activities).toHaveLength(2);
    const imported = activities?.find((a) => a.title === "Imported Activity");
    expect(imported).toBeDefined();
    const repeating = activities?.find((a) => a.title === "Repeating Activity");
    expect(repeating).toBeDefined();
    expect(repeating?.repeatConfig?.defaultZoneId).toBe("afternoon");
    expect(repeating?.repeatConfig?.frequency).toBe(1);

    const types = await fetchEnergyTypes();
    expect(types).toHaveLength(1);

    const zones = await fetchZones();
    expect(zones).toHaveLength(1);
    expect(zones?.[0].id).toBe("morning");

    const dayPlan = await fetchDayPlan("2026-01-01");
    expect(dayPlan?.plannedInstances).toHaveLength(1);
    expect(dayPlan?.plannedInstances[0].sourceActivityId).toBe("1");

    expect(reloadSpy).toHaveBeenCalled();
  });
});

describe("importEnergyPlannerData - data handling", () => {
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await clearAll();
    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles null values in all data fields", async () => {
    const validData = {
      version: "4.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffActivities: null,
        repeatingActivities: null,
        capacity: null,
        energyTypes: null,
        zones: null,
        dayPlans: null,
      },
    };

    const fileContent = JSON.stringify(validData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await importEnergyPlannerData(file);
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("imports partial data when some fields are null", async () => {
    const validData = {
      version: "4.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffActivities: [
          {
            id: "1",
            title: "Activity",
            createdAt: new Date().toISOString(),
            energyCost: { physical: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
          },
        ],
        repeatingActivities: null,
        capacity: null,
        energyTypes: null,
        zones: null,
        dayPlans: null,
      },
    };

    const fileContent = JSON.stringify(validData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await importEnergyPlannerData(file);

    const activities = await fetchActivities();
    expect(activities).toHaveLength(1);
    expect(reloadSpy).toHaveBeenCalled();
  });

  it("throws error for invalid file type", async () => {
    const file = new File(["{}"], "backup.txt", {
      type: "text/plain",
    });

    await expect(importEnergyPlannerData(file)).rejects.toThrow(
      "Invalid file type. Please select a JSON file.",
    );
  });

  it("throws error for missing required fields", async () => {
    const invalidData = {
      // Missing version and data
    };

    const fileContent = JSON.stringify(invalidData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await expect(importEnergyPlannerData(file)).rejects.toThrow(
      "Invalid file format. Missing required fields.",
    );
  });

  it("round-trips wellness config and entries", async () => {
    const validData = {
      version: "6.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffActivities: null,
        repeatingActivities: null,
        energyTypes: null,
        zones: null,
        dayPlans: null,
        wellnessConfig: {
          enabled: true,
          anchorDate: "2026-01-01",
          frequency: 1,
          unit: "weeks",
          metrics: [
            {
              id: "a3f8d1c2-7b4e-4f9a-8c6d-1e2f3a4b5c6d",
              label: "Overall mood",
              lowLabel: "Low",
              highLabel: "Great",
            },
          ],
        },
        wellnessEntries: [
          {
            id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
            date: "2026-01-01",
            metrics: [
              {
                metricId: "a3f8d1c2-7b4e-4f9a-8c6d-1e2f3a4b5c6d",
                label: "Overall mood",
                value: 4,
              },
            ],
            note: "Feeling good",
          },
        ],
      },
    };

    const fileContent = JSON.stringify(validData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await importEnergyPlannerData(file);

    const restoredConfig = await fetchWellnessConfig();
    expect(restoredConfig?.enabled).toBe(true);
    expect(restoredConfig?.metrics).toHaveLength(1);
    expect(restoredConfig?.metrics[0].label).toBe("Overall mood");

    const restoredEntries = await fetchWellnessEntries();
    expect(restoredEntries).toHaveLength(1);
    expect(restoredEntries[0].date).toBe("2026-01-01");
    expect(restoredEntries[0].metrics[0].value).toBe(4);
    expect(restoredEntries[0].note).toBe("Feeling good");
  });

  it("throws for invalid wellnessConfig shape", async () => {
    const data = {
      version: "6.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffActivities: null,
        repeatingActivities: null,
        energyTypes: null,
        zones: null,
        dayPlans: null,
        wellnessConfig: { enabled: "yes" },
        wellnessEntries: null,
      },
    };
    const file = new File([JSON.stringify(data)], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(JSON.stringify(data));

    await expect(importEnergyPlannerData(file)).rejects.toThrow(
      "Invalid wellness config in backup file.",
    );
  });

  it("throws for invalid wellnessEntries shape", async () => {
    const data = {
      version: "6.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffActivities: null,
        repeatingActivities: null,
        energyTypes: null,
        zones: null,
        dayPlans: null,
        wellnessConfig: null,
        wellnessEntries: [
          {
            id: "not-a-uuid",
            date: "2026-01-01",
            metrics: [{ metricId: "bad", label: "x", value: 99 }],
          },
        ],
      },
    };
    const file = new File([JSON.stringify(data)], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(JSON.stringify(data));

    await expect(importEnergyPlannerData(file)).rejects.toThrow(
      "Invalid wellness entries in backup file.",
    );
  });

  it("imports pre-v6 files without wellness fields successfully", async () => {
    const data = {
      version: "5.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffActivities: null,
        repeatingActivities: null,
        energyTypes: null,
        zones: null,
        dayPlans: null,
      },
    };
    const file = new File([JSON.stringify(data)], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(JSON.stringify(data));

    await expect(importEnergyPlannerData(file)).resolves.toBeUndefined();
    expect(reloadSpy).toHaveBeenCalled();
  });
});
