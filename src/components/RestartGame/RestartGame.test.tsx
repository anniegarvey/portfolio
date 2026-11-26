import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PRESTIGE_STORAGE_KEY } from "@/lib/points/keys";
import { recordRestart } from "@/lib/points/prestige";
import { RestartGame } from "./RestartGame";

afterEach(() => {
  localStorage.removeItem(PRESTIGE_STORAGE_KEY);
});

function renderPanel(stillNeeded: string | null, onRestart = vi.fn()) {
  render(
    <RestartGame
      bonusPercent={60}
      description="Everything starts over."
      game="glade"
      label="Restart the glade"
      onRestart={onRestart}
      stillNeeded={stillNeeded}
    />,
  );
  return onRestart;
}

describe("RestartGame", () => {
  it("shows what a restart would be worth before it's offered", () => {
    renderPanel("Tame 3 more creatures to be able to restart.");
    expect(screen.getByText(/worth ×1 right now/)).toBeVisible();
    expect(screen.getByText("×1.6")).toBeVisible();
    expect(
      screen.getByText("Tame 3 more creatures to be able to restart."),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /restart the glade/i }),
    ).not.toBeInTheDocument();
  });

  it("builds on restarts already made, in either game", () => {
    recordRestart("meadowmere", 40);
    recordRestart("glade", 20);
    renderPanel(null);
    expect(screen.getByText(/worth ×1.6 right now/)).toBeVisible();
    expect(screen.getByText(/Restarted once so far/)).toBeVisible();
    expect(screen.getByText("×2.2")).toBeVisible();
  });

  it("restarts only once the player confirms", async () => {
    const onRestart = renderPanel(null);
    await userEvent.click(
      screen.getByRole("button", { name: "Restart the glade…" }),
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleDescription(
      /Everything starts over\. Your points multiplier goes from ×1 to ×1\.6/,
    );

    await userEvent.click(screen.getByRole("button", { name: "Not yet" }));
    expect(onRestart).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Restart the glade…" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Restart the glade" }),
    );
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("counts several restarts", () => {
    recordRestart("glade", 10);
    recordRestart("glade", 10);
    renderPanel(null);
    expect(screen.getByText(/Restarted 2 times so far/)).toBeVisible();
  });
});
