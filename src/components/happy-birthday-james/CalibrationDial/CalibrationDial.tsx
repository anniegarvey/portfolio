"use client";

import { styled } from "next-yak";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ConfettiBurst } from "@/components/happy-birthday-james/ConfettiBurst";
import {
  playDialClick,
  playHappyBirthdayRiff,
} from "@/components/happy-birthday-james/sounds";

const TARGET = 33;
const SPIN_MS = 1500;
const LOOPS_PER_TURN = 3;

/**
 * The birthday card's centrepiece: an engineering-dial button that "revs up"
 * to 33 on tap, then celebrates. The needle's rotation is a single CSS
 * transition (not driven per tick), so it spins smoothly to a stop while the
 * numeric readout counts up independently on its own interval — the two
 * don't need to be frame-synced to read as one motion.
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
  const [burstId, setBurstId] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // A ref, not `isAnimating` state, gates re-entry: state updates land on the
  // next render, so a second click arriving before then would otherwise slip
  // past the guard and start a second interval that clobbers this one's ref.
  const isRunningRef = useRef(false);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const finish = useCallback(() => {
    setCount(TARGET);
    setIsAnimating(false);
    setHasCelebrated(true);
    isRunningRef.current = false;
    setBurstId((id) => id + 1);
    if (!muted) playHappyBirthdayRiff();
    onCelebrate?.();
  }, [muted, onCelebrate]);

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
    const stepMs = SPIN_MS / TARGET;
    intervalRef.current = setInterval(() => {
      current += 1;
      if (current >= TARGET) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        finish();
        return;
      }
      setCount(current);
    }, stepMs);
  }, [finish, muted]);

  return (
    <Wrapper>
      <DialButton
        aria-label={
          hasCelebrated
            ? "James, fully calibrated to Mark 33. Tap to celebrate again."
            : "Tap to calibrate James to Mark 33"
        }
        disabled={isAnimating}
        onClick={handleTurn}
        style={
          {
            "--rotation": `${turns * LOOPS_PER_TURN * 360}deg`,
          } as CSSProperties
        }
        type="button"
      >
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

const DialButton = styled.button`
  --size: clamp(150px, 38vw, 210px);
  --tick-color: light-dark(var(--color-grey-400), var(--color-grey-500));

  position: relative;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  border: 3px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  padding: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  background:
    repeating-conic-gradient(
      var(--tick-color) 0deg 3deg,
      transparent 3deg calc(360deg / ${TARGET})
    ),
    light-dark(var(--color-grey-50), var(--color-grey-900));
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
  transition: transform ${SPIN_MS}ms cubic-bezier(0.22, 0.98, 0.32, 1);

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
