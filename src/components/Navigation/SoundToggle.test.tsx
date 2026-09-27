import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { SOUND_MUTED_KEY, setSoundMuted } from "@/lib/sound";
import { SoundToggle } from "./SoundToggle";

beforeEach(() => {
  setSoundMuted(false);
});

describe("SoundToggle", () => {
  it("mutes and unmutes every sound on the site", async () => {
    const user = userEvent.setup();
    render(<SoundToggle />);

    await user.click(screen.getByRole("button", { name: "Mute sounds" }));
    expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe("true");

    await user.click(screen.getByRole("button", { name: "Unmute sounds" }));
    expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe("false");
    expect(
      screen.getByRole("button", { name: "Mute sounds" }),
    ).toBeInTheDocument();
  });
});
