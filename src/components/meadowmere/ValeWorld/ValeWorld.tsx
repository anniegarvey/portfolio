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
  /** What the keyboard has tabbed to, which overrides what the farmer faces. */
  const [focused, setFocused] = useState<Interaction | null>(null);
  /**
   * A live region only fires when its text actually changes, so watering two
   * plots in a row would announce once. The tick gives each result its own
   * identity; the region is keyed on it and remounts.
   */
  const [announcement, setAnnouncement] = useState({ text: "", tick: 0 });
  const announce = useCallback((text: string) => {
    setAnnouncement((prev) => ({ text, tick: prev.tick + 1 }));
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Read inside activateFeature so a walk — which changes the pose every 90ms
  // — doesn't hand all nineteen hotspots a new callback on every step.
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const today = getTodayDateString();
  const instructionsId = useId();

  // Below about 640px the map has to scroll sideways to keep its tiles big
  // enough to tap, so the view follows the farmer. Only the map's own
  // scrollLeft is touched — scrollIntoView would drag the whole page with it.
  useEffect(() => {
    const view = scrollRef.current;
    if (view === null) return;
    const centreOnFarmer = () => {
      const tileWidth = view.scrollWidth / VALE_WIDTH;
      const centred = (pose.x + 0.5) * tileWidth - view.clientWidth / 2;
      view.scrollLeft = Math.max(
        0,
        Math.min(centred, view.scrollWidth - view.clientWidth),
      );
    };
    centreOnFarmer();
    // Rotating a phone changes how much of the map fits, which would otherwise
    // leave the farmer off to one side until their next step.
    window.addEventListener("resize", centreOnFarmer);
    return () => window.removeEventListener("resize", centreOnFarmer);
  }, [pose.x]);

  // Results that flow through the game context get announced here; sowing and
  // watering produce no notice, so those are announced where they happen.
  useEffect(() => {
    if (notice !== null) announce(describeNotice(notice));
  }, [notice, announce]);

  const performInteraction = useCallback(
    (interaction: Interaction) => {
      const { action } = interaction;
      if (action === null) {
        announce(interaction.label);
        return;
      }
      switch (action.type) {
        case "plant":
          plantSeed(action.plotId, action.cropId);
          announce(`Sowed ${CROPS[action.cropId].name}.`);
          break;
        case "water":
          waterPlot(action.plotId);
          announce("Watered.");
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
    [plantSeed, waterPlot, harvestPlot, forage, announce],
  );

  /**
   * Clicking or tabbing to a feature walks the farmer over and uses it. The
   * action is resolved straight away and the walk is only shown afterwards —
   * so an interrupted walk can never swallow what the player asked for, and
   * reduced-motion users take exactly the same code path.
   */
  const activateFeature = useCallback(
    (feature: Feature) => {
      const from = poseRef.current;
      const route = routeToFeature(state, from, feature);
      // Re-derived here rather than taken from the scene, so the world stays
      // the only authority on what activating something actually does.
      performInteraction(interactionFor(state, feature, selectedCropId, today));
      if (route === null) return;

      const arrival = route.path.at(-1) ?? from;
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
    [state, selectedCropId, today, performInteraction],
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
      // Movement is fine to repeat; acting is not. Holding E on a forage site
      // would otherwise spend every trip left in under a second.
      if (event.repeat) return;
      // Enter and Space belong to a focused hotspot; only the world's own
      // action keys are handled here.
      if (event.key !== "e" && event.key !== "E") {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
      }
      const ahead = tileInFront(pose);
      const feature = featureAt(state, ahead.x, ahead.y);
      if (feature === null) {
        announce("Nothing here.");
        return;
      }
      performInteraction(interactionFor(state, feature, selectedCropId, today));
    },
    [state, pose, selectedCropId, today, performInteraction, announce],
  );

  const aheadFeature = (() => {
    const ahead = tileInFront(pose);
    return featureAt(state, ahead.x, ahead.y);
  })();
  const facing =
    aheadFeature === null
      ? null
      : interactionFor(state, aheadFeature, selectedCropId, today);
  const prompt = focused ?? facing;

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
            onFocusFeature={setFocused}
            pose={pose}
            selectedCropId={selectedCropId}
            state={state}
            today={today}
            walking={walk !== null}
          />
        </Track>
      </Stage>

      {/* Announced as well as shown: walking up to something is how you find
          out what it offers, so a screen reader has to hear it too. */}
      <Prompt aria-live="polite">
        {prompt === null ? "Walk up to something to use it." : prompt.label}
      </Prompt>

      <LiveRegion aria-atomic="true" aria-live="polite" key={announcement.tick}>
        {announcement.text}
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
