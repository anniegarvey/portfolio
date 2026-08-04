import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
import {
  makeMeadowmereContext,
  makeMeadowmereState,
} from "@/lib/meadowmere/testFixtures";
import { NeighbourCard } from "./NeighbourCard";

vi.mock("@/lib/meadowmere/context");

const TODAY = "2026-06-15";
const giveGift = vi.fn();

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({ giveGift, ...overrides }),
  );
}

// jsdom implements none of the pointer-capture API that Radix Select drives
// its trigger with. Plain assignments (not vi.fn) so afterEach's
// restoreAllMocks can't strip them between tests.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(`${TODAY}T12:00:00`));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("friendship", () => {
  it("shows the tier and progress to the next one", () => {
    mock({
      state: makeMeadowmereState({
        neighbours: { marigold: { friendship: 25 } },
      }),
    });
    render(<NeighbourCard neighbourId="marigold" />);

    expect(screen.getByText("Acquaintance")).toBeInTheDocument();
    expect(screen.getByText("25/40")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
  });

  it("shows the total once at the top tier", () => {
    mock({
      state: makeMeadowmereState({
        neighbours: { marigold: { friendship: 90 } },
      }),
    });
    render(<NeighbourCard neighbourId="marigold" />);

    expect(screen.getByText("Dear Friend")).toBeInTheDocument();
    expect(screen.getByText("90/100")).toBeInTheDocument();
  });

  it("lists what the neighbour likes", () => {
    mock();
    render(<NeighbourCard neighbourId="marigold" />);

    expect(
      screen.getByText("Likes: Wild Honey, Cornflower, River Clay, Reed"),
    ).toBeInTheDocument();
  });
});

describe("gifting", () => {
  it("cannot gift with an empty larder", () => {
    mock();
    render(<NeighbourCard neighbourId="marigold" />);

    expect(screen.getByRole("button", { name: "Give gift" })).toBeDisabled();
    expect(
      screen.getByText(
        "Nothing to give yet — harvest or forage something first.",
      ),
    ).toBeInTheDocument();
  });

  it("gives a chosen item", async () => {
    mock({
      state: makeMeadowmereState({ inventory: { "wild-honey": 2 } }),
    });
    render(<NeighbourCard neighbourId="marigold" />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: /Wild Honey/ }));
    await userEvent.click(screen.getByRole("button", { name: "Give gift" }));

    expect(giveGift).toHaveBeenCalledWith("marigold", "wild-honey");
  });

  it("blocks a second gift the same day", () => {
    mock({
      state: makeMeadowmereState({
        inventory: { "wild-honey": 2 },
        neighbours: { marigold: { friendship: 10, lastGiftDate: TODAY } },
      }),
    });
    render(<NeighbourCard neighbourId="marigold" />);

    expect(screen.getByRole("button", { name: "Give gift" })).toBeDisabled();
    expect(
      screen.getByText("You’ve already given Marigold something today."),
    ).toBeInTheDocument();
  });

  it("reports a liked gift and a new tier with the right article", () => {
    mock({
      notice: {
        kind: "gift",
        neighbourId: "marigold",
        itemId: "wild-honey",
        liked: true,
        friendshipGained: 12,
        newTierName: "Acquaintance",
      },
    });
    render(<NeighbourCard neighbourId="marigold" />);

    expect(
      screen.getByText(
        "Marigold loved the wild honey (+12 friendship) — now an Acquaintance!",
      ),
    ).toBeInTheDocument();
  });

  it("uses 'a' for a consonant tier name", () => {
    mock({
      notice: {
        kind: "gift",
        neighbourId: "marigold",
        itemId: "pumpkin",
        liked: false,
        friendshipGained: 4,
        newTierName: "Friend",
      },
    });
    render(<NeighbourCard neighbourId="marigold" />);

    expect(
      screen.getByText(
        "Marigold accepted the pumpkin (+4 friendship) — now a Friend!",
      ),
    ).toBeInTheDocument();
  });

  it("shows no reaction for a gift to a different neighbour", () => {
    mock({
      notice: {
        kind: "gift",
        neighbourId: "bram",
        itemId: "acorn",
        liked: true,
        friendshipGained: 12,
        newTierName: null,
      },
    });
    render(<NeighbourCard neighbourId="marigold" />);

    expect(screen.queryByText(/Marigold loved/)).not.toBeInTheDocument();
  });
});

describe("focus after giving", () => {
  it("makes the reaction focusable so focus isn't lost when the button disables", async () => {
    mock({
      state: makeMeadowmereState({ inventory: { acorn: 1 } }),
      notice: {
        kind: "gift",
        neighbourId: "bram",
        itemId: "acorn",
        liked: true,
        friendshipGained: 12,
        newTierName: null,
      },
    });
    render(<NeighbourCard neighbourId="bram" />);

    expect(screen.getByText(/loved the acorn/)).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });
});
