"use client";

import { keyframes, styled } from "next-yak";
import { useEffect, useImperativeHandle, useRef, useState } from "react";

export interface WaterSprinklesHandle {
  /** Begin spawning droplets at (x, y), local to the overlay's container. */
  start: (x: number, y: number) => void;
  /** Update the spawn point while the pointer is still held down. */
  move: (x: number, y: number) => void;
  /** Stop spawning. Already-falling droplets finish their own animation. */
  stop: () => void;
}

interface Droplet {
  id: number;
  x: number;
  y: number;
  drift: number;
}

const SPAWN_INTERVAL_MS = 90;
const MAX_CONCURRENT_DROPLETS = 20;

/**
 * Small water-drop particles that fall from a pointer position while held.
 * Owns its droplet state entirely within itself — driven imperatively via
 * `ref` rather than props — so a rapid stream of spawns during a long press
 * only re-renders this overlay, never the sibling tree SVG it sits over.
 */
export function WaterSprinkles({
  ref,
}: {
  ref?: React.Ref<WaterSprinklesHandle>;
}) {
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const posRef = useRef<{ x: number; y: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextId = useRef(0);

  useImperativeHandle(ref, () => {
    const spawn = () => {
      const pos = posRef.current;
      if (!pos) return;
      setDroplets((prev) =>
        prev.length >= MAX_CONCURRENT_DROPLETS
          ? prev
          : [
              ...prev,
              {
                id: nextId.current++,
                x: pos.x,
                y: pos.y,
                drift: Math.random() * 14 - 7,
              },
            ],
      );
    };
    const stop = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      posRef.current = null;
    };
    return {
      start: (x, y) => {
        if (
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          return;
        stop();
        posRef.current = { x, y };
        spawn();
        intervalRef.current = setInterval(spawn, SPAWN_INTERVAL_MS);
      },
      move: (x, y) => {
        posRef.current = { x, y };
      },
      stop,
    };
  }, []);

  // Belt-and-braces: clear any live interval if the overlay unmounts mid-press.
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  if (droplets.length === 0) return null;

  return (
    <SprinkleLayer aria-hidden="true">
      {droplets.map((d) => (
        <Droplet
          data-testid="water-droplet"
          key={d.id}
          onAnimationEnd={() =>
            setDroplets((prev) => prev.filter((other) => other.id !== d.id))
          }
          style={
            {
              "--drop-x": `${d.x}px`,
              "--drop-y": `${d.y}px`,
              "--drop-drift": `${d.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </SprinkleLayer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const fall = keyframes`
  0% { opacity: 0.85; transform: translate(var(--drop-x), var(--drop-y)) scale(0.7); }
  100% {
    opacity: 0;
    transform: translate(calc(var(--drop-x) + var(--drop-drift)), calc(var(--drop-y) + 34px)) scale(1);
  }
`;

const SprinkleLayer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

const Droplet = styled.span`
  position: absolute;
  left: 0;
  top: 0;
  width: 5px;
  height: 6px;
  border-radius: 50% 50% 50% 0;
  background: light-dark(#4a90d9, #6fb0f0);
  animation: ${fall} 600ms ease-in forwards;
`;
