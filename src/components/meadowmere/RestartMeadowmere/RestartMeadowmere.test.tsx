import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_QUEST_IDS, RESTART_MIN_QUESTS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import {
  makeMeadowmereContext,
  makeMeadowmereState,
} from "@/lib/meadowmere/testFixtures";
import { RestartMeadowmere } from "./RestartMeadowmere";

vi.mock("@/lib/meadowmere/context");

const done = (n: number) =>
  makeMeadowmereState({ completedQuestIds: ALL_QUEST_IDS.slice(0, n) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RestartMeadowmere", () => {
  it("counts down the quests still needed", () => {
    vi.mocked(useMeadowmere).mockReturnValue(
      makeMeadowmereContext({ state: done(RESTART_MIN_QUESTS - 1) }),
    );
    render(<RestartMeadowmere />);
    expect(
      screen.getByText(/Complete 1 more quest to be able to restart/),
    ).toBeVisible();
  });

  it("restarts the farm once the player confirms", async () => {
    const restartMeadowmere = vi.fn();
    vi.mocked(useMeadowmere).mockReturnValue(
      makeMeadowmereContext({
        restartMeadowmere,
        state: done(RESTART_MIN_QUESTS),
      }),
    );
    render(<RestartMeadowmere />);
    await userEvent.click(
      screen.getByRole("button", { name: "Restart the farm…" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Restart the farm" }),
    );
    expect(restartMeadowmere).toHaveBeenCalled();
  });

  it("says how many quests are still needed in the plural", () => {
    vi.mocked(useMeadowmere).mockReturnValue(
      makeMeadowmereContext({ state: done(0) }),
    );
    render(<RestartMeadowmere />);
    expect(
      screen.getByText(
        new RegExp(`Complete ${RESTART_MIN_QUESTS} more quests`),
      ),
    ).toBeVisible();
  });
});
