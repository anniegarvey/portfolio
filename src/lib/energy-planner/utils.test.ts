import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DayPlan, Task } from "./schema";
import {
  clearAll,
  getDayPlan,
  getEnergyTypes,
  getOneOffTasks,
  setEnergyTypes,
  setOneOffTasks,
} from "./storage";
import {
  calculateEnergyUsage,
  exportEnergyPlannerData,
  getReorderedItems,
  importEnergyPlannerData,
} from "./utils";

const mockTasks: Task[] = [
  {
    id: "task-1",
    title: "Task 1",
    createdAt: new Date(),
    energyCost: { physical: 10, social: 20, executive: 5 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
  },
  {
    id: "task-2",
    title: "Task 2",
    createdAt: new Date(),
    energyCost: { physical: 5, social: 0, executive: 15 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
  },
  {
    id: "task-3",
    title: "Task 3",
    createdAt: new Date(),
    energyCost: { physical: 50, social: 50, executive: 50 },
    factors: {
      initiationDifficulty: 1,
      terminationDifficulty: 1,
      isRestorative: false,
    },
  },
];

describe("calculateEnergyUsage", () => {
  it("calculates energy usage for selected tasks correctly", () => {
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      tasks: [
        { ...mockTasks[0], completed: false },
        { ...mockTasks[1], completed: false },
      ],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(dayPlan);

    expect(usage).toEqual({
      physical: 15, // 10 + 5
      social: 20, // 20 + 0
      executive: 20, // 5 + 15
    });
  });

  it("returns zero usage when no tasks are selected", () => {
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      tasks: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(dayPlan);

    // With dynamic energy types, empty selection returns object with 0 values
    expect(usage).toEqual({ physical: 0, social: 0, executive: 0 });
  });
});

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
    // Pre-populate storage
    await setOneOffTasks([
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
    await setEnergyTypes([
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
        expect(exportedData).toHaveProperty("version", "3.0.0");
        expect(exportedData).toHaveProperty("exportDate");
        expect(exportedData.data).toHaveProperty("oneOffTasks");
        expect(exportedData.data).toHaveProperty("energyTypes");
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
      version: "3.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffTasks: [
          {
            id: "1",
            title: "Imported Task",
            createdAt: new Date().toISOString(),
            energyCost: { physical: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
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
        dayPlans: [
          {
            date: "2026-01-01",
            plan: {
              date: "2026-01-01",
              tasks: [
                {
                  id: "1",
                  title: "Imported Task",
                  createdAt: new Date().toISOString(),
                  energyCost: { physical: 10 },
                  factors: {
                    initiationDifficulty: 1,
                    terminationDifficulty: 1,
                    isRestorative: false,
                  },
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
    // Mock the text() method for vitest
    file.text = vi.fn().mockResolvedValue(fileContent);

    await importEnergyPlannerData(file);

    // Verify data was imported
    const tasks = await getOneOffTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Imported Task");

    const types = await getEnergyTypes();
    expect(types).toHaveLength(1);

    const dayPlan = await getDayPlan("2026-01-01");
    expect(dayPlan?.tasks).toHaveLength(1);
    expect(dayPlan?.tasks[0].id).toBe("1");

    expect(reloadSpy).toHaveBeenCalled();
  });
});

// ... validation tests ...

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
      version: "3.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffTasks: null,
        capacity: null,
        energyTypes: null,
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
      version: "3.0.0",
      exportDate: new Date().toISOString(),
      data: {
        oneOffTasks: [
          {
            id: "1",
            title: "Task",
            createdAt: new Date().toISOString(),
            energyCost: { physical: 10 },
            factors: {
              initiationDifficulty: 1,
              terminationDifficulty: 1,
              isRestorative: false,
            },
          },
        ],
        capacity: null,
        energyTypes: null,
        dayPlans: null,
      },
    };

    const fileContent = JSON.stringify(validData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await importEnergyPlannerData(file);

    const tasks = await getOneOffTasks();
    expect(tasks).toHaveLength(1);
    expect(reloadSpy).toHaveBeenCalled();
  });
});

describe("getReorderedItems", () => {
  it("returns null if overId is null", () => {
    const items = ["a", "b", "c"];
    const result = getReorderedItems(
      items,
      { active: { id: "a" }, over: null },
      (id) => id,
    );
    expect(result).toBeNull();
  });

  it("returns null if activeId equals overId", () => {
    const items = ["a", "b", "c"];
    const result = getReorderedItems(
      items,
      { active: { id: "a" }, over: { id: "a" } },
      (id) => id,
    );
    expect(result).toBeNull();
  });

  it("returns reordered string array", () => {
    const items = ["a", "b", "c"];
    // Move 'a' to 'c' (index 0 to 2) -> b, c, a
    const result = getReorderedItems(
      items,
      { active: { id: "a" }, over: { id: "c" } },
      (id) => id,
    );
    expect(result).toEqual(["b", "c", "a"]);
  });

  it("returns reordered object array", () => {
    const items = [{ id: "1" }, { id: "2" }, { id: "3" }];
    // Move '3' to '2' (index 2 to 1) -> 1, 3, 2
    const result = getReorderedItems(
      items,
      { active: { id: "3" }, over: { id: "2" } },
      (item) => item.id,
    );
    expect(result).toEqual([{ id: "1" }, { id: "3" }, { id: "2" }]);
  });

  it("returns null if item not found", () => {
    const items = ["a", "b"];
    const result = getReorderedItems(
      items,
      { active: { id: "z" }, over: { id: "b" } },
      (id) => id,
    );
    expect(result).toBeNull();
  });
});
