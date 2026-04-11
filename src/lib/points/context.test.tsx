import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PointsProvider, usePoints } from "./context";

vi.mock("./sounds", () => ({
  playCollectSound: vi.fn(),
  playDepositSound: vi.fn(),
}));

function PointsReadout() {
  const { points } = usePoints();
  return <div data-testid="points">{points}</div>;
}

function AwardButton({ amount }: { amount: number }) {
  const { awardPoints } = usePoints();
  return (
    <button onClick={() => awardPoints(amount, new DOMRect())} type="button">
      Award
    </button>
  );
}

function SpendButton({ amount }: { amount: number }) {
  const { spendPoints } = usePoints();
  return (
    <button
      data-testid={`spend-${amount}`}
      onClick={() => spendPoints(amount)}
      type="button"
    >
      Spend
    </button>
  );
}

describe("PointsProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.removeItem("energy-planner-points");
    localStorage.removeItem("energy-planner-last-active-date");
  });

  it("provides initial zero points", async () => {
    render(
      <PointsProvider>
        <PointsReadout />
      </PointsProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("points")).toHaveTextContent("0"),
    );
  });

  it("restores persisted points from localStorage on mount", async () => {
    localStorage.setItem("energy-planner-points", "42");

    render(
      <PointsProvider>
        <PointsReadout />
      </PointsProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("points")).toHaveTextContent("42"),
    );
  });

  it("awards points immediately when prefers-reduced-motion is set", async () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    render(
      <PointsProvider>
        <PointsReadout />
        <AwardButton amount={10} />
      </PointsProvider>,
    );

    await act(async () => {
      screen.getByText("Award").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("points")).toHaveTextContent("10"),
    );
    expect(localStorage.getItem("energy-planner-points")).toBe("10");
  });

  it("completes particles and increments points after timers fire", async () => {
    vi.useFakeTimers();

    render(
      <PointsProvider>
        <PointsReadout />
        <AwardButton amount={5} />
      </PointsProvider>,
    );

    await act(async () => {
      screen.getByText("Award").click();
    });

    // Advance past burst (280ms) + max stagger for 5 particles (200ms) + fly (680ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(280 + 200 + 680 + 100);
    });

    vi.useRealTimers();

    await waitFor(() =>
      expect(screen.getByTestId("points")).toHaveTextContent("5"),
    );
  });
});

describe("spendPoints", () => {
  afterEach(() => {
    localStorage.removeItem("energy-planner-points");
  });

  it("deducts points and persists when sufficient balance", async () => {
    localStorage.setItem("energy-planner-points", "50");

    render(
      <PointsProvider>
        <PointsReadout />
        <SpendButton amount={20} />
      </PointsProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("points")).toHaveTextContent("50"),
    );

    await act(async () => {
      screen.getByTestId("spend-20").click();
    });

    await waitFor(() =>
      expect(screen.getByTestId("points")).toHaveTextContent("30"),
    );
    expect(localStorage.getItem("energy-planner-points")).toBe("30");
  });

  it("does not deduct points when balance is insufficient", async () => {
    localStorage.setItem("energy-planner-points", "10");

    render(
      <PointsProvider>
        <PointsReadout />
        <SpendButton amount={50} />
      </PointsProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("points")).toHaveTextContent("10"),
    );

    await act(async () => {
      screen.getByTestId("spend-50").click();
    });

    // Points should remain unchanged
    expect(screen.getByTestId("points")).toHaveTextContent("10");
    expect(localStorage.getItem("energy-planner-points")).toBe("10");
  });
});

describe("usePoints", () => {
  it("throws when used outside PointsProvider", () => {
    // Suppress React's own error logging for this intentional throw test
    vi.mocked(console.error).mockImplementation(() => {});

    expect(() => render(<PointsReadout />)).toThrow(
      "usePoints must be used within a PointsProvider",
    );
  });
});
