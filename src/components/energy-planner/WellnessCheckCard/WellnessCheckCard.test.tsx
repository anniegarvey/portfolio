import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { usePoints } from "@/lib/points/context";
import {
  WellnessCheckContext,
  type WellnessCheckContextType,
} from "@/lib/wellness/context";
import { DEFAULT_WELLNESS_METRICS } from "@/lib/wellness/schema";
import { WellnessCheckCard } from "./WellnessCheckCard";

vi.mock("@/lib/points/context");

const mockAwardPoints = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (usePoints as unknown as Mock).mockReturnValue({
    awardPoints: mockAwardPoints,
  });
});

function renderCard(
  overrides: Partial<WellnessCheckContextType> = {},
  props: { onOpenConfig?: () => void; onOptOut?: () => void } = {},
) {
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
    deleteEntry: vi.fn().mockResolvedValue(undefined),
    saveConfig: vi.fn().mockResolvedValue(undefined),
    disableCheck: vi.fn().mockResolvedValue(undefined),
    enableCheck: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  render(
    <WellnessCheckContext.Provider value={ctx}>
      <WellnessCheckCard {...props} />
    </WellnessCheckContext.Provider>,
  );

  return { saveEntry, ctx };
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
    expect(saveEntry).toHaveBeenCalledWith(
      [
        {
          metricId: DEFAULT_WELLNESS_METRICS[0].id,
          label: "Overall mood",
          value: 3,
        },
      ],
      undefined,
    );
  });

  it("does not render settings button when onOpenConfig is not provided", () => {
    renderCard();
    expect(
      screen.queryByRole("button", { name: "Configure wellness check" }),
    ).not.toBeInTheDocument();
  });

  it("renders settings button when onOpenConfig is provided", () => {
    renderCard({}, { onOpenConfig: vi.fn() });
    expect(
      screen.getByRole("button", { name: "Configure wellness check" }),
    ).toBeInTheDocument();
  });

  it("calls onOpenConfig when settings button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenConfig = vi.fn();
    renderCard({}, { onOpenConfig });
    await user.click(
      screen.getByRole("button", { name: "Configure wellness check" }),
    );
    expect(onOpenConfig).toHaveBeenCalledOnce();
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
          deleteEntry: vi.fn().mockResolvedValue(undefined),
          saveConfig: vi.fn().mockResolvedValue(undefined),
          disableCheck: vi.fn().mockResolvedValue(undefined),
          enableCheck: vi.fn().mockResolvedValue(undefined),
        }}
      >
        <WellnessCheckCard />
      </WellnessCheckContext.Provider>,
    );

    // Rate only the first metric
    const ratingButtons = screen.getAllByRole("button", { name: "3" });
    await user.click(ratingButtons[0]);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(saveEntry).toHaveBeenCalledWith(
      [
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
      ],
      undefined,
    );
  });

  describe("note expander", () => {
    it("renders 'Add note' toggle button", () => {
      renderCard();
      expect(
        screen.getByRole("button", { name: "Add note" }),
      ).toBeInTheDocument();
    });

    it("note textarea is hidden by default", () => {
      renderCard();
      expect(
        screen.queryByRole("textbox", { name: "Note" }),
      ).not.toBeInTheDocument();
    });

    it("clicking 'Add note' reveals the note textarea", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole("button", { name: "Add note" }));

      expect(screen.getByRole("textbox", { name: "Note" })).toBeInTheDocument();
    });

    it("toggle label changes to 'Hide note' when expanded", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole("button", { name: "Add note" }));

      expect(
        screen.getByRole("button", { name: "Hide note" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Add note" }),
      ).not.toBeInTheDocument();
    });

    it("clicking 'Hide note' collapses the textarea", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole("button", { name: "Add note" }));
      await user.click(screen.getByRole("button", { name: "Hide note" }));

      expect(
        screen.queryByRole("textbox", { name: "Note" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("note-only entry (extended fill floor)", () => {
    it("save button remains disabled with empty note and no rating", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole("button", { name: "Add note" }));
      // textarea is visible but empty

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("save button enables when a note is entered with no rating", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole("button", { name: "Add note" }));
      await user.type(
        screen.getByRole("textbox", { name: "Note" }),
        "Feeling tired today",
      );

      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
    });

    it("saveEntry is called with note and null metrics for a note-only entry", async () => {
      const user = userEvent.setup();
      const { saveEntry } = renderCard();

      await user.click(screen.getByRole("button", { name: "Add note" }));
      await user.type(
        screen.getByRole("textbox", { name: "Note" }),
        "Feeling tired today",
      );
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(saveEntry).toHaveBeenCalledOnce();
      expect(saveEntry).toHaveBeenCalledWith(
        [
          {
            metricId: DEFAULT_WELLNESS_METRICS[0].id,
            label: "Overall mood",
            value: null,
          },
        ],
        "Feeling tired today",
      );
    });
  });

  describe("flat points award", () => {
    it("awards points when saving a check with a rating", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole("button", { name: "3" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(mockAwardPoints).toHaveBeenCalledOnce();
      expect(mockAwardPoints).toHaveBeenCalledWith(5, expect.any(Object));
    });

    it("awards points when saving a note-only check", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByRole("button", { name: "Add note" }));
      await user.type(
        screen.getByRole("textbox", { name: "Note" }),
        "Just a note",
      );
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(mockAwardPoints).toHaveBeenCalledOnce();
      expect(mockAwardPoints).toHaveBeenCalledWith(5, expect.any(Object));
    });

    it("awarded points amount does not vary with rating value", async () => {
      const user = userEvent.setup();
      renderCard();

      // Rate with 1 (lowest)
      await user.click(screen.getByRole("button", { name: "1 – Low" }));
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(mockAwardPoints).toHaveBeenCalledWith(5, expect.any(Object));
    });
  });

  it("renders an opt-out button", () => {
    renderCard();
    expect(
      screen.getByRole("button", { name: "Turn off wellness checks" }),
    ).toBeInTheDocument();
  });

  it("clicking opt-out calls disableCheck", async () => {
    const user = userEvent.setup();
    const { ctx } = renderCard();
    await user.click(
      screen.getByRole("button", { name: "Turn off wellness checks" }),
    );
    expect(ctx.disableCheck).toHaveBeenCalledOnce();
  });

  it("clicking opt-out calls onOptOut prop", async () => {
    const user = userEvent.setup();
    const onOptOut = vi.fn();
    renderCard({}, { onOptOut });
    await user.click(
      screen.getByRole("button", { name: "Turn off wellness checks" }),
    );
    expect(onOptOut).toHaveBeenCalledOnce();
  });
});
