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
import { NeighbourDialog } from "./NeighbourDialog";

vi.mock("@/lib/meadowmere/context");

const claimQuest = vi.fn();
const onClose = vi.fn();

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({ claimQuest, ...overrides }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NeighbourDialog", () => {
  it("stays shut when nobody is being called on", () => {
    mock();
    render(<NeighbourDialog neighbourId={null} onClose={onClose} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("titles the dialog with the neighbour and introduces them", () => {
    mock();
    render(<NeighbourDialog neighbourId="nessa" onClose={onClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Nessa")).toBeInTheDocument();
    expect(screen.getByText("Cook at the Hollow Inn")).toBeInTheDocument();
  });

  it("shows only what this neighbour has asked for", () => {
    mock();
    render(<NeighbourDialog neighbourId="nessa" onClose={onClose} />);

    expect(screen.getByText("What Nessa has asked for")).toBeInTheDocument();
    expect(screen.getByText("A Bed for Parsnips")).toBeInTheDocument();
  });

  it("says so when a neighbour has nothing on", () => {
    mock();
    render(<NeighbourDialog neighbourId="marigold" onClose={onClose} />);
    expect(screen.getByText("Nothing at the moment.")).toBeInTheDocument();
  });

  it("won't let a quest be handed in early", () => {
    mock({
      state: makeMeadowmereState({ inventory: { "parsnip-root": 1 } }),
    });
    render(<NeighbourDialog neighbourId="nessa" onClose={onClose} />);

    expect(
      screen.getByRole("button", { name: "Not ready yet" }),
    ).toBeDisabled();
    expect(screen.getByText(/Parsnip 1\/3/)).toBeInTheDocument();
  });

  it("hands in a quest whose requirements are met", async () => {
    mock({
      state: makeMeadowmereState({ inventory: { "parsnip-root": 3 } }),
    });
    render(<NeighbourDialog neighbourId="nessa" onClose={onClose} />);

    await userEvent.click(
      screen.getByRole("button", { name: /Hand in .A Bed for Parsnips./ }),
    );
    expect(claimQuest).toHaveBeenCalledWith("a-bed-for-parsnips");
  });

  it("shows the giver's thanks once it's done", () => {
    mock({
      state: makeMeadowmereState({
        completedQuestIds: ["a-bed-for-parsnips"],
      }),
    });
    render(<NeighbourDialog neighbourId="nessa" onClose={onClose} />);

    expect(screen.getByText("Handed in")).toBeInTheDocument();
    expect(screen.getByText(/cornflower seeds/)).toBeInTheDocument();
  });

  it("closes when asked", async () => {
    mock();
    render(<NeighbourDialog neighbourId="bram" onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalled();
  });
});
