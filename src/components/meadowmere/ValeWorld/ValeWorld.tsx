"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
import type { Facing, FarmerPose, Route } from "@/lib/meadowmere/movement";
import {
  facingTowards,
  findPath,
  routeToFeature,
  STEP_MS,
  stepFarmer,
  tileInFront,
} from "@/lib/meadowmere/movement";
import type { CropId, NeighbourId } from "@/lib/meadowmere/schema";
import type { Feature, Tile } from "@/lib/meadowmere/valeMap";
import {
  FARMER_START,
  featureAt,
  isWalkable,
  VALE_HEIGHT,
  VALE_WIDTH,
} from "@/lib/meadowmere/valeMap";

/**
 * The playable world: a farmer you walk around the Vale, and the one action
 * key that works on whatever is in front of them.
 *
 * Every loop from the first Meadowmere is still here — sowing, watering,
 * harvesting, foraging, gifting, quests — but each one is now reached by
 * standing in front of the thing it belongs to rather than by opening a tab.
 */

/**
 * How close to the edge of the visible map the farmer may get before the view
 * follows them. Below about 640px only part of the valley is on screen, and
 * without a margin the farmer stays pinned in the middle while the whole valley
 * is dragged sideways under them — which is what made walking on a phone read
 * as teleporting. Inside the margin the map holds still and the farmer is the
 * thing that moves.
 */
const EDGE_TILES = 2;

/**
 * How far a pointer may travel between going down and coming up and still count
 * as a tap on a tile. Swiping the map sideways is how a phone reaches the far
 * side of the valley, and a swipe must never be mistaken for "walk here".
 */
