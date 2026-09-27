"use client";

import { useId } from "react";
import type { BackgroundId } from "@/lib/bonsai/schema";
import { AutumnForestScene } from "./AutumnForestScene";
import { GardenScene } from "./GardenScene";
import { MistyMountainScene } from "./MistyMountainScene";
import { NightGardenScene } from "./NightGardenScene";
import { ZenGardenScene } from "./ZenGardenScene";

interface GardenBackgroundProps {
  backgroundId: BackgroundId;
}

// ── Ambience ──────────────────────────────────────────────────────────────────
//
// Each scene is a little world with things going on in it: butterflies about
// the flower beds, koi under the lily pads, cranes crossing the peaks, an owl
// that blinks. What moves is still deliberately slow and small: this garden
// belongs to people who arrive tired, and a scene that jitters costs them
// attention it is supposed to be giving back.
//
// Everything animates a transform or an opacity (see Scenery), with no
// filters, and the cost is bounded rather than assumed away: no scene runs
// more than about thirty animated groups, and the trees in front hold their
// own layers (see `MiniTreeContainer`), so a background repaint never
// re-rasters them.
//
// The scenes are painted at 2:1 and sliced to fill the box, so a wide garden
// trims sky and ground. The garden stops growing taller at 640px, so a very
// wide screen trims a lot: anything that should always be seen sits between
// y≈50 and y≈150, and the rest is a bonus for narrower screens.

export function GardenBackground({ backgroundId }: GardenBackgroundProps) {
  // Several scenes can share a page (the shop's previews, the tend view over
  // the garden), so every gradient and clip is named per instance.
  const uid = `bg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
      viewBox="0 0 400 200"
    >
      {backgroundId === "garden" && <GardenScene uid={uid} />}
      {backgroundId === "zen-garden" && <ZenGardenScene uid={uid} />}
      {backgroundId === "misty-mountain" && <MistyMountainScene uid={uid} />}
      {backgroundId === "night-garden" && <NightGardenScene uid={uid} />}
      {backgroundId === "autumn-forest" && <AutumnForestScene uid={uid} />}
    </svg>
  );
}
