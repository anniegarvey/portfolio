import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DayPlan, Task } from "./schema";
import {
  calculateEnergyUsage,
  exportEnergyPlannerData,
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
      selectedTaskIds: ["task-1", "task-2"],
      completedTaskIds: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(mockTasks, dayPlan);

    expect(usage).toEqual({
      physical: 15, // 10 + 5
      social: 20, // 20 + 0
      executive: 20, // 5 + 15
    });
  });

  it("ignores unselected tasks", () => {
    // This test specifically targets the mutant where .filter() is removed
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      selectedTaskIds: ["task-1"],
      completedTaskIds: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(mockTasks, dayPlan);

    expect(usage).toEqual({
      physical: 10,
      social: 20,
      executive: 5,
    });
    // If filter was removed, it would include task-2 and task-3, resulting in much higher values
  });

  it("returns zero usage when no tasks are selected", () => {
    const dayPlan: DayPlan = {
      date: "2023-01-01",
      selectedTaskIds: [],
      completedTaskIds: [],
      dailyCapacity: { physical: 100, social: 100, executive: 100 },
    };

    const usage = calculateEnergyUsage(mockTasks, dayPlan);

    // With dynamic energy types, empty selection returns empty object
    expect(usage).toEqual({});
  });
});

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("exportEnergyPlannerData", () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
  };

  function setupExportMocks() {
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => {
        if (key === "energy_planner_tasks") return '{"tasks": "data"}';
        if (key === "energy_planner_capacity") return '{"capacity": "data"}';
        if (key === "energy_planner_day_plan") return '{"dayPlan": "data"}';
        return null;
      }),
    };
    vi.stubGlobal("localStorage", mockLocalStorage);

    mockLink = { href: "", download: "", click: vi.fn() };
    createElementSpy = vi
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
    revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
  }

  beforeEach(() => {
    setupExportMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports all localStorage data to a JSON file", () => {
    exportEnergyPlannerData();

    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("creates a properly formatted export file", () => {
    exportEnergyPlannerData();

    const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blobCall.type).toBe("application/json");
  });

  it("sets the correct download filename with date", () => {
    vi.useFakeTimers();
    const date = new Date("2023-01-15T12:00:00.000Z");
    vi.setSystemTime(date);

    exportEnergyPlannerData();

    expect(mockLink.download).toBe("energy-planner-backup-2023-01-15.json");

    vi.useRealTimers();
  });

  it("sets the correct href for the download link", () => {
    exportEnergyPlannerData();

    expect(mockLink.href).toBe("blob:mock-url");
  });

  it("triggers a click on the download link", () => {
    exportEnergyPlannerData();

    expect(mockLink.click).toHaveBeenCalledTimes(1);
  });

  it("appends and removes the link element from the document body", () => {
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");

    exportEnergyPlannerData();

    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });

  it("exports the correct JSON content with version and data", () => {
    exportEnergyPlannerData();

    const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
    const reader = new FileReader();
    reader.readAsText(blobCall);

    return new Promise<void>((resolve) => {
      reader.onload = () => {
        const exportedData = JSON.parse(reader.result as string);
        expect(exportedData).toHaveProperty("version", "1.0.0");
        expect(exportedData).toHaveProperty("exportDate");
        expect(exportedData.data).toEqual({
          tasks: '{"tasks": "data"}',
          capacity: '{"capacity": "data"}',
          dayPlan: '{"dayPlan": "data"}',
        });
        resolve();
      };
    });
  });
});

describe("importEnergyPlannerData", () => {
  let setItemSpy: ReturnType<typeof vi.fn>;
  let reloadSpy: ReturnType<typeof vi.fn>;

  function setupImportMocks() {
    const mockLocalStorage = { setItem: vi.fn() };
    setItemSpy = mockLocalStorage.setItem;
    vi.stubGlobal("localStorage", mockLocalStorage);

    reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy },
      writable: true,
    });
  }

  beforeEach(() => {
    setupImportMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("imports valid JSON data and updates localStorage", async () => {
    const validData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      data: {
        tasks: '{"tasks": "data"}',
        capacity: '{"capacity": "data"}',
        dayPlan: '{"dayPlan": "data"}',
      },
    };

    const fileContent = JSON.stringify(validData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    // Mock the text() method for vitest
    file.text = vi.fn().mockResolvedValue(fileContent);

    await importEnergyPlannerData(file);

    expect(setItemSpy).toHaveBeenCalledWith(
      "energy_planner_tasks",
      '{"tasks": "data"}',
    );
    expect(setItemSpy).toHaveBeenCalledWith(
      "energy_planner_capacity",
      '{"capacity": "data"}',
    );
    expect(setItemSpy).toHaveBeenCalledWith(
      "energy_planner_day_plan",
      '{"dayPlan": "data"}',
    );
    expect(reloadSpy).toHaveBeenCalled();
  });
});

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires multiple test cases
describe("importEnergyPlannerData - validation errors", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", { setItem: vi.fn() });
    const reloadSpy = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadSpy },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error for non-JSON files", async () => {
    const file = new File(["test"], "backup.txt", { type: "text/plain" });

    await expect(importEnergyPlannerData(file)).rejects.toThrow(
      "Invalid file type. Please select a JSON file.",
    );
  });

  it("throws error for invalid JSON structure", async () => {
    const invalidData = { someField: "value" };
    const fileContent = JSON.stringify(invalidData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await expect(importEnergyPlannerData(file)).rejects.toThrow(
      "Invalid file format. Missing required fields.",
    );
  });

  it("throws error for malformed JSON", async () => {
    const fileContent = "not valid json";
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await expect(importEnergyPlannerData(file)).rejects.toThrow();
  });

  it("throws error when version is missing", async () => {
    const invalidData = {
      exportDate: new Date().toISOString(),
      data: { tasks: null, capacity: null, dayPlan: null },
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

  it("throws error when data field is missing", async () => {
    const invalidData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
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
});

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test setup requires multiple test cases
describe("importEnergyPlannerData - data handling", () => {
  let setItemSpy: ReturnType<typeof vi.fn>;
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const mockLocalStorage = { setItem: vi.fn() };
    setItemSpy = mockLocalStorage.setItem;
    vi.stubGlobal("localStorage", mockLocalStorage);
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
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      data: {
        tasks: null,
        capacity: null,
        dayPlan: null,
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
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      data: {
        tasks: '{"tasks": "data"}',
        capacity: null,
        dayPlan: '{"dayPlan": "data"}',
      },
    };

    const fileContent = JSON.stringify(validData);
    const file = new File([fileContent], "backup.json", {
      type: "application/json",
    });
    file.text = vi.fn().mockResolvedValue(fileContent);

    await importEnergyPlannerData(file);

    expect(setItemSpy).toHaveBeenCalledWith(
      "energy_planner_tasks",
      '{"tasks": "data"}',
    );
    expect(setItemSpy).toHaveBeenCalledWith(
      "energy_planner_day_plan",
      '{"dayPlan": "data"}',
    );
    expect(setItemSpy).toHaveBeenCalledTimes(2);
    expect(reloadSpy).toHaveBeenCalled();
  });
});