const TAP_SLOP_PX = 10;

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

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
  const [walk, setWalk] = useState<{
    path: Tile[];
    facing: Facing;
    /**
     * Where the walk is headed, or null when the player asked for a patch of
     * open ground. The prompt reads this rather than the tiles being crossed,
     * so it says what the player asked for instead of flickering through the
     * grass on the way. The feature rather than its interaction, so it is
     * re-read against state the action has already changed — the same reason
     * the scene hands back features.
     */
    feature: Feature | null;
  } | null>(null);
  const [selectedCropId, setSelectedCropId] = useState<CropId | null>(null);
  const [visiting, setVisiting] = useState<NeighbourId | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  /** The feature focus has landed on, which overrides what the farmer faces. */
  const [focused, setFocused] = useState<Feature | null>(null);
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
  /** The map itself, whose box turns a tap into a tile. */
  const trackRef = useRef<HTMLDivElement>(null);
  /** Where a pointer went down, so a swipe can be told from a tap. */
  const pointerStart = useRef<Tile | null>(null);
  // Read inside activateFeature so a walk — which changes the pose every 90ms
  // — doesn't hand all nineteen hotspots a new callback on every step.
  const poseRef = useRef(pose);
  poseRef.current = pose;
  const today = getTodayDateString();
  const instructionsId = useId();

  /**
   * Which way the map still has valley left to show. On a phone two thirds of
   * it is off screen, and a tile you can't see is a tile you can't tap — so
   * the edges have to say there is more.
   */
  const [more, setMore] = useState({ west: false, east: false });
  const syncEdges = useCallback(() => {
    const view = scrollRef.current;
    if (view === null) return;
    const furthest = view.scrollWidth - view.clientWidth;
    const west = view.scrollLeft > 1;
    const east = view.scrollLeft < furthest - 1;
    // A swipe fires this every frame while the answer changes twice a swipe at
    // most, so hand back the same object rather than re-rendering for nothing.
    setMore((prev) =>
      prev.west === west && prev.east === east ? prev : { west, east },
    );
  }, []);

  // Below about 640px the map has to scroll sideways to keep its tiles big
  // enough to tap, so the view follows the farmer — but only once they reach
  // the margin, so most steps move the farmer rather than the valley. Only the
  // map's own scrollLeft is touched, and the map eases it (see Stage), so a walk
  // along the edge pans instead of jumping. scrollIntoView would drag the whole
  // page with it.
  useEffect(() => {
    const view = scrollRef.current;
    if (view === null) return;
    const followFarmer = () => {
      // No layout yet — jsdom always, and a real browser for its first frame.
      if (view.clientWidth === 0) return;
      const tileWidth = view.scrollWidth / VALE_WIDTH;
      const margin = EDGE_TILES * tileWidth;
      const west = pose.x * tileWidth - margin;
      const east = (pose.x + 1) * tileWidth + margin;
      const furthest = view.scrollWidth - view.clientWidth;
      const wanted =
        west < view.scrollLeft
          ? west
          : Math.max(view.scrollLeft, east - view.clientWidth);
      view.scrollLeft = Math.max(0, Math.min(wanted, furthest));
      syncEdges();
    };
    followFarmer();
    // Rotating a phone changes how much of the map fits, which would otherwise
    // leave the farmer off to one side until their next step. Width only: a
    // phone fires resize when its URL bar slides away mid-scroll, and following
    // on that would yank the map back while the player is reading the far side
    // of the valley.
    let width = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      followFarmer();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pose.x, syncEdges]);

  // Results that flow through the game context get announced here; sowing and
  // watering produce no notice, so those are announced where they happen.
  useEffect(() => {
    if (notice !== null) announce(describeNotice(notice));
  }, [notice, announce]);

  const performInteraction = useCallback(
    (interaction: Interaction) => {
      const { action } = interaction;
      // Nothing to do here, and the refusal goes to the live region even though
      // the prompt is showing the same words. The prompt only speaks when its
      // text changes, so on the second try at the same plot — the natural thing
      // to do when the first seemed to do nothing — it would say nothing at all.
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
   * Sends the farmer along a route. Anyone who would rather not watch a walk —
   * and anyone already stood in the right place — is simply put at the far end.
   */
  const travel = useCallback((route: Route, feature: Feature | null) => {
    const arrival = route.path.at(-1) ?? poseRef.current;
    if (route.path.length === 0 || prefersReducedMotion()) {
      setPose({ ...arrival, facing: route.facing });
      setWalk(null);
      return;
    }
    setWalk({ ...route, feature });
  }, []);

  /**
   * Clicking or tabbing to a feature walks the farmer over and uses it. The
   * action is resolved straight away and the walk is only shown afterwards —
   * so an interrupted walk can never swallow what the player asked for, and
   * reduced-motion users take exactly the same code path.
   */
  const activateFeature = useCallback(
    (feature: Feature) => {
      const route = routeToFeature(state, poseRef.current, feature);
      // Re-derived here rather than taken from the scene, so the world stays
      // the only authority on what activating something actually does.
      performInteraction(interactionFor(state, feature, selectedCropId, today));
      if (route !== null) travel(route, feature);
    },
    [state, selectedCropId, today, performInteraction, travel],
  );

  /**
   * Walking to a patch of open ground, which is a thing a player wants to do in
   * its own right: on a phone there is no arrow key, so without this the only
   * way to move is to send the farmer at one of the nineteen features and every
   * journey is a jump between them.
   */
  const walkToTile = useCallback(
    (tile: Tile) => {
      if (!isWalkable(state, tile.x, tile.y)) return;
      const from = poseRef.current;
      const path = findPath(state, from, tile);
      if (path === null || path.length === 0) return;
      // A hotspot keeps focus while the farmer walks away from it, so let go of
      // it for the same reason steering by hand does.
      setFocused(null);
      const penultimate = path.at(-2) ?? from;
      travel({ path, facing: facingTowards(penultimate, tile) }, null);
    },
    [state, travel],
  );

  /** Which tile a pointer at these coordinates is over, or null if off the map. */
  const tileUnderPointer = useCallback((clientX: number, clientY: number) => {
    const box = trackRef.current?.getBoundingClientRect();
    if (box === undefined || box.width === 0 || box.height === 0) return null;
    const tile = {
      x: Math.floor(((clientX - box.left) / box.width) * VALE_WIDTH),
      y: Math.floor(((clientY - box.top) / box.height) * VALE_HEIGHT),
    };
    return tile;
  }, []);

  const handleMapClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Every feature carries its own button, which handles its own taps.
      if ((event.target as Element).closest("button") !== null) return;
      const start = pointerStart.current;
      const travelled =
        start === null
          ? 0
          : Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (travelled > TAP_SLOP_PX) return;
      const tile = tileUnderPointer(event.clientX, event.clientY);
      if (tile !== null) walkToTile(tile);
    },
    [tileUnderPointer, walkToTile],
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
      setWalk({ ...walk, path: rest });
    }, STEP_MS);
    return () => clearTimeout(timer);
  }, [walk]);

  /** The action key, on whatever the farmer is stood looking at. */
  const actOnWhatIsAhead = useCallback(() => {
    const ahead = tileInFront(pose);
    const feature = featureAt(state, ahead.x, ahead.y);
    if (feature === null) {
      announce("Nothing here.");
      return;
    }
    performInteraction(interactionFor(state, feature, selectedCropId, today));
  }, [state, pose, selectedCropId, today, performInteraction, announce]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const facing = KEY_FACING[event.key];
      if (facing !== undefined) {
        event.preventDefault();
        setWalk(null); // Taking the reins cancels any walk in progress.
        // A hotspot keeps focus while the farmer walks away from it, and the
        // prompt would go on describing a tile the action key no longer
        // reaches. Steering by hand puts the prompt back on what is ahead.
        setFocused(null);
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
      actOnWhatIsAhead();
    },
    [state, actOnWhatIsAhead],
  );

  const aheadFeature = (() => {
    const ahead = tileInFront(pose);
    return featureAt(state, ahead.x, ahead.y);
  })();
  const promptFor = (feature: Feature | null) =>
    feature === null
      ? null
      : interactionFor(state, feature, selectedCropId, today);
  // Focus wins over what the farmer faces; a walk in progress wins over the
  // tiles being crossed to get there — including a walk to open ground, which
  // has no destination to name and so says nothing rather than reading out
  // every plot the farmer passes. All of them read current state, so they never
  // disagree about the same tile.
  const prompt =
    promptFor(focused) ??
    (walk === null ? promptFor(aheadFeature) : promptFor(walk.feature));

  return (
    <Layout>
      <ValeHUD
        onSelectCrop={setSelectedCropId}
        selectedCropId={selectedCropId}
      />

      <Instructions id={instructionsId}>
        Tap or click any place on the map to walk there and use it. Swipe the
        map sideways — the valley is wider than the screen. With a keyboard:
        arrow keys or W, A, S and D to walk, E to use whatever the farmer faces.
      </Instructions>

      {/* The prompt is laid over the map rather than left under it: on a phone
          the map is taller than the space above the fold, so a line below it
          would never be on screen at the moment the player needed it. */}
      <Frame>
        {/*
          role="application" is deliberate: it asks screen readers to pass arrow
          and action keys through to the game rather than using them to browse.
          Every feature also carries a real button, so nothing here depends on
          it.
        */}
        <Stage
          aria-describedby={instructionsId}
          aria-label="The Vale — Meadowmere's map"
          onClick={handleMapClick}
          onKeyDown={handleKeyDown}
          onPointerDown={(event) => {
            pointerStart.current = { x: event.clientX, y: event.clientY };
          }}
          onScroll={syncEdges}
          ref={scrollRef}
          role="application"
          tabIndex={0}
        >
          <Track ref={trackRef}>
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

        {/* Decoration for a scroll the player performs on the map itself, so
            these stay out of the tab order and out of the pointer's way. */}
        {more.west && (
          <WestEdge aria-hidden>
            <ChevronLeft size={22} />
          </WestEdge>
        )}
        {more.east && (
          <EastEdge aria-hidden>
            <ChevronRight size={22} />
          </EastEdge>
        )}

        {/* Announced as well as shown: walking up to something is how you find
            out what it offers, so a screen reader has to hear it too. */}
        <PromptLayer>
          <Prompt role="status">
            {prompt === null ? "Walk up to something to use it." : prompt.label}
            {/* Inside the same pill rather than beside it, so the whole remark
                is one thing to read and one thing to announce. */}
            {prompt?.detail !== undefined && <Detail>{prompt.detail}</Detail>}
          </Prompt>
        </PromptLayer>
      </Frame>

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

/** Anchors everything laid over the map: the prompt and the two scroll cues. */
const Frame = styled.div`
  position: relative;
`;

const Stage = styled.div`
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  /* Applies to the view following the farmer, not to the player's own swipe:
     a pan the map eases reads as a camera, an instant one as a cut. */
  scroll-behavior: smooth;

  @media (prefers-reduced-motion: reduce) {
    scroll-behavior: auto;
  }
  border: 3px solid light-dark(var(--color-grey-300), var(--color-grey-700));
  background: light-dark(#93c26d, #46653f);

  &:focus-visible {
    outline: 3px solid var(--color-primary-400);
    outline-offset: 3px;
  }
`;

/**
 * Where the map runs on past the edge of the screen. Inset by the frame's
 * border so the cue sits on the valley rather than on top of the border.
 */
const Edge = styled.div`
  position: absolute;
  top: 3px;
  bottom: 3px;
  width: 2rem;
  display: flex;
  align-items: center;
  pointer-events: none;
  color: light-dark(var(--color-grey-900), #fff);
`;

const WestEdge = styled(Edge)`
  left: 3px;
  justify-content: flex-start;
  border-top-left-radius: 9px;
  border-bottom-left-radius: 9px;
  background: linear-gradient(
    to right,
    light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.55)),
    transparent
  );
`;

const EastEdge = styled(Edge)`
  right: 3px;
  justify-content: flex-end;
  border-top-right-radius: 9px;
  border-bottom-right-radius: 9px;
  background: linear-gradient(
    to left,
    light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.55)),
    transparent
  );
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

/**
 * Holds the prompt over the map, inside its border, without taking any height
 * from it. Absolute rather than in flow so the map keeps its 4:3 shape, and
 * full height so the sticky prompt inside has the whole map to travel over.
 */
const PromptLayer = styled.div`
  position: absolute;
  inset: 3px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  pointer-events: none;
`;

/**
 * A pill at the foot of the map. Sticky rather than simply pinned there: the
 * map is often taller than the window — a phone held sideways, a laptop, the
 * whole map at desktop width — and a prompt at the bottom of the map would
 * then be off screen exactly when the player needed to read it. Sized to its
 * text so what it floats over is a strip of grass rather than a row of plots.
 */
const Prompt = styled.p`
  position: sticky;
  bottom: 0.5rem;
  max-width: calc(100% - 1rem);
  margin: 0 0 0.5rem;
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  background: light-dark(rgb(255 255 255 / 0.92), rgb(23 23 23 / 0.92));
  color: light-dark(var(--color-orange-700), var(--color-orange-400));
  box-shadow: 0 1px 6px rgb(0 0 0 / 0.25);

  @media ${QUERIES.PHABLET_UP} {
    font-size: 0.95rem;
  }
`;

/**
 * The line under the prompt that teaches rather than instructs — what a wild
 * place yields, how a shut one opens. Quieter than the instruction above it, and
 * deliberately not part of the feature button's name: that name is recited on
 * every pass over nineteen tiles, and this is worth hearing once.
 */
const Detail = styled.span`
  display: block;
  font-weight: 400;
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));

  @media ${QUERIES.PHABLET_UP} {
    font-size: 0.85rem;
  }
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
