"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/Button";
import { setGladeSoundMuted, useGladeSoundMuted } from "@/lib/glade/sounds";

/** Turns the creatures' calls on and off for this browser. */
export function SoundToggle() {
  const muted = useGladeSoundMuted();
  const label = muted ? "Unmute creature sounds" : "Mute creature sounds";

  return (
    <Button
      aria-label={label}
      onClick={() => setGladeSoundMuted(!muted)}
      size="icon"
      title={label}
      variant="ghost"
    >
      {muted ? (
        <VolumeX aria-hidden="true" size={20} />
      ) : (
        <Volume2 aria-hidden="true" size={20} />
      )}
    </Button>
  );
}
