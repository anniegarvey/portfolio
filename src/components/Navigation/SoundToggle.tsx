"use client";

import { Volume2, VolumeX } from "lucide-react";
import { setSoundMuted, useSoundMuted } from "@/lib/sound";
import { NavIconButton } from "./NavIconButton";

/** Turns every sound on the site on and off for this browser. */
export function SoundToggle() {
  const muted = useSoundMuted();
  const label = muted ? "Unmute sounds" : "Mute sounds";

  return (
    <NavIconButton
      aria-label={label}
      onClick={() => setSoundMuted(!muted)}
      title={label}
      type="button"
    >
      {muted ? (
        <VolumeX aria-hidden="true" size={20} />
      ) : (
        <Volume2 aria-hidden="true" size={20} />
      )}
    </NavIconButton>
  );
}
