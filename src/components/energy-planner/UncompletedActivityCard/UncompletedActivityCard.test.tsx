import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { EnergyPlannerProvider } from "../../../lib/energy-planner/context";
import type { Activity } from "../../../lib/energy-planner/schema";
import { PointsProvider } from "../../../lib/points/context";
import { UncompletedActivityCard } from ".";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <PointsProvider>
      <EnergyPlannerProvider>{children}</EnergyPlannerProvider>
    </PointsProvider>
  );
}

const mockActivity: Activity = {
  id: "test-activity-1",
  title: "Test Uncompleted Activity",
  description: "An activity from yesterday",
  energyCost: { physical: 10, social: 5, executive: 15 },
  factors: {
    initiationDifficulty: 5,
    terminationDifficulty: 3,
    isRestorative: false,
  },
  createdAt: new Date(),
};

describe("UncompletedActivityCard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders activity title", () => {
    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    expect(screen.getByText("Test Uncompleted Activity")).toBeInTheDocument();
  });

  it("displays the original date", () => {
    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    // Match partial date format - locale may vary
    expect(screen.getByText(/from.*January.*13.*2026/)).toBeInTheDocument();
  });

  it("displays energy badges", () => {
    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    expect(screen.getByText(/10.*P/)).toBeInTheDocument();
    expect(screen.getByText(/5.*S/)).toBeInTheDocument();
    expect(screen.getByText(/15.*E/)).toBeInTheDocument();
  });

  it("hides unchecked/zero energy types", () => {
    const zeroEnergyActivity: Activity = {
      ...mockActivity,
      energyCost: { physical: 10, social: 0, executive: 0 },
    };

    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={zeroEnergyActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    expect(screen.getByText(/10.*P/)).toBeInTheDocument();
    expect(screen.queryByText(/S/)).not.toBeInTheDocument();
    expect(screen.queryByText(/E/)).not.toBeInTheDocument();
  });

  it("renders Complete button", () => {
    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
  });

  it("renders Move to Today button", () => {
    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    expect(screen.getByLabelText("Move to today")).toBeInTheDocument();
  });

  it("renders Unplan button", () => {
    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    expect(screen.getByLabelText("Return to unplanned")).toBeInTheDocument();
  });

  it("handles Complete button click", async () => {
    const user = userEvent.setup();

    // Setup localStorage with the activity planned for fromDate
    localStorage.setItem(
      "energy_planner_day_plan_2026-01-13",
      JSON.stringify({
        date: "2026-01-13",
        selectedActivityIds: ["test-activity-1"],
        completedActivityIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    await user.click(screen.getByLabelText("Mark as complete"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Mark as complete")).toBeInTheDocument();
  });

  it("handles Move to Today button click", async () => {
    const user = userEvent.setup();

    // Setup localStorage with the activity planned for fromDate
    localStorage.setItem(
      "energy_planner_day_plan_2026-01-13",
      JSON.stringify({
        date: "2026-01-13",
        selectedActivityIds: ["test-activity-1"],
        completedActivityIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    await user.click(screen.getByLabelText("Move to today"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Move to today")).toBeInTheDocument();
  });

  it("handles Unplan button click", async () => {
    const user = userEvent.setup();

    // Setup localStorage with the activity planned for fromDate
    localStorage.setItem(
      "energy_planner_day_plan_2026-01-13",
      JSON.stringify({
        date: "2026-01-13",
        selectedActivityIds: ["test-activity-1"],
        completedActivityIds: [],
        dailyCapacity: { physical: 50, social: 50, executive: 50 },
      }),
    );

    render(
      <Wrapper>
        <UncompletedActivityCard
          activity={mockActivity}
          fromDate="2026-01-13"
          instanceId="instance-test-1"
        />
      </Wrapper>,
    );

    await user.click(screen.getByLabelText("Return to unplanned"));
    // Button should be clickable without errors
    expect(screen.getByLabelText("Return to unplanned")).toBeInTheDocument();
  });
});
