"use client";

import { styled } from "next-yak";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { NeighbourDialog } from "@/components/meadowmere/NeighbourDialog";
import { StallDialog } from "@/components/meadowmere/StallDialog";
import { ValeHUD } from "@/components/meadowmere/ValeHUD";
import { ValeScene } from "@/components/meadowmere/ValeScene";
import { QUERIES } from "@/lib/constants";
import { getTodayDateString } from "@/lib/date";
import {
  CROPS,
  ITEMS,
  NEIGHBOURS,
  QUESTS,
  SITES,
} from "@/lib/meadowmere/catalog";
import type { Notice } from "@/lib/meadowmere/context";
import { useMeadowmere } from "@/lib/meadowmere/context";
import type { Interaction } from "@/lib/meadowmere/interaction";
import { interactionFor } from "@/lib/meadowmere/interaction";
import type { Facing, FarmerPose } from "@/lib/meadowmere/movement";
import {
  facingTowards,
  routeToFeature,
  stepFarmer,
  tileInFront,
} from "@/lib/meadowmere/movement";
import type { CropId, NeighbourId } from "@/lib/meadowmere/schema";
import type { Feature, Tile } from "@/lib/meadowmere/valeMap";
import { FARMER_START, featureAt, VALE_WIDTH } from "@/lib/meadowmere/valeMap";

/**
 * The playable world: a farmer you walk around the Vale, and the one action
 * key that works on whatever is in front of them.
 *
 * Every loop from the first Meadowmere is still here — sowing, watering,
 * harvesting, foraging, gifting, quests — but each one is now reached by
 * standing in front of the thing it belongs to rather than by opening a tab.
 */

/** Milliseconds per tile of an auto-walk. Brisk enough to cross the map fast. */
const STEP_MS = 90;

const KEY_FACING: Record<string, Facing> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

const ACTION_KEYS = new Set([" ", "Enter", "e", "E"]);

/** What just happened, phrased for the live region. */
function describeNotice(notice: Notice): string {
  switch (notice.kind) {
    case "harvest":
      return `Harvested ${notice.amount} × ${CROPS[notice.cropId].name}.`;
    case "forage":
      return `Foraged ${notice.amount} × ${ITEMS[notice.itemId].name} at ${SITES[notice.siteId].name}.`;
    case "gift": {
      const name = NEIGHBOURS[notice.neighbourId].name;
      const tier = notice.newTierName ? ` Now ${notice.newTierName}.` : "";
      return `${name} ${notice.liked ? "loved" : "accepted"} the ${ITEMS[notice.itemId].name}. +${notice.friendshipGained} friendship.${tier}`;
    }
    case "quest":
      return `Handed in ${QUESTS[notice.questId].title}.`;
  }
}

