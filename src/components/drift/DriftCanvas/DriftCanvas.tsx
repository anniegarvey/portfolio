"use client";

import { styled } from "next-yak";
import {
  type PointerEvent,
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { QUERIES } from "@/lib/constants";
import {
  clearFluid,
  createFluid,
  type Fluid,
  gridSize,
  paint,
  step,
} from "@/lib/drift/fluid";
import {
  brushRadius,
  type DriftSettings,
  getPalette,
  hexToRgb,
  toStepOptions,
} from "@/lib/drift/settings";
import {
  bloom,
  COLOR_PERIOD,
  colorAt,
  drift,
  stirWithPointer,
} from "@/lib/drift/stir";

export type DriftCanvasHandle = {
  /** Empties the water. */
  clear: () => void;
  /** Drops a soft bloom of colour somewhere, for anyone not using a pointer. */
  bloom: () => void;
};

const colorsOf = (settings: DriftSettings) =>
  getPalette(settings.palette).colors.map(hexToRgb);
const periodOf = (settings: DriftSettings) =>
  getPalette(settings.palette).cycleSeconds ?? COLOR_PERIOD;
const now = () => performance.now() / 1000;

/** Grid cells along the canvas's longer side; phones get fewer. */
const DETAIL = { phone: 96, desktop: 144 };
/** A longer frame (a background tab, a debugger pause) counts as this long. */
const MAX_FRAME_SECONDS = 1 / 30;

type Props = {
  settings: DriftSettings;
  /** Reduced motion: everything slows right down and the currents stop. */
  calm: boolean;
  ref?: Ref<DriftCanvasHandle>;
};

/**
 * The water itself. The fluid runs on a small grid, one canvas pixel per
 * cell, and CSS stretches the canvas to fill its box; the browser's smooth
 * upscaling is what softens the dye into watercolour.
 *
 * The frame loop runs outside React and reads the latest settings from a ref,
 * so dragging a slider never restarts the simulation.
 */
export function DriftCanvas({ settings, calm, ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fluidRef = useRef<Fluid | null>(null);
  const settingsRef = useRef(settings);
  const calmRef = useRef(calm);
  const pointerRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  useEffect(() => {
    settingsRef.current = settings;
    calmRef.current = calm;
  });

  useImperativeHandle(ref, () => ({
    clear: () => {
      if (fluidRef.current) clearFluid(fluidRef.current);
    },
    bloom: () => {
      if (!fluidRef.current) return;
      bloom(
        fluidRef.current,
        colorAt(
          colorsOf(settingsRef.current),
          now(),
          periodOf(settingsRef.current),
        ),
        brushRadius(settingsRef.current),
      );
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!(canvas && context)) return;
    let image: ImageData | null = null;
    let frame = 0;
    let last: number | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const long = rect.width < 640 ? DETAIL.phone : DETAIL.desktop;
      const size = gridSize(rect.width, rect.height, long);
      const current = fluidRef.current;
      if (current?.width === size.width && current.height === size.height) {
        return;
      }
      const fluid = createFluid(size.width, size.height);
      fluidRef.current = fluid;
      canvas.width = size.width;
      canvas.height = size.height;
      image = context.createImageData(size.width, size.height);
      // Start with a few blooms, so there is something to look at (and, under
      // reduced motion, a calm picture) before anyone touches it.
      const colors = colorsOf(settingsRef.current);
      for (const color of colors) {
        bloom(fluid, color, brushRadius(settingsRef.current));
      }
    };

    const tick = (time: number) => {
      const seconds = time / 1000;
      const dt =
        last === null ? 0 : Math.min(seconds - last, MAX_FRAME_SECONDS);
      last = seconds;
      const fluid = fluidRef.current;
      if (fluid && image) {
        const current = settingsRef.current;
        if (current.drift && !calmRef.current) {
          drift(
            fluid,
            seconds,
            dt,
            colorsOf(current),
            brushRadius(current),
            periodOf(current),
          );
        }
        step(fluid, toStepOptions(current, dt, calmRef.current));
        paint(fluid, image.data, getPalette(current.palette).vivid);
        context.putImageData(image, 0, 0);
      }
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frame !== 0) return;
      last = null;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    start();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // Mount-only: the loop reads everything else through refs.
  }, []);

  const position = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / Math.max(rect.width, 1),
      y: (event.clientY - rect.top) / Math.max(rect.height, 1),
      time: now(),
    };
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerRef.current = position(event);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const next = position(event);
    const previous = pointerRef.current;
    pointerRef.current = next;
    const fluid = fluidRef.current;
    // A mouse stirs just by passing over; a finger or pen once it's down.
    const touching = event.pointerType === "mouse" || event.buttons > 0;
    if (!(fluid && previous && touching)) return;
    stirWithPointer(
      fluid,
      {
        x: next.x,
        y: next.y,
        previousX: previous.x,
        previousY: previous.y,
        dt: next.time - previous.time,
      },
      colorAt(
        colorsOf(settingsRef.current),
        next.time,
        periodOf(settingsRef.current),
      ),
      brushRadius(settingsRef.current),
    );
  };

  const onPointerLeave = () => {
    pointerRef.current = null;
  };

  return (
    <Canvas
      aria-label="Water to stir with your pointer or finger"
      onPointerDown={onPointerDown}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerLeave}
      ref={canvasRef}
      role="img"
      style={
        {
          "--water-light": getPalette(settings.palette).water.light,
          "--water-dark": getPalette(settings.palette).water.dark,
        } as React.CSSProperties
      }
    />
  );
}

const Canvas = styled.canvas`
  display: block;
  width: 100%;
  height: min(62svh, 520px);
  border-radius: 16px;
  background: light-dark(var(--water-light), var(--water-dark));
  box-shadow: inset 0 0 0 1px light-dark(rgb(0 0 0 / 0.06), rgb(255 255 255 / 0.06));
  /* The canvas is the brush: no scrolling or zooming while stirring. */
  touch-action: none;
  cursor: crosshair;
  transition: background-color 0.6s ease;

  @media (${QUERIES.DESKTOP_UP}) {
    height: min(72svh, 640px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
