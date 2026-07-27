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
import { QuestLog } from "./QuestLog";

vi.mock("@/lib/meadowmere/context");

const claimQuest = vi.fn();

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({ claimQuest, ...overrides }),
  );
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

  it("shows a checklist with progress and cannot be handed in early", () => {
    mock({ state: makeMeadowmereState({ inventory: { "parsnip-root": 1 } }) });
    render(<QuestLog />);

    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Not ready" })).toBeDisabled();
  });

  it("caps the shown count at what the quest asks for", () => {
    mock({ state: makeMeadowmereState({ inventory: { "parsnip-root": 9 } }) });
    render(<QuestLog />);

    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("hands in a quest whose requirements are met", async () => {
    mock({ state: makeMeadowmereState({ inventory: { "parsnip-root": 3 } }) });
    render(<QuestLog />);

    await userEvent.click(screen.getByRole("button", { name: "Hand in" }));
    expect(claimQuest).toHaveBeenCalledWith("a-bed-for-parsnips");
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
