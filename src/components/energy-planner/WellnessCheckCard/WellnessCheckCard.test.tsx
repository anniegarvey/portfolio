import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  WellnessCheckContext,
  type WellnessCheckContextType,
} from "@/lib/wellness/context";
import { DEFAULT_WELLNESS_METRICS } from "@/lib/wellness/schema";
import { WellnessCheckCard } from "./WellnessCheckCard";

function renderCard(overrides: Partial<WellnessCheckContextType> = {}) {
  const saveEntry = vi.fn().mockResolvedValue(undefined);
  const ctx: WellnessCheckContextType = {
    config: {
      enabled: true,
      anchorDate: "2024-01-01",
      frequency: 1,
      unit: "weeks",
      metrics: DEFAULT_WELLNESS_METRICS,
    },
    entries: [],
    isPending: true,
    isLoading: false,
    saveEntry,
    ...overrides,
  };

  render(
    <WellnessCheckContext.Provider value={ctx}>
      <WellnessCheckCard />
    </WellnessCheckContext.Provider>,
  );

  return { saveEntry };
}

describe("WellnessCheckCard", () => {
  it("renders the metric label", () => {
    renderCard();
    expect(screen.getByText("Overall mood")).toBeInTheDocument();
  });

  it("renders 5 rating buttons for each metric", () => {
    renderCard();
    // "1 – Low", "2", "3", "4", "5 – Great"
    expect(screen.getByRole("button", { name: "1 – Low" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "5 – Great" }),
    ).toBeInTheDocument();
  });

  it("save button is disabled initially", () => {
    renderCard();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("save button enables after rating a metric", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole("button", { name: "3" }));

    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  it("pressing a rating marks it as pressed (aria-pressed)", async () => {
    const user = userEvent.setup();
    renderCard();

    const btn = screen.getByRole("button", { name: "4" });
    expect(btn).toHaveAttribute("aria-pressed", "false");

    await user.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking save calls saveEntry with correct snapshot", async () => {
    const user = userEvent.setup();
    const { saveEntry } = renderCard();

    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveEntry).toHaveBeenCalledOnce();
    expect(saveEntry).toHaveBeenCalledWith([
      {
        metricId: DEFAULT_WELLNESS_METRICS[0].id,
        label: "Overall mood",
        value: 3,
      },
    ]);
  });

  it("unanswered metrics get value null in the snapshot", async () => {
    const user = userEvent.setup();
    const multiMetricConfig = {
      enabled: true,
      anchorDate: "2024-01-01",
      frequency: 1,
      unit: "weeks" as const,
      metrics: [
        ...DEFAULT_WELLNESS_METRICS,
        {
          id: "b3f8d1c2-7b4e-4f9a-8c6d-1e2f3a4b5c6e",
          label: "Sleep quality",
        },
      ],
    };
    const saveEntry = vi.fn().mockResolvedValue(undefined);
    render(
      <WellnessCheckContext.Provider
        value={{
          config: multiMetricConfig,
          entries: [],
          isPending: true,
          isLoading: false,
          saveEntry,
        }}
      >
        <WellnessCheckCard />
      </WellnessCheckContext.Provider>,
    );

    // Rate only the first metric
    const ratingButtons = screen.getAllByRole("button", { name: "3" });
    await user.click(ratingButtons[0]);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveEntry).toHaveBeenCalledWith([
      {
        metricId: DEFAULT_WELLNESS_METRICS[0].id,
        label: "Overall mood",
        value: 3,
      },
      {
        metricId: "b3f8d1c2-7b4e-4f9a-8c6d-1e2f3a4b5c6e",
        label: "Sleep quality",
        value: null,
      },
    ]);
  });
});
