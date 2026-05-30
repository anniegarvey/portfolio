import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  WellnessCheckContext,
  type WellnessCheckContextType,
} from "@/lib/wellness/context";
import { DEFAULT_WELLNESS_METRICS } from "@/lib/wellness/schema";
import { WellnessConfigModal } from "./WellnessConfigModal";

vi.mock("@dnd-kit/core", async () => {
  const actual =
    await vi.importActual<typeof import("@dnd-kit/core")>("@dnd-kit/core");
  return {
    ...actual,
    DndContext: ({
      children,
      onDragEnd,
    }: {
      children: React.ReactNode;
      onDragEnd: (event: {
        active: { id: string };
        over: { id: string };
      }) => void;
    }) => (
      <div>
        <button
          data-testid="dnd-trigger"
          onClick={() =>
            onDragEnd({
              active: { id: DEFAULT_WELLNESS_METRICS[0].id },
              over: { id: "second-metric-id" },
            })
          }
          type="button"
        >
          Trigger Drag
        </button>
        {children}
      </div>
    ),
  };
});

const SECOND_METRIC = {
  id: "second-metric-id",
  label: "Sleep quality",
  lowLabel: "Poor",
  highLabel: "Great",
};

function makeCtx(
  overrides: Partial<WellnessCheckContextType> = {},
): WellnessCheckContextType {
  return {
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
    saveEntry: vi.fn().mockResolvedValue(undefined),
    deleteEntry: vi.fn().mockResolvedValue(undefined),
    saveConfig: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderModal(
  ctx: WellnessCheckContextType,
  isOpen = true,
  onClose = vi.fn(),
) {
  render(
    <WellnessCheckContext.Provider value={ctx}>
      <WellnessConfigModal isOpen={isOpen} onClose={onClose} />
    </WellnessCheckContext.Provider>,
  );
}

describe("WellnessConfigModal", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("renders when open", () => {
    renderModal(makeCtx());
    expect(screen.getByText("Wellness Check Settings")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderModal(makeCtx(), false);
    expect(
      screen.queryByText("Wellness Check Settings"),
    ).not.toBeInTheDocument();
  });

  it("shows the current cadence values", () => {
    renderModal(makeCtx());
    expect(screen.getByRole("spinbutton")).toHaveValue(1);
    expect(screen.getByRole("combobox")).toHaveValue("weeks");
  });

  it("shows existing metrics", () => {
    renderModal(makeCtx());
    expect(screen.getByText("Overall mood")).toBeInTheDocument();
  });

  it("saves cadence change on Save", async () => {
    const user = userEvent.setup();
    const ctx = makeCtx();
    renderModal(ctx);

    // fireEvent.change is reliable for controlled number inputs
    const frequencyInput = screen.getByRole("spinbutton");
    fireEvent.change(frequencyInput, { target: { value: "2" } });

    const unitSelect = screen.getByRole("combobox");
    await user.selectOptions(unitSelect, "months");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(ctx.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 2, unit: "months" }),
    );
  });

  it("adds a new metric", async () => {
    const user = userEvent.setup();
    const ctx = makeCtx();
    renderModal(ctx);

    await user.click(screen.getByRole("button", { name: /add metric/i }));
    await user.type(screen.getByPlaceholderText("e.g., Sleep quality"), "Mood");
    await user.click(screen.getByRole("button", { name: "Add Metric" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(ctx.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: expect.arrayContaining([
          expect.objectContaining({ label: "Mood" }),
        ]),
      }),
    );
  });

  it("adds a metric with endpoint labels", async () => {
    const user = userEvent.setup();
    const ctx = makeCtx();
    renderModal(ctx);

    await user.click(screen.getByRole("button", { name: /add metric/i }));
    await user.type(screen.getByPlaceholderText("e.g., Sleep quality"), "Rest");
    await user.type(screen.getByPlaceholderText("e.g., Low"), "Awful");
    await user.type(screen.getByPlaceholderText("e.g., Great"), "Amazing");
    await user.click(screen.getByRole("button", { name: "Add Metric" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(ctx.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: expect.arrayContaining([
          expect.objectContaining({
            label: "Rest",
            lowLabel: "Awful",
            highLabel: "Amazing",
          }),
        ]),
      }),
    );
  });

  it("renames a metric", async () => {
    const user = userEvent.setup();
    const ctx = makeCtx();
    renderModal(ctx);

    await user.click(screen.getByRole("button", { name: "Edit Overall mood" }));
    const input = screen.getByDisplayValue("Overall mood");
    await user.clear(input);
    await user.type(input, "Spirits");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(ctx.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: [expect.objectContaining({ label: "Spirits" })],
      }),
    );
  });

  it("removing a metric requires confirmation", async () => {
    const user = userEvent.setup();
    const ctx = makeCtx({
      config: {
        enabled: true,
        anchorDate: "2024-01-01",
        frequency: 1,
        unit: "weeks",
        metrics: [DEFAULT_WELLNESS_METRICS[0], SECOND_METRIC],
      },
    });
    renderModal(ctx);

    await user.click(
      screen.getByRole("button", { name: "Remove Overall mood" }),
    );
    expect(screen.getByText("Remove Metric?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(ctx.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: [expect.objectContaining({ label: "Sleep quality" })],
      }),
    );
  });

  it("cancelling delete confirmation keeps the metric", async () => {
    const user = userEvent.setup();
    const ctx = makeCtx({
      config: {
        enabled: true,
        anchorDate: "2024-01-01",
        frequency: 1,
        unit: "weeks",
        metrics: [DEFAULT_WELLNESS_METRICS[0], SECOND_METRIC],
      },
    });
    renderModal(ctx);

    await user.click(
      screen.getByRole("button", { name: "Remove Overall mood" }),
    );
    const confirmDialog = screen.getByRole("dialog", {
      name: "Remove Metric?",
    });
    await user.click(
      within(confirmDialog).getByRole("button", { name: "Cancel" }),
    );

    expect(screen.getByText("Overall mood")).toBeInTheDocument();
  });

  it("disables remove when only one metric remains", () => {
    renderModal(makeCtx());
    expect(screen.getByTitle("Cannot remove last metric")).toBeDisabled();
  });

  it("Cancel button does not save", async () => {
    const user = userEvent.setup();
    const ctx = makeCtx();
    const onClose = vi.fn();
    renderModal(ctx, true, onClose);

    const frequencyInput = screen.getByRole("spinbutton");
    await user.clear(frequencyInput);
    await user.type(frequencyInput, "3");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(ctx.saveConfig).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows endpoint label chips on metrics that have them", () => {
    renderModal(
      makeCtx({
        config: {
          enabled: true,
          anchorDate: "2024-01-01",
          frequency: 1,
          unit: "weeks",
          metrics: [SECOND_METRIC],
        },
      }),
    );
    expect(screen.getByText("1 – Poor")).toBeInTheDocument();
    expect(screen.getByText("5 – Great")).toBeInTheDocument();
  });
});

