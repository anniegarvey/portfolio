import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { GLADE_SOUND_MUTED_KEY, setGladeSoundMuted } from "@/lib/glade/sounds";
import { SoundToggle } from "./SoundToggle";

beforeEach(() => {
  setGladeSoundMuted(false);
});

describe("SoundToggle", () => {
  it("mutes and unmutes the creature sounds", async () => {
    const user = userEvent.setup();
    render(<SoundToggle />);

    await user.click(
      screen.getByRole("button", { name: "Mute creature sounds" }),
    );
    expect(localStorage.getItem(GLADE_SOUND_MUTED_KEY)).toBe("true");

    await user.click(
      screen.getByRole("button", { name: "Unmute creature sounds" }),
    );
    expect(localStorage.getItem(GLADE_SOUND_MUTED_KEY)).toBe("false");
    expect(
      screen.getByRole("button", { name: "Mute creature sounds" }),
    ).toBeInTheDocument();
  });
});