export function ValeWorld() {
  const { state, notice, plantSeed, waterPlot, harvestPlot, forage } =
    useMeadowmere();

  const [pose, setPose] = useState<FarmerPose>({
    ...FARMER_START,
    facing: "down",
  });
  /** Remaining tiles of an auto-walk. Purely how the farmer gets there. */
  const [walk, setWalk] = useState<{ path: Tile[]; facing: Facing } | null>(
    null,
  );
  const [selectedCropId, setSelectedCropId] = useState<CropId | null>(null);
  const [visiting, setVisiting] = useState<NeighbourId | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const today = getTodayDateString();
  const instructionsId = useId();

  // Below about 640px the map has to scroll sideways to keep its tiles big
  // enough to tap, so the view follows the farmer. Only the map's own
  // scrollLeft is touched — scrollIntoView would drag the whole page with it.
  useEffect(() => {
    const view = scrollRef.current;
    if (view === null) return;
    const tileWidth = view.scrollWidth / VALE_WIDTH;
    const centred = (pose.x + 0.5) * tileWidth - view.clientWidth / 2;
    view.scrollLeft = Math.max(
      0,
      Math.min(centred, view.scrollWidth - view.clientWidth),
    );
  }, [pose.x]);

  // Results that flow through the game context get announced here; sowing and
  // watering produce no notice, so those are announced where they happen.
  useEffect(() => {
    if (notice !== null) setAnnouncement(describeNotice(notice));
  }, [notice]);

  const performInteraction = useCallback(
    (interaction: Interaction) => {
      const { action } = interaction;
      if (action === null) {
        setAnnouncement(interaction.label);
        return;
      }
      switch (action.type) {
        case "plant":
          plantSeed(action.plotId, action.cropId);
          setAnnouncement(`Sowed ${CROPS[action.cropId].name}.`);
          break;
        case "water":
          waterPlot(action.plotId);
          setAnnouncement("Watered.");
          break;
        case "harvest":
          harvestPlot(action.plotId);
          break;
        case "forage":
          forage(action.siteId);
          break;
        case "visit":
          setVisiting(action.neighbourId);
          break;
        case "shop":
          setShopOpen(true);
          break;
      }
    },
    [plantSeed, waterPlot, harvestPlot, forage],
  );

  /**
   * Clicking or tabbing to a feature walks the farmer over and uses it. The
   * action is resolved straight away and the walk is only shown afterwards —
   * so an interrupted walk can never swallow what the player asked for, and
   * reduced-motion users take exactly the same code path.
   */
  const activateFeature = useCallback(
    (feature: Feature, interaction: Interaction) => {
      const route = routeToFeature(state, pose, feature);
      performInteraction(interaction);
      if (route === null) return;

      const arrival = route.path.at(-1) ?? pose;
      const reduced =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced || route.path.length === 0) {
        setPose({ ...arrival, facing: route.facing });
        setWalk(null);
        return;
      }
      setWalk(route);
    },
    [state, pose, performInteraction],
  );

  // Plays back an auto-walk a tile at a time. Game state is already settled by
  // the time this runs, so cancelling it mid-stride loses nothing.
  useEffect(() => {
    if (walk === null) return;
    if (walk.path.length === 0) {
      setPose((prev) => ({ ...prev, facing: walk.facing }));
      setWalk(null);
      return;
    }
    const timer = setTimeout(() => {
      const [next, ...rest] = walk.path;
      setPose((prev) => ({ ...next, facing: facingTowards(prev, next) }));
      setWalk({ path: rest, facing: walk.facing });
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [walk]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const facing = KEY_FACING[event.key];
      if (facing !== undefined) {
        event.preventDefault();
        setWalk(null); // Taking the reins cancels any walk in progress.
        setPose((prev) => stepFarmer(state, prev, facing));
        return;
      }
      if (!ACTION_KEYS.has(event.key)) return;
      // Enter and Space belong to a focused hotspot; only the world's own
      // action keys are handled here.
      if (event.key !== "e" && event.key !== "E") {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
      }
      const ahead = tileInFront(pose);
      const feature = featureAt(state, ahead.x, ahead.y);
      if (feature === null) {
        setAnnouncement("Nothing here.");
        return;
      }
      performInteraction(interactionFor(state, feature, selectedCropId, today));
    },
    [state, pose, selectedCropId, today, performInteraction],
  );

  const aheadFeature = (() => {
    const ahead = tileInFront(pose);
    return featureAt(state, ahead.x, ahead.y);
  })();
  const prompt =
    aheadFeature === null
      ? null
      : interactionFor(state, aheadFeature, selectedCropId, today);

  return (
    <Layout>
      <ValeHUD
        onSelectCrop={setSelectedCropId}
        selectedCropId={selectedCropId}
      />

      <Instructions id={instructionsId}>
        Walk with the arrow keys or W, A, S and D. Press E to use whatever the
        farmer is facing. You can also click, or tab to, any place on the map to
        walk there and use it.
      </Instructions>

      {/*
        role="application" is deliberate: it asks screen readers to pass arrow
        and action keys through to the game rather than using them to browse.
        Every feature also carries a real button, so nothing here depends on it.
      */}
      <Stage
        aria-describedby={instructionsId}
        aria-label="The Vale — Meadowmere's map"
        onKeyDown={handleKeyDown}
        ref={scrollRef}
        role="application"
        tabIndex={0}
      >
        <Track>
          <ValeScene
            onActivateFeature={activateFeature}
            pose={pose}
            selectedCropId={selectedCropId}
            state={state}
            today={today}
            walking={walk !== null}
          />
        </Track>
      </Stage>

      <Prompt aria-hidden={prompt === null}>
        {prompt === null ? "Walk up to something to use it." : prompt.label}
      </Prompt>

      <LiveRegion aria-atomic="true" aria-live="polite">
        {announcement}
      </LiveRegion>

      <NeighbourDialog
        neighbourId={visiting}
        onClose={() => setVisiting(null)}
      />
      <StallDialog onClose={() => setShopOpen(false)} open={shopOpen} />
    </Layout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Layout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Stage = styled.div`
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  border: 3px solid light-dark(var(--color-grey-300), var(--color-grey-700));
  background: light-dark(#93c26d, #46653f);

  &:focus-visible {
    outline: 3px solid var(--color-primary-400);
    outline-offset: 3px;
  }
`;

/**
 * A floor under the map's width: 16 tiles at 40px. Narrower than this and a
 * tile — which is also its button — drops below the 24px minimum tap target,
 * so on a phone the map scrolls sideways rather than shrinking.
 */
const Track = styled.div`
  min-width: 640px;
`;

const Instructions = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));

  @media ${QUERIES.PHABLET_UP} {
    font-size: 0.95rem;
  }
`;

const Prompt = styled.p`
  margin: 0;
  min-height: 1.5rem;
  font-weight: 700;
  text-align: center;
  color: light-dark(var(--color-orange-700), var(--color-orange-400));
`;

const LiveRegion = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
