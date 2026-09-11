"use client";

import { keyframes, styled } from "next-yak";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ConfettiBurst } from "@/components/happy-birthday-james/ConfettiBurst";
import {
  getHappyBirthdayRiffMs,
  playDialClick,
  playHappyBirthdayRiff,
} from "@/components/happy-birthday-james/sounds";

const TARGET = 33;
const SPIN_MS = 1500;
const STEP_MS = Math.round(SPIN_MS / TARGET);
const SETTLE_MS = 420;
const TICKS = Array.from({ length: TARGET }, (_, i) => i);

// A damped-oscillator curve sampled into points, so the needle overshoots
// past its target and settles back rather than easing to a clean stop —
// spring physics via a plain CSS transition, no animation library needed.
// Reserved for the final tick only: at 45ms per intermediate step there's no
// time to perceive an overshoot, so every step but the last uses a quick,
// plain ease instead.
const SPRING_EASE =
  "linear(0, 0.349, 0.715, 0.994, 1.153, 1.202, 1.177, 1.117, 1.053, 1.003, 0.974, 0.965, 0.969, 0.979, 0.99, 0.999, 1.004, 1.006, 1.006, 1.004, 1.002, 1, 0.999, 0.999, 0.999, 0.999, 1)";
const STEP_EASE = "cubic-bezier(0.3, 0, 0.2, 1)";

/**
 * The birthday card's centrepiece: an engineering-dial button that "revs up"
 * to 33 on tap, then celebrates. The needle's rotation is driven directly by
 * `count`, one short transition per tick, so it visibly points at whichever
 * tick just lit rather than spinning independently of the readout — the
 * final tick swaps in a longer spring transition so completion still gets a
 * satisfying overshoot-and-settle.
 */
