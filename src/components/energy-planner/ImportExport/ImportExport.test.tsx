import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, type Mock, test, vi } from "vitest";
import { ImportExport } from ".";
import {
  exportEnergyPlannerData,
  importEnergyPlannerData,
} from "./ImportExport.utils";

// Mock dependencies
vi.mock("./ImportExport.utils");

describe("ImportExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders export and import buttons", () => {
    render(<ImportExport />);
    expect(screen.getByText("Export")).toBeInTheDocument();
    expect(screen.getByText("Import")).toBeInTheDocument();
  });

  test("triggers file input click when Import button is clicked", () => {
    render(<ImportExport />);
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, "click");

    fireEvent.click(screen.getByText("Import"));

    expect(clickSpy).toHaveBeenCalled();
  });

  test("handle export click", () => {
    render(<ImportExport />);

    fireEvent.click(screen.getByText("Export"));
    expect(exportEnergyPlannerData).toHaveBeenCalled();
  });

  test("handles file import success", async () => {
    render(<ImportExport />);

    const file = new File(['{"activities":[]}'], "data.json", {
      type: "application/json",
    });

    const inputs = document.querySelectorAll('input[type="file"]');
    const input = inputs[0] as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByText("Import");

    expect(importEnergyPlannerData).toHaveBeenCalledWith(file);
  });

  test("handles file import error", async () => {
    // Mock implementation to throw
    (importEnergyPlannerData as unknown as Mock).mockRejectedValueOnce(
      new Error("Invalid format"),
    );
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<ImportExport />);

    const file = new File(["bad data"], "data.json", {
      type: "application/json",
    });
    const inputs = document.querySelectorAll('input[type="file"]');
    const input = inputs[0] as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await screen.findByText("Import");

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(alertMock).toHaveBeenCalledWith("Invalid format");
  });

  test("handles file import unknown error", async () => {
    (importEnergyPlannerData as unknown as Mock).mockRejectedValueOnce(
      "Unknown error",
    );
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<ImportExport />);

    const file = new File(["bad data"], "data.json", {
      type: "application/json",
    });
    const inputs = document.querySelectorAll('input[type="file"]');
    const input = inputs[0] as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(alertMock).toHaveBeenCalledWith(
      "Failed to import data. Please check the file format.",
    );
  });
});
