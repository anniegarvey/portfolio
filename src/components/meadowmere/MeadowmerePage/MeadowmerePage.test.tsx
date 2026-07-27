import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
import {
  makeMeadowmereContext,
  makeMeadowmereState,
} from "@/lib/meadowmere/testFixtures";
import { usePoints } from "@/lib/points/context";
import { MeadowmerePage } from "./MeadowmerePage";

vi.mock("@/lib/meadowmere/context");
vi.mock("@/lib/points/context");

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(makeMeadowmereContext(overrides));
  vi.mocked(usePoints).mockReturnValue({
    points: 0,
    awardPoints: vi.fn(),
    spendPoints: vi.fn(),
  } as unknown as ReturnType<typeof usePoints>);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MeadowmerePage", () => {
  it("opens on the farm", () => {
    mock();
    render(<MeadowmerePage />);

    expect(
      screen.getByRole("heading", { name: "Meadowmere", level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Farm" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { name: "Seed tray" })).toBeVisible();
  });

  it("switches between sections", async () => {
    mock();
    render(<MeadowmerePage />);

    await userEvent.click(screen.getByRole("tab", { name: "Wilds" }));
    expect(screen.getByRole("heading", { name: "The wilds" })).toBeVisible();

    await userEvent.click(screen.getByRole("tab", { name: /Neighbours/ }));
    expect(screen.getByText("Nessa")).toBeVisible();

    await userEvent.click(screen.getByRole("tab", { name: /Quests/ }));
    expect(screen.getByText("A Bed for Parsnips")).toBeVisible();
  });

  it("flags quests that are ready to hand in", () => {
    mock({ state: makeMeadowmereState({ inventory: { "parsnip-root": 3 } }) });
    render(<MeadowmerePage />);

    expect(screen.getByLabelText("1 ready to hand in")).toBeInTheDocument();
  });

  it("shows no flag when nothing is ready", () => {
    mock();
    render(<MeadowmerePage />);

    expect(screen.queryByLabelText(/ready to hand in/)).not.toBeInTheDocument();
  });

  it("announces a harvest for screen readers", () => {
    mock({ notice: { kind: "harvest", cropId: "parsnip", amount: 3 } });
    render(<MeadowmerePage />);

    expect(screen.getByText("Harvested 3 × Parsnip.")).toBeInTheDocument();
  });

  it("announces nothing for an unrelated notice", () => {
    mock({
      notice: {
        kind: "forage",
        siteId: "hedgerow",
        itemId: "acorn",
        amount: 1,
      },
    });
    render(<MeadowmerePage />);

    expect(screen.queryByText(/Harvested/)).not.toBeInTheDocument();
  });
});