export function CalibrationDial({
  muted,
  onCelebrate,
}: {
  muted: boolean;
  onCelebrate?: () => void;
}) {
  const [count, setCount] = useState(0);
  const [turns, setTurns] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [justCelebrated, setJustCelebrated] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // A ref, not `isAnimating` state, gates re-entry: state updates land on the
  // next render, so a second click arriving before then would otherwise slip
  // past the guard and start a second interval that clobbers this one's ref.
  const isRunningRef = useRef(false);
  const dialRef = useRef<HTMLButtonElement>(null);
  const glowRafRef = useRef<number | null>(null);
  // How many times the riff has actually played — drives which line of the
  // song plays next. A ref because it only needs to be read inside `finish`
  // (never rendered), and must be exact the instant a completion happens,
  // not delayed a render behind like state would be.
  const sectionRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (glowRafRef.current !== null) cancelAnimationFrame(glowRafRef.current);
    };
  }, []);

  const startGlow = useCallback(
    (analyser: AnalyserNode, durationMs: number) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const start = performance.now();

      const tick = (now: number) => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const level = sum / data.length / 255;
        dialRef.current?.style.setProperty(
          "--glow-pct",
          `${Math.round(level * 100)}%`,
        );

        if (now - start < durationMs) {
          glowRafRef.current = requestAnimationFrame(tick);
        } else {
          dialRef.current?.style.setProperty("--glow-pct", "0%");
          glowRafRef.current = null;
        }
      };
      glowRafRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  const finish = useCallback(() => {
    setCount(TARGET);
    setIsAnimating(false);
    setHasCelebrated(true);
    setJustCelebrated(true);
    isRunningRef.current = false;
    setBurstId((id) => id + 1);
    if (!muted) {
      const section = sectionRef.current;
      sectionRef.current += 1;
      const analyser = playHappyBirthdayRiff(section);
      if (analyser) startGlow(analyser, getHappyBirthdayRiffMs(section));
    }
    onCelebrate?.();
  }, [muted, onCelebrate, startGlow]);

  const handleTurn = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsAnimating(true);
    setTurns((t) => t + 1);
    setCount(0);
    if (!muted) playDialClick();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    let current = 0;
    intervalRef.current = setInterval(() => {
      current += 1;
      if (current >= TARGET) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        finish();
        return;
      }
      setCount(current);
    }, STEP_MS);
  }, [finish, muted]);

  // The needle's rotation is derived from `count`, not tracked separately —
  // it's what makes it visibly point at whichever tick just lit. Each prior
  // completed sweep banks a full 360° so a replay continues turning forward
  // instead of snapping back to 0.
  const priorLaps = Math.max(turns - 1, 0);
  const rotationDeg = priorLaps * 360 + (360 / TARGET) * count;
  const isSettling = count >= TARGET;

  return (
    <Wrapper>
      <DialButton
        aria-label={
          hasCelebrated
            ? "James, fully calibrated to Mark 33. Tap to celebrate again."
            : "Tap to calibrate James to Mark 33"
        }
        data-shudder={justCelebrated || undefined}
        disabled={isAnimating}
        onAnimationEnd={() => setJustCelebrated(false)}
        onClick={handleTurn}
        ref={dialRef}
        style={
          {
            "--rotation": `${rotationDeg}deg`,
            "--needle-duration": isSettling ? `${SETTLE_MS}ms` : `${STEP_MS}ms`,
            "--needle-ease": isSettling ? SPRING_EASE : STEP_EASE,
          } as CSSProperties
        }
        type="button"
      >
        <TickRing aria-hidden="true">
          {TICKS.map((i) => (
            <Tick
              data-lit={i < count || undefined}
              key={i}
              style={
                { "--tick-angle": `${(360 / TARGET) * i}deg` } as CSSProperties
              }
            />
          ))}
        </TickRing>
        <Needle aria-hidden="true" />
        <Readout aria-hidden="true">
          <Count>{count}</Count>
          <CountLabel>/ {TARGET}</CountLabel>
        </Readout>
      </DialButton>
      <Instruction aria-live="polite">
        {hasCelebrated
          ? "James, Mark 33 — fully calibrated."
          : "Tap the dial to calibrate James to Mark 33"}
      </Instruction>
      <ConfettiBurst triggerCount={burstId} />
    </Wrapper>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const shudder = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  20% { transform: translate(-2px, 1px) rotate(-1deg); }
  40% { transform: translate(2px, -1px) rotate(1deg); }
  60% { transform: translate(-1px, 1px) rotate(-0.5deg); }
  80% { transform: translate(1px, -1px) rotate(0.5deg); }
`;

const DialButton = styled.button`
  --size: clamp(150px, 38vw, 210px);

  position: relative;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  border: 3px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  background: light-dark(var(--color-grey-50), var(--color-grey-900));
  box-shadow: var(--elevation-sm);
  transition: opacity 200ms ease;

  &:disabled {
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.92;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 3px;
  }

  &[data-shudder] {
    animation: ${shudder} 350ms ease-in-out;
  }

  /*
   * A glow ring driven by --glow-pct, which CalibrationDial updates every
   * frame from the riff's live amplitude (a Web Audio AnalyserNode) while it
   * plays — the dial visibly breathes with the melody rather than pulsing
   * on a fixed, audio-independent timer.
   */
  &::after {
    content: "";
    position: absolute;
    inset: -8px;
    border-radius: 50%;
    pointer-events: none;
    box-shadow: 0 0 26px 4px
      color-mix(in oklch, var(--color-primary-400) var(--glow-pct, 0%), transparent);
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-shudder] {
      animation: none;
    }

    &::after {
      display: none;
    }
  }
`;

const TickRing = styled.div`
  position: absolute;
  inset: 0;
`;

const Tick = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2.5px;
  height: 11%;
  background: light-dark(var(--color-grey-400), var(--color-grey-500));
  border-radius: 2px;
  transform: translate(-50%, -50%) rotate(var(--tick-angle))
    translateY(calc(-1 * (var(--size) / 2 - 5px)));
  transition: background-color 200ms ease, box-shadow 200ms ease;

  &[data-lit] {
    background: var(--color-orange-400);
    box-shadow: 0 0 4px var(--color-orange-400);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Needle = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 5px;
  height: 38%;
  background: linear-gradient(
    to top,
    var(--color-rose-600),
    var(--color-orange-400)
  );
  border-radius: 3px;
  transform-origin: bottom center;
  transform: translate(-50%, -100%) rotate(var(--rotation));
  transition: transform var(--needle-duration) var(--needle-ease);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Readout = styled.span`
  position: absolute;
  inset: 22%;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: light-dark(white, var(--color-grey-800));
  box-shadow: var(--elevation-xs);
`;

const Count = styled.span`
  font-size: clamp(1.8rem, 6vw, 2.4rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: light-dark(var(--color-primary-700), var(--color-primary-300));
`;

const CountLabel = styled.span`
  font-size: 0.75rem;
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  margin-top: 2px;
`;

const Instruction = styled.p`
  font-size: 0.95rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
  text-align: center;
  margin: 0;
  min-height: 1.4em;
`;
