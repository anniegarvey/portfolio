import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RestorativeNudge } from "./RestorativeNudge";

vi.mock("@/lib/energy-planner/context", () => ({
  useEnergyPlanner: vi.fn(),
}));

import { useEnergyPlanner } from "@/lib/energy-planner/context";

function mockActivity(id: string, title: string, isRestorative: boolean) {
  return {
    id,
    title,
    energyCost: {},
    factors: {
      isRestorative,
      initiationDifficulty: 0,
      terminationDifficulty: 0,
    },
    createdAt: new Date(),
  };
}

function mockResolved(id: string, isRestorative = false) {
  const activity = mockActivity(id, `Activity ${id}`, isRestorative);
  return { instance: { id, sourceActivityId: id, completed: false }, activity };
}

const addToPlan = vi.fn();
const addActivity = vi.fn();
const onOpenManageActivities = vi.fn();

function setup(
  overrides: {
    resolvedActivities?: unknown[];
    availableActivities?: unknown[];
  } = {},
) {
  vi.mocked(useEnergyPlanner).mockReturnValue({
    resolvedActivities: [],
    availableActivities: [],
    addToPlan,
    addActivity,
    ...overrides,
    // biome-ignore lint/suspicious/noExplicitAny: test mock
  } as any);
}

const threeNonRestorative = [
  mockResolved("a1"),
  mockResolved("a2"),
  mockResolved("a3"),
];

describe("RestorativeNudge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addActivity.mockReturnValue(mockActivity("new-1", "Short walk", true));
  });

  it("renders nothing when fewer than 3 non-restorative activities are planned", () => {
    setup({ resolvedActivities: [mockResolved("a1"), mockResolved("a2")] });
    render(
      <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
    );
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("renders the banner when 3+ non-restorative activities are planned", () => {
    setup({ resolvedActivities: threeNonRestorative });
    render(
      <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
    );
    expect(screen.getByRole("note")).toBeInTheDocument();
    expect(screen.getByText(/Consider some recovery time/)).toBeInTheDocument();
    expect(screen.getByText(/3 demanding activities/)).toBeInTheDocument();
  });

  it("renders nothing when a restorative activity is already planned", () => {
    setup({
      resolvedActivities: [...threeNonRestorative, mockResolved("r1", true)],
    });
    render(
      <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
    );
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("dismisses when the X button is clicked", async () => {
    setup({ resolvedActivities: threeNonRestorative });
    render(
      <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
    );
    expect(screen.getByRole("note")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Dismiss reminder" }),
    );
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  describe("with no history of restorative activities", () => {
    it("shows default suggestion chips", () => {
      setup({ resolvedActivities: threeNonRestorative });
      render(
        <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
      );
      expect(
        screen.getByRole("button", { name: "+ Short walk" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "+ Listen to music" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "+ Meditate" }),
      ).toBeInTheDocument();
    });

    it("does not show Browse all button without history", () => {
      setup({ resolvedActivities: threeNonRestorative });
      render(
        <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
      );
      expect(
        screen.queryByRole("button", { name: /Browse all/i }),
      ).not.toBeInTheDocument();
    });

    it("clicking a default chip creates and adds the activity", async () => {
      setup({ resolvedActivities: threeNonRestorative });
      render(
        <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
      );

      await userEvent.click(
        screen.getByRole("button", { name: "+ Short walk" }),
      );

      expect(addActivity).toHaveBeenCalledWith({
        title: "Short walk",
        energyCost: {},
        factors: {
          isRestorative: true,
          initiationDifficulty: 0,
          terminationDifficulty: 0,
        },
      });
      expect(addToPlan).toHaveBeenCalledWith(
        "new-1",
        undefined,
        expect.objectContaining({ title: "Short walk" }),
      );
    });
  });

  describe("with restorative activities available in history", () => {
    const restorativeActivity = mockActivity("r1", "Yoga", true);

    it("shows history chips instead of defaults", () => {
      setup({
        resolvedActivities: threeNonRestorative,
        availableActivities: [restorativeActivity],
      });
      render(
        <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
      );
      expect(
        screen.getByRole("button", { name: "+ Yoga" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "+ Short walk" }),
      ).not.toBeInTheDocument();
    });

    it("shows Browse all button with history suggestions", () => {
      setup({
        resolvedActivities: threeNonRestorative,
        availableActivities: [restorativeActivity],
      });
      render(
        <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
      );
      expect(
        screen.getByRole("button", { name: /Browse all/i }),
      ).toBeInTheDocument();
    });

    it("clicking a history chip adds the activity to the plan", async () => {
      setup({
        resolvedActivities: threeNonRestorative,
        availableActivities: [restorativeActivity],
      });
      render(
        <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
      );

      await userEvent.click(screen.getByRole("button", { name: "+ Yoga" }));

      expect(addToPlan).toHaveBeenCalledWith(
        "r1",
        undefined,
        restorativeActivity,
      );
      expect(addActivity).not.toHaveBeenCalled();
    });

    it("Browse all button calls onOpenManageActivities", async () => {
      setup({
        resolvedActivities: threeNonRestorative,
        availableActivities: [restorativeActivity],
      });
      render(
        <RestorativeNudge onOpenManageActivities={onOpenManageActivities} />,
      );

      await userEvent.click(
        screen.getByRole("button", { name: /Browse all/i }),
      );

      expect(onOpenManageActivities).toHaveBeenCalledOnce();
    });
  });
});
