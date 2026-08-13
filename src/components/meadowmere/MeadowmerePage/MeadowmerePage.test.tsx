import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMeadowmere } from "@/lib/meadowmere/context";
import { markInstructionsSeen } from "@/lib/meadowmere/storage";
import { makeMeadowmereContext } from "@/lib/meadowmere/testFixtures";
import { MeadowmerePage } from "./MeadowmerePage";

vi.mock("@/lib/meadowmere/context");
vi.mock("@/lib/points/context", () => ({
  usePoints: () => ({ points: 0, spendPoints: vi.fn() }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Otherwise the first-visit how-to-play modal opens on mount and hides the
  // rest of the page from the accessibility tree — these tests are about the
  // page underneath it, not the modal, which has its own coverage.
  markInstructionsSeen();
  vi.mocked(useMeadowmere).mockReturnValue(makeMeadowmereContext());
});

describe("MeadowmerePage", () => {
  it("titles the page", () => {
    render(<MeadowmerePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Meadowmere" }),
    ).toBeInTheDocument();
  });

  it("tells the player the game is somewhere they walk", () => {
    render(<MeadowmerePage />);
    expect(screen.getByText(/Walk the Vale/)).toBeInTheDocument();
  });

  it("puts the map on the page", () => {
    render(<MeadowmerePage />);
    expect(screen.getByRole("application")).toBeInTheDocument();
  });

  it("keeps the overnight digest out of the way when there is none", () => {
    render(<MeadowmerePage />);
    expect(
      screen.queryByText("Overnight at Meadowmere"),
    ).not.toBeInTheDocument();
  });

  it("shows the overnight digest when the day advanced", () => {
    vi.mocked(useMeadowmere).mockReturnValue(
      makeMeadowmereContext({
        dailyReport: {
          daysPassed: 2,
          ripened: [{ cropId: "parsnip", count: 1 }],
          stillGrowing: 0,
          foragesRefilled: 3,
        },
      }),
    );
    render(<MeadowmerePage />);

    expect(screen.getByText("Overnight at Meadowmere")).toBeInTheDocument();
  });
});
