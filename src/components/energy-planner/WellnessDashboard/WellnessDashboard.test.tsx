import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  WellnessCheckContext,
  type WellnessCheckContextType,
} from "@/lib/wellness/context";
import { DEFAULT_WELLNESS_METRICS } from "@/lib/wellness/schema";
import { WellnessDashboard } from "./WellnessDashboard";

const metricA = DEFAULT_WELLNESS_METRICS[0];
const metricB = {
  id: "bbb-bbb-bbb-bbb-bbb",
  label: "Sleep quality",
};

function makeCtx(overrides: Partial<WellnessCheckContextType> = {}) {
  const ctx: WellnessCheckContextType = {
    config: {
      enabled: true,
      anchorDate: "2024-01-01",
      frequency: 1,
      unit: "weeks",
      metrics: [metricA],
    },
    entries: [],
    isPending: false,
    isLoading: false,
    saveEntry: vi.fn().mockResolvedValue(undefined),
    deleteEntry: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
  return ctx;
}

function renderDashboard(overrides: Partial<WellnessCheckContextType> = {}) {
  const ctx = makeCtx(overrides);
  render(
    <WellnessCheckContext.Provider value={ctx}>
      <WellnessDashboard />
    </WellnessCheckContext.Provider>,
  );
  return ctx;
}

describe("WellnessDashboard", () => {
  describe("empty state", () => {
    it("shows an empty state message when there are no entries", () => {
      renderDashboard({ entries: [] });
      expect(
        screen.getByText(/no wellness check entries yet/i),
      ).toBeInTheDocument();
    });

    it("renders nothing while loading", () => {
      const { container } = render(
        <WellnessCheckContext.Provider value={makeCtx({ isLoading: true })}>
          <WellnessDashboard />
        </WellnessCheckContext.Provider>,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("charts", () => {
    it("renders one SVG chart per metric that has entries", () => {
      renderDashboard({
        entries: [
          {
            id: "e1",
            date: "2024-01-01",
            metrics: [{ metricId: metricA.id, label: metricA.label, value: 3 }],
          },
        ],
      });
      expect(
        screen.getByRole("img", { name: `${metricA.label} trend` }),
      ).toBeInTheDocument();
    });

    it("renders an archived badge for historical-only metrics", () => {
      renderDashboard({
        config: {
          enabled: true,
          anchorDate: "2024-01-01",
          frequency: 1,
          unit: "weeks",
          metrics: [],
        },
        entries: [
          {
            id: "e1",
            date: "2024-01-01",
            metrics: [
              { metricId: "old-metric", label: "Old metric", value: 2 },
            ],
          },
        ],
      });
      expect(screen.getByText(/archived/i)).toBeInTheDocument();
    });

    it("shows no chart when all values for a metric are null", () => {
      renderDashboard({
        config: {
          enabled: true,
          anchorDate: "2024-01-01",
          frequency: 1,
          unit: "weeks",
          metrics: [metricA, metricB],
        },
        entries: [
          {
            id: "e1",
            date: "2024-01-01",
            metrics: [
              { metricId: metricA.id, label: metricA.label, value: 3 },
              { metricId: metricB.id, label: metricB.label, value: null },
            ],
          },
        ],
      });
      // metricA has a chart; metricB has "No rated values yet" fallback
      expect(
        screen.getByRole("img", { name: `${metricA.label} trend` }),
      ).toBeInTheDocument();
      expect(screen.getByText(/no rated values yet/i)).toBeInTheDocument();
    });
  });

  describe("entries list", () => {
    it("shows each entry's date and ratings", () => {
      renderDashboard({
        entries: [
          {
            id: "e1",
            date: "2024-01-05",
            metrics: [{ metricId: metricA.id, label: metricA.label, value: 4 }],
          },
        ],
      });
      const list = screen.getByRole("list", { name: /wellness entries/i });
      expect(within(list).getByText("05/01/24")).toBeInTheDocument();
      expect(within(list).getByText("4")).toBeInTheDocument();
      expect(within(list).getByText(metricA.label)).toBeInTheDocument();
    });

    it("lists entries in descending date order (newest first)", () => {
      renderDashboard({
        entries: [
          {
            id: "e1",
            date: "2024-01-01",
            metrics: [{ metricId: metricA.id, label: metricA.label, value: 2 }],
          },
          {
            id: "e2",
            date: "2024-01-08",
            metrics: [{ metricId: metricA.id, label: metricA.label, value: 5 }],
          },
        ],
      });
      const list = screen.getByRole("list", { name: /wellness entries/i });
      const items = within(list).getAllByRole("listitem");
      expect(items[0]).toHaveTextContent("08/01/24");
      expect(items[1]).toHaveTextContent("01/01/24");
    });

    it("calls deleteEntry with the correct id when delete is clicked", async () => {
      const user = userEvent.setup();
      const ctx = renderDashboard({
        entries: [
          {
            id: "entry-to-delete",
            date: "2024-01-05",
            metrics: [{ metricId: metricA.id, label: metricA.label, value: 3 }],
          },
        ],
      });

      await user.click(
        screen.getByRole("button", { name: /delete entry from/i }),
      );

      expect(ctx.deleteEntry).toHaveBeenCalledOnce();
      expect(ctx.deleteEntry).toHaveBeenCalledWith("entry-to-delete");
    });
  });
});
