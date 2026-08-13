import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("how-to-play modal", () => {
  it("opens on first visit", () => {
    localStorage.clear(); // undo the file's beforeEach markInstructionsSeen()
    render(<MeadowmerePage />);

    expect(screen.getByRole("dialog", { name: "How to play" })).toBeVisible();
  });

  it("stays closed on a return visit", () => {
    render(<MeadowmerePage />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sits alongside the intro text rather than in its own row", () => {
    render(<MeadowmerePage />);

    const trigger = screen.getByRole("button", { name: "How to play" });
    const intro = screen.getByText(/Walk the Vale/);
    expect(trigger.parentElement).toBe(intro.parentElement);
  });

  it("reopens from the help trigger", async () => {
    const user = userEvent.setup();
    render(<MeadowmerePage />);

    await user.click(screen.getByRole("button", { name: "How to play" }));

    expect(screen.getByRole("dialog", { name: "How to play" })).toBeVisible();
  });

  it("includes the foraging guidance, no longer shown above the map", async () => {
    const user = userEvent.setup();
    render(<MeadowmerePage />);

    await user.click(screen.getByRole("button", { name: "How to play" }));

    expect(
      screen.getByText(/Materials are what neighbours want as gifts/),
    ).toBeVisible();
  });

  it("remembers it was dismissed, so it doesn't reopen on the next visit", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const { unmount } = render(<MeadowmerePage />);

    await user.click(screen.getByRole("button", { name: "Got it" }));
    unmount();
    render(<MeadowmerePage />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
