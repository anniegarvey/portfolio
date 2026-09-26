import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ITEMS, NEIGHBOURS } from "@/lib/meadowmere/catalog";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
import { todaysErrand } from "@/lib/meadowmere/errandsModule";
import {
  makeMeadowmereContext,
  makeMeadowmereState,
} from "@/lib/meadowmere/testFixtures";
import { QuestLog } from "./QuestLog";

vi.mock("@/lib/meadowmere/context");

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(makeMeadowmereContext(overrides));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(`${ERRAND_DAY}T12:00:00`));
});

afterEach(() => {
  vi.useRealTimers();
});

const ERRAND_DAY = "2026-09-26";

/** A farm past the first quest, holding whatever today's errand asks for. */
function errandState(stocked: boolean, overrides = {}) {
  const base = makeMeadowmereState({
    completedQuestIds: ["a-bed-for-parsnips"],
    ...overrides,
  });
  const errand = todaysErrand(base, ERRAND_DAY);
  if (errand === null) throw new Error("no errand");
  return {
    errand,
    state: stocked
      ? { ...base, inventory: { [errand.itemId]: errand.amount } }
      : base,
  };
}

describe("reward wording", () => {
  it("describes seeds, a crop unlock and friendship", () => {
    mock();
    render(<QuestLog />);

    expect(
      screen.getByText(
        "Reward: 3 × Cornflower seeds · Cornflower unlocked · +10 friendship",
      ),
    ).toBeInTheDocument();
  });

  it("describes a site unlock", () => {
    mock({
      state: makeMeadowmereState({
        completedQuestIds: ["a-bed-for-parsnips"],
      }),
    });
    render(<QuestLog />);

    expect(
      screen.getByText("Reward: The Riverbank opened · +10 friendship"),
    ).toBeInTheDocument();
  });

  it("describes extra plots", () => {
    mock({
      state: makeMeadowmereState({
        completedQuestIds: ["a-bed-for-parsnips", "down-to-the-riverbank"],
      }),
    });
    render(<QuestLog />);

    expect(screen.getByText(/3 more plots/)).toBeInTheDocument();
  });
});

describe("QuestLog", () => {
  it("shows only the opening quest on a fresh farm", () => {
    mock();
    render(<QuestLog />);

    expect(screen.getByText("A Bed for Parsnips")).toBeInTheDocument();
    expect(screen.queryByText("Down to the Riverbank")).not.toBeInTheDocument();
  });

  it("shows a checklist with progress and reads as still gathering", () => {
    mock({ state: makeMeadowmereState({ inventory: { "parsnip-root": 1 } }) });
    render(<QuestLog />);

    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("Still gathering.")).toBeInTheDocument();
  });

  it("caps the shown count at what the quest asks for", () => {
    mock({ state: makeMeadowmereState({ inventory: { "parsnip-root": 9 } }) });
    render(<QuestLog />);

    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  // The journal is a read-only account: quests are handed in by calling on
  // whoever set them, so it points the player at the right door instead.
  it("sends a ready quest back to the neighbour who set it", () => {
    mock({ state: makeMeadowmereState({ inventory: { "parsnip-root": 3 } }) });
    render(<QuestLog />);

    expect(
      screen.getByText("Ready — call on Nessa to hand it in."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the giver's thanks once completed and unlocks the next quest", () => {
    mock({
      state: makeMeadowmereState({
        completedQuestIds: ["a-bed-for-parsnips"],
      }),
    });
    render(<QuestLog />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText(/Marigold’s mad for them/)).toBeInTheDocument();
    expect(screen.getByText("Down to the Riverbank")).toBeInTheDocument();
  });

  it("shows friendship requirements as a checklist line", () => {
    mock({
      state: makeMeadowmereState({
        completedQuestIds: [
          "a-bed-for-parsnips",
          "down-to-the-riverbank",
          "clay-for-the-kiln",
        ],
        neighbours: { marigold: { friendship: 30 } },
      }),
    });
    render(<QuestLog />);

    expect(screen.getByText("Friendship with Marigold")).toBeInTheDocument();
    expect(screen.getByText("30/45")).toBeInTheDocument();
  });
});

describe("journal extras", () => {
  it("describes a keepsake reward", () => {
    mock({
      state: makeMeadowmereState({
        completedQuestIds: ["a-bed-for-parsnips", "down-to-the-riverbank"],
      }),
    });
    render(<QuestLog />);

    expect(
      screen.getByText(
        "Reward: 3 × Parsnip seeds · a scarecrow for the farm · +8 friendship",
      ),
    ).toBeInTheDocument();
  });

  it("tallies quests and keepsakes against the whole chain", () => {
    mock({
      state: makeMeadowmereState({
        completedQuestIds: [
          "a-bed-for-parsnips",
          "down-to-the-riverbank",
          "a-scarecrow-for-the-field",
        ],
      }),
    });
    render(<QuestLog />);

    expect(
      screen.getByText(/3 of 29 quests completed · 1 of 13 keepsakes found/),
    ).toBeInTheDocument();
  });

  it("puts open quests above settled ones", () => {
    mock({
      state: makeMeadowmereState({
        completedQuestIds: ["a-bed-for-parsnips"],
      }),
    });
    render(<QuestLog />);

    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(titles.indexOf("A Bed for Parsnips")).toBe(titles.length - 1);
  });

  it("shows no errand before the first quest is done", () => {
    mock();
    render(<QuestLog />);
    expect(screen.queryByText("Today’s errand")).not.toBeInTheDocument();
  });

  it("shows today's errand once errands have opened", () => {
    const { errand, state } = errandState(false);
    mock({ state });
    render(<QuestLog />);

    expect(screen.getByText("Today’s errand")).toBeInTheDocument();
    expect(
      screen.getByText(
        `${NEIGHBOURS[errand.neighbourId].name} could do with ${errand.amount} × ${ITEMS[errand.itemId].name}.`,
      ),
    ).toBeInTheDocument();
  });

  it("sends a ready errand to whoever asked", () => {
    const { errand, state } = errandState(true);
    mock({ state });
    render(<QuestLog />);

    expect(
      screen.getByText(
        `Ready — call on ${NEIGHBOURS[errand.neighbourId].name} to hand it in.`,
      ),
    ).toBeInTheDocument();
  });

  it("marks the errand done for the rest of the day", () => {
    const { state } = errandState(true, { lastErrandDate: ERRAND_DAY });
    mock({ state });
    render(<QuestLog />);

    expect(screen.getByText("Done today")).toBeInTheDocument();
  });
});
