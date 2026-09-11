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
// Cumulative tick count after each of the 4 clicks in one cycle (8, 9, 8, 8
// ticks per quarter) — uneven only because 33 doesn't divide by 4 evenly.
const QUARTER_TARGETS = [8, 17, 25, 33];
const SPIN_MS = 1100;
const STEP_MS = Math.round(SPIN_MS / 9);
const SETTLE_MS = 420;
const TICKS = Array.from({ length: TARGET }, (_, i) => i);

// A damped-oscillator curve sampled into points, so the needle overshoots
// past its target and settles back rather than easing to a clean stop —
// spring physics via a plain CSS transition, no animation library needed.
// Reserved for the last tick of each click only: at ~165ms per intermediate
// step there's no time to perceive an overshoot, so every other step uses a
// quick, plain ease instead.
const SPRING_EASE =
  "linear(0, 0.349, 0.715, 0.994, 1.153, 1.202, 1.177, 1.117, 1.053, 1.003, 0.974, 0.965, 0.969, 0.979, 0.99, 0.999, 1.004, 1.006, 1.006, 1.004, 1.002, 1, 0.999, 0.999, 0.999, 0.999, 1)";
const STEP_EASE = "cubic-bezier(0.3, 0, 0.2, 1)";

/**
 * The birthday card's centrepiece: an engineering-dial button that fills a
 * quarter of its 33 ticks per tap, taking 4 taps (one per line of "Happy
 * Birthday to You") to fully calibrate — then celebrates with confetti and a
 * shockwave, and the cycle can be replayed. `totalFilled` is a single,
 * monotonically increasing count across every tap ever made (never reset),
 * which is what lets the needle keep turning forward through replays: both
 * the needle's angle and the current cycle's display count are derived from
 * it rather than tracked separately, so they can never drift out of sync.
 */
