import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
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
});

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
