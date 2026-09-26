import { type RefObject, useCallback, useEffect, useRef } from "react";
import type { Resident } from "@/lib/glade/schema";
import {
  createWalker,
  isWalking,
  type SceneSize,
  stepWalker,
  type Walker,
} from "./wander";

/**
 * A frame longer than this (a background tab, a debugger pause) is treated as
 * this long, so a resident never jumps across the glade in a single frame.
 */
const MAX_FRAME_SECONDS = 0.1;

/**
 * Walks the residents around the scene. Each one idles, heads off somewhere
 * nearby, and idles again, at its species' own pace (see WANDER_TRAITS).
 *
 * This runs outside React: a frame loop writes each resident's position
 * straight onto its spot element, so sixty moves a second cost no renders.
 * Each spot carries `data-walking` while its resident is on the move (the
 * scene swaps the idle loop for a walking gait on it) and a `--facing`
 * property of 1 or -1 for which way it is heading.
 *
 * Residents named in `heldIds` stand still wherever they are: whoever is
 * being pointed at, focused, read about or is landing from a tame. A button
 * that walks away from the cursor is one that can't be pressed.
 *
 * Nothing moves under reduced motion; every resident stays at its home spot.
 */
export function useWander(
  residents: Resident[],
  sceneRef: RefObject<HTMLElement | null>,
  heldIds: string[],
) {
  const spots = useRef(new Map<string, HTMLElement>());
  const walkers = useRef(new Map<string, Walker>());
  const residentsRef = useRef(residents);
  const heldRef = useRef(new Set(heldIds));

  useEffect(() => {
    residentsRef.current = residents;
    heldRef.current = new Set(heldIds);
  });

  useEffect(() => {
    const scene = sceneRef.current;
    if (scene === null) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let last: number | null = null;

    const tick = (now: number) => {
      const dt =
        last === null ? 0 : Math.min((now - last) / 1000, MAX_FRAME_SECONDS);
      last = now;
      const size = { width: scene.clientWidth, height: scene.clientHeight };
      // No layout yet: jsdom always, and a real browser for its first frame.
      if (size.width > 0 && size.height > 0) {
        advance(
          residentsRef.current,
          spots.current,
          walkers.current,
          heldRef.current,
          dt,
          size,
        );
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduced.matches || frame !== 0) return;
      last = null;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const spot of spots.current.values()) spot.dataset.walking = "false";
    };
    const onChange = () => (reduced.matches ? stop() : start());

    start();
    reduced.addEventListener("change", onChange);
    return () => {
      reduced.removeEventListener("change", onChange);
      stop();
    };
  }, [sceneRef]);

  /** Ref callback for a resident's spot element. */
  return useCallback(
    (residentId: string) => (element: HTMLElement | null) => {
      // A walker outlives its element: the curried callback is new on every
      // render, so React detaches and reattaches it each time, and dropping
      // the walker here would send the resident back home on every click.
      if (element === null) spots.current.delete(residentId);
      else spots.current.set(residentId, element);
    },
    [],
  );
}

/** Moves every resident on by one frame and puts it where it now is. */
function advance(
  residents: Resident[],
  spots: Map<string, HTMLElement>,
  walkers: Map<string, Walker>,
  held: Set<string>,
  dt: number,
  size: SceneSize,
) {
  // Forget residents who have left the glade (a reset).
  for (const id of walkers.keys()) {
    if (!spots.has(id)) walkers.delete(id);
  }
  for (const resident of residents) {
    const spot = spots.get(resident.id);
    if (spot === undefined) continue;
    const isHeld = held.has(resident.id);
    const walker =
      walkers.get(resident.id) ??
      createWalker(resident.speciesId, resident.position, Math.random);
    const next = isHeld
      ? walker
      : stepWalker(walker, resident.speciesId, dt, size, Math.random);
    walkers.set(resident.id, next);
    place(spot, next, !isHeld && isWalking(next));
  }
}

/** Puts a spot where its walker is, in the pose it is in. */
function place(spot: HTMLElement, walker: Walker, walking: boolean) {
  spot.style.transform = `translate(${walker.x}%, ${walker.y}%)`;
  const walkingValue = String(walking);
  if (spot.dataset.walking !== walkingValue)
    spot.dataset.walking = walkingValue;
  spot.style.setProperty("--facing", String(walker.facing));
}