describe("WellnessConfigModal – rename/delete preserves history", () => {
  it("renaming a metric does not alter existing entries", async () => {
    const user = userEvent.setup();
    const metricId = DEFAULT_WELLNESS_METRICS[0].id;
    const ctx = makeCtx({
      entries: [
        {
          id: "entry-1",
          date: "2024-01-01",
          metrics: [{ metricId, label: "Overall mood", value: 4 }],
        },
      ],
    });
    renderModal(ctx);

    await user.click(screen.getByRole("button", { name: "Edit Overall mood" }));
    const input = screen.getByDisplayValue("Overall mood");
    await user.clear(input);
    await user.type(input, "Spirits");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    // The saved config has the renamed metric
    expect(ctx.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: [expect.objectContaining({ label: "Spirits" })],
      }),
    );
    // The existing entry snapshot is untouched
    expect(ctx.entries[0].metrics[0].label).toBe("Overall mood");
  });

  it("deleting a metric does not alter existing entries", async () => {
    const user = userEvent.setup();
    const ctx = makeCtx({
      config: {
        enabled: true,
        anchorDate: "2024-01-01",
        frequency: 1,
        unit: "weeks",
        metrics: [DEFAULT_WELLNESS_METRICS[0], SECOND_METRIC],
      },
      entries: [
        {
          id: "entry-1",
          date: "2024-01-01",
          metrics: [
            {
              metricId: DEFAULT_WELLNESS_METRICS[0].id,
              label: "Overall mood",
              value: 3,
            },
            { metricId: SECOND_METRIC.id, label: "Sleep quality", value: 5 },
          ],
        },
      ],
    });
    renderModal(ctx);

    await user.click(
      screen.getByRole("button", { name: "Remove Overall mood" }),
    );
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Config no longer has the removed metric
    expect(ctx.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        metrics: [expect.objectContaining({ label: "Sleep quality" })],
      }),
    );
    // Past entry still has both metrics
    expect(ctx.entries[0].metrics).toHaveLength(2);
    expect(ctx.entries[0].metrics[0].label).toBe("Overall mood");
  });
});