export function CalibrationDial({
  muted,
  onCelebrate,
}: {
  muted: boolean;
  onCelebrate?: () => void;
}) {
  const [totalFilled, setTotalFilled] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [justCelebrated, setJustCelebrated] = useState(false);
  const [finalCelebration, setFinalCelebration] = useState(false);
  const [burstId, setBurstId] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // A ref, not `isAnimating` state, gates re-entry: state updates land on the
  // next render, so a second click arriving before then would otherwise slip
  // past the guard and start a second interval that clobbers this one's ref.
  const isRunningRef = useRef(false);
  const dialRef = useRef<HTMLButtonElement>(null);
  const glowRafRef = useRef<number | null>(null);
  // Which tap (0-indexed) is about to happen. Taken mod 4, it selects both
  // the quarter of the dial to fill next and which line of the song plays,
  // so the two always correspond regardless of whether sound is muted.
  const clickIndexRef = useRef(0);

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

  const finish = useCallback(
    (endTotal: number, isFinal: boolean, quarterIndex: number) => {
      setTotalFilled(endTotal);
      setIsAnimating(false);
      setIsSettling(true);
      setJustCelebrated(true);
      isRunningRef.current = false;

      if (isFinal) {
        setBurstId((id) => id + 1);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setFinalCelebration(true);
        }
      }

      if (!muted) {
        const analyser = playHappyBirthdayRiff(quarterIndex);
        if (analyser) startGlow(analyser, getHappyBirthdayRiffMs(quarterIndex));
      }

      if (isFinal) onCelebrate?.();
    },
    [muted, onCelebrate, startGlow],
  );

  const handleTurn = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const clickIndex = clickIndexRef.current;
    clickIndexRef.current += 1;
    const quarterIndex = clickIndex % 4;
    const cycle = Math.floor(clickIndex / 4);
    const startTotal =
      cycle * TARGET +
      (quarterIndex === 0 ? 0 : QUARTER_TARGETS[quarterIndex - 1]);
    const endTotal = cycle * TARGET + QUARTER_TARGETS[quarterIndex];
    const isFinal = quarterIndex === 3;

    setIsAnimating(true);
    setIsSettling(false);
    setTotalFilled(startTotal);
    if (!muted) playDialClick();

    const settle = () => finish(endTotal, isFinal, quarterIndex);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      settle();
      return;
    }

    let current = startTotal;
    intervalRef.current = setInterval(() => {
      current += 1;
      if (current >= endTotal) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        settle();
        return;
      }
      setTotalFilled(current);
    }, STEP_MS);
  }, [finish, muted]);

  // The current cycle's display count: totalFilled wraps every TARGET ticks,
  // but an exact multiple should read as "33" (fully lit), not reset to 0.
  const displayCount = totalFilled === 0 ? 0 : ((totalFilled - 1) % TARGET) + 1;
  const rotationDeg = (360 / TARGET) * totalFilled;
  const isFullyLit = displayCount >= TARGET;

  return (
    <Wrapper>
      <DialButton
        aria-label={
          isFullyLit
            ? "James, fully calibrated to Mark 33. Tap to celebrate again."
            : displayCount > 0
              ? `James calibrated to ${displayCount} of ${TARGET}. Tap to continue.`
              : "Tap to calibrate James to Mark 33"
        }
        data-shudder={
          justCelebrated ? (finalCelebration ? "final" : "quarter") : undefined
        }
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
              data-lit={i < displayCount || undefined}
              key={i}
              style={
                { "--tick-angle": `${(360 / TARGET) * i}deg` } as CSSProperties
              }
            />
          ))}
        </TickRing>
        {finalCelebration && (
          <>
            <ShockwaveRing
              aria-hidden="true"
              style={{ "--ring-delay": "0ms" } as CSSProperties}
            />
            <ShockwaveRing
              aria-hidden="true"
              style={{ "--ring-delay": "130ms" } as CSSProperties}
            />
            <ShockwaveRing
              aria-hidden="true"
              onAnimationEnd={() => setFinalCelebration(false)}
              style={{ "--ring-delay": "260ms" } as CSSProperties}
            />
          </>
        )}
        <Needle aria-hidden="true" />
        <Readout aria-hidden="true">
          <Count>{displayCount}</Count>
          <CountLabel>/ {TARGET}</CountLabel>
        </Readout>
      </DialButton>
      <Instruction aria-live="polite">
        {isFullyLit
          ? "James, Mark 33 — fully calibrated."
          : displayCount > 0
            ? `Calibrated to ${displayCount} of ${TARGET} — tap to continue.`
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

// A bigger, bouncier pulse reserved for completing the whole dial (not each
// quarter) — the shudder above reads as a mechanical catch; this reads as
// the dial itself celebrating.
const finalPulse = keyframes`
  0% { transform: scale(1); }
  30% { transform: scale(1.09); }
  55% { transform: scale(0.97); }
  78% { transform: scale(1.03); }
  100% { transform: scale(1); }
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

  &[data-shudder="quarter"] {
    animation: ${shudder} 350ms ease-in-out;
  }

  &[data-shudder="final"] {
    animation: ${finalPulse} 650ms ease-out;
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
    &[data-shudder="quarter"],
    &[data-shudder="final"] {
      animation: none;
    }

    &::after {
      display: none;
    }
  }
`;

const shockwave = keyframes`
  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; }
`;

// A ring expanding out from the dial, three staggered copies, only on
// completing the whole dial — the confetti fires the same moment, but this
// is the flourish that's felt right at the dial itself.
const ShockwaveRing = styled.span`
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  border: 3px solid var(--color-orange-400);
  pointer-events: none;
  animation: ${shockwave} 900ms ease-out both;
  animation-delay: var(--ring-delay, 0ms);

  @media (prefers-reduced-motion: reduce) {
    display: none;
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
  color: light-dark(var(--color-secondary-700), var(--color-secondary-300));
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
