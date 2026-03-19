import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PointsProvider, usePoints } from "@/lib/points/context";
import { PointsDisplay } from "./PointsDisplay";

vi.mock("@/lib/points/sounds", () => ({
  playCollectSound: vi.fn(),
  playDepositSound: vi.fn(),
}));

function AwardButton({ amount }: { amount: number }) {
  const { awardPoints } = usePoints();
  return (
    <button onClick={() => awardPoints(amount, 0, 0)} type="button">
      Award
    </button>
  );
}

describe("PointsDisplay", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.removeItem("energy-planner-points");
  });

  it("shows the initial points count of zero", async () => {
    render(
      <PointsProvider>
        <PointsDisplay />
      </PointsProvider>,
    );
    await waitFor(() => expect(screen.getByText("0")).toBeInTheDocument());
  });

  it("has the data-points-display attribute for particle targeting", async () => {
    render(
      <PointsProvider>
        <PointsDisplay />
      </PointsProvider>,
    );
    await waitFor(() =>
      expect(
        document.querySelector("[data-points-display]"),
      ).toBeInTheDocument(),
    );
  });

  it("calls animate on the wrapper when points increase", async () => {
    // Use reduced motion so points update synchronously without particles
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));

    const animateMock = vi
      .spyOn(Element.prototype, "animate")
      .mockReturnValue({} as Animation);

    render(
      <PointsProvider>
        <PointsDisplay />
        <AwardButton amount={5} />
      </PointsProvider>,
    );

    await act(async () => {
      screen.getByText("Award").click();
    });

    await waitFor(() => expect(animateMock).toHaveBeenCalled());

    animateMock.mockRestore();
  });
});
