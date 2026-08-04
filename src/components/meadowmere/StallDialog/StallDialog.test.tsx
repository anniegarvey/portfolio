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
import { StallDialog } from "./StallDialog";

vi.mock("@/lib/meadowmere/context");

const buySeed = vi.fn();
const onClose = vi.fn();
let points = 50;

vi.mock("@/lib/points/context", () => ({
  usePoints: () => ({ points, spendPoints: vi.fn() }),
}));

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({ buySeed, ...overrides }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  points = 50;
});

describe("StallDialog", () => {
  it("stays shut until the farmer walks up to the stall", () => {
    mock();
    render(<StallDialog onClose={onClose} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is plain that points only ever flow one way", () => {
    mock();
    render(<StallDialog onClose={onClose} open />);

    expect(
      screen.getByText(/Nothing here pays points back/),
    ).toBeInTheDocument();
  });

  it("lists every crop, locked ones included", () => {
    mock();
    render(<StallDialog onClose={onClose} open />);

    expect(screen.getByText(/Parsnip/)).toBeInTheDocument();
    expect(screen.getByText(/Moonpetal/)).toBeInTheDocument();
    expect(
      screen.getAllByText("Locked — earned through a quest."),
    ).toHaveLength(4);
  });

  it("shows how many packets are already in the pouch", () => {
    mock({ state: makeMeadowmereState({ seeds: { parsnip: 2 } }) });
    render(<StallDialog onClose={onClose} open />);

    expect(screen.getByText(/you have 2/)).toBeInTheDocument();
  });

  it("buys a seed packet", async () => {
    mock();
    render(<StallDialog onClose={onClose} open />);

    await userEvent.click(screen.getByRole("button", { name: /Buy seed/ }));
    expect(buySeed).toHaveBeenCalledWith("parsnip");
  });

  it("won't sell what the player can't afford", () => {
    points = 1;
    mock();
    render(<StallDialog onClose={onClose} open />);

    expect(screen.getByRole("button", { name: /Buy seed/ })).toBeDisabled();
  });

  it("offers a crop for sale once a quest unlocks it", () => {
    mock({
      state: makeMeadowmereState({
        unlockedCropIds: ["parsnip", "cornflower"],
      }),
    });
    render(<StallDialog onClose={onClose} open />);

    expect(screen.getAllByRole("button", { name: /Buy seed/ })).toHaveLength(2);
  });

  it("closes when asked", async () => {
    mock();
    render(<StallDialog onClose={onClose} open />);

    await userEvent.click(screen.getByRole("button", { name: "Close modal" }));
    expect(onClose).toHaveBeenCalled();
  });
});
