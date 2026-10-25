"use client";

import { MicVocal } from "lucide-react";
import { keyframes, styled } from "next-yak";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { PetalShower } from "@/components/happy-birthday-mum/PetalShower";
import {
  lineDurationMs,
  noteOffsetsMs,
  playSongLine,
  SONG_LINES,
} from "@/components/happy-birthday-mum/sounds";

const FLOWERS = [
  { petal: "var(--color-rose-400)", heart: "var(--color-orange-300)" },
  { petal: "var(--color-primary-400)", heart: "var(--color-orange-200)" },
  { petal: "var(--color-orange-300)", heart: "var(--color-rose-500)" },
  { petal: "var(--color-rose-300)", heart: "var(--color-primary-500)" },
];
const STEM_HEIGHTS = [64, 86, 74, 92];
const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

/**
 * The card's centrepiece: a row of four flower buds and a "sing" button.
 * Each press sings the next line of "Happy Birthday" on a clarinet voice,
 * lights the lyrics up karaoke-style as they play, and coaxes the next bud
 * into bloom. The fourth line brings the whole garden out at once and
 * showers petals and notes; pressing again starts a fresh verse.
 *
 * `linesSung` only ever counts up, and everything else (which line, how
 * many flowers are open) is derived from it, so a replay can't leave the
 * flowers and the lyrics out of step.
 */
export function SingAlongGarden({ onCelebrate }: { onCelebrate?: () => void }) {
  const [linesSung, setLinesSung] = useState(0);
  const [isSinging, setIsSinging] = useState(false);
  const [showerId, setShowerId] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const lineIndex = (linesSung - 1) % SONG_LINES.length;
  const bloomed = linesSung === 0 ? 0 : lineIndex + 1;
  const verseDone = bloomed === SONG_LINES.length;

  function handleSing() {
    if (isSinging) return;
    const next = linesSung + 1;
    const line = SONG_LINES[(next - 1) % SONG_LINES.length];
    const isFinal = next % SONG_LINES.length === 0;

    setLinesSung(next);
    setIsSinging(true);
    playSongLine(line);

    timeoutRef.current = setTimeout(() => {
      setIsSinging(false);
      if (isFinal) {
        setShowerId((id) => id + 1);
        onCelebrate?.();
      }
    }, lineDurationMs(line));
  }

  return (
    <Wrapper>
      <Garden aria-hidden="true" data-celebrating={verseDone || undefined}>
        {FLOWERS.map((colors, i) => (
          <Flower
            data-open={i < bloomed || undefined}
            key={colors.petal}
            style={
              {
                "--petal": colors.petal,
                "--heart": colors.heart,
                "--sway-delay": `${i * -0.7}s`,
              } as CSSProperties
            }
          >
            <svg
              aria-hidden="true"
              height={STEM_HEIGHTS[i] + 52}
              viewBox={`-30 -30 60 ${STEM_HEIGHTS[i] + 52}`}
              width="64"
            >
              <Stem
                d={`M0 0 C 4 ${STEM_HEIGHTS[i] / 2}, -4 ${STEM_HEIGHTS[i] / 2}, 0 ${STEM_HEIGHTS[i] + 22}`}
              />
              <Leaf
                d="M0 0 C 8 -10, 20 -8, 22 -2 C 14 4, 6 4, 0 0Z"
                transform={`translate(0 ${STEM_HEIGHTS[i] * 0.6})`}
              />
              <Leaf
                d="M0 0 C -8 -10, -20 -8, -22 -2 C -14 4, -6 4, 0 0Z"
                transform={`translate(0 ${STEM_HEIGHTS[i] * 0.8})`}
              />
              <Bloom>
                {PETAL_ANGLES.map((angle, p) => (
                  <g key={angle} transform={`rotate(${angle})`}>
                    <Petal
                      cx="0"
                      cy="-13"
                      rx="8"
                      ry="13"
                      style={
                        { "--petal-delay": `${p * 50}ms` } as CSSProperties
                      }
                    />
                  </g>
                ))}
                <Heart r="7" />
              </Bloom>
            </svg>
          </Flower>
        ))}
      </Garden>

      <Lyrics>
        {linesSung === 0 ? (
          <LyricHint>Sing along with me</LyricHint>
        ) : (
          <LyricLine key={linesSung}>
            {SONG_LINES[lineIndex].map((note, n) => {
              if (!note.lyric) return null;
              const offset = noteOffsetsMs(SONG_LINES[lineIndex])[n];
              return (
                <Syllable
                  data-joined={note.lyric.endsWith("-") || undefined}
                  key={offset}
                  style={{ "--at": `${offset}ms` } as CSSProperties}
                >
                  {note.lyric}
                </Syllable>
              );
            })}
          </LyricLine>
        )}
      </Lyrics>

      <SingButton disabled={isSinging} onClick={handleSing} type="button">
        <MicVocal aria-hidden="true" size={20} />
        {linesSung === 0
          ? "Sing the first line"
          : verseDone
            ? "Sing it again"
            : "Sing the next line"}
      </SingButton>

      <Status aria-live="polite">
        {verseDone
          ? "The whole garden is in bloom!"
          : linesSung > 0
            ? `${bloomed} of ${SONG_LINES.length} flowers in bloom`
            : "Every line you sing makes a flower bloom"}
      </Status>

      <PetalShower triggerCount={showerId} />
    </Wrapper>
  );
}

// ─── Animations ─────────────────────────────────────────────────────────────

const sway = keyframes`
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
`;

const dance = keyframes`
  0%, 100% { transform: rotate(-7deg) translateY(0); }
  50% { transform: rotate(7deg) translateY(-6px); }
`;

const lightUp = keyframes`
  0% {
    color: inherit;
    transform: translateY(0) scale(1);
  }
  40% {
    color: var(--lit);
    transform: translateY(-6px) scale(1.15);
  }
  100% {
    color: var(--lit);
    transform: translateY(0) scale(1);
  }
`;

// ─── Styles ─────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const Garden = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: clamp(0.25rem, 3vw, 1.25rem);
  padding-bottom: 0.25rem;
  border-bottom: 3px solid
    light-dark(var(--color-secondary-300), var(--color-secondary-700));
  min-width: min(100%, 320px);
`;

const Flower = styled.div`
  transform-origin: bottom center;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${sway} 3.2s ease-in-out var(--sway-delay) infinite;

    ${Garden}[data-celebrating] & {
      animation: ${dance} 0.9s ease-in-out var(--sway-delay) infinite;
    }
  }

  & svg {
    display: block;
    overflow: visible;
  }
`;

const Stem = styled.path`
  fill: none;
  stroke: light-dark(var(--color-secondary-600), var(--color-secondary-500));
  stroke-width: 3;
  stroke-linecap: round;
`;

const Leaf = styled.path`
  fill: light-dark(var(--color-secondary-400), var(--color-secondary-600));
`;

const Bloom = styled.g`
  transform-box: fill-box;
  transform-origin: center;
`;

const Petal = styled.ellipse`
  fill: var(--petal);
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transform: scale(0.3, 0.45);
  opacity: 0.85;
  transition: transform 900ms
    linear(0, 0.35, 0.72, 1, 1.15, 1.2, 1.17, 1.1, 1.03, 0.99, 0.97, 0.98, 1)
    var(--petal-delay), opacity 400ms ease var(--petal-delay);

  ${Flower}[data-open] & {
    transform: scale(1);
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Heart = styled.circle`
  fill: light-dark(var(--color-secondary-500), var(--color-secondary-400));
  transition: fill 400ms ease;

  ${Flower}[data-open] & {
    fill: var(--heart);
  }
`;

const Lyrics = styled.div`
  min-height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LyricHint = styled.p`
  font-family: var(--font-tangerine), cursive;
  font-size: 2rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  margin: 0;
`;

const LyricLine = styled.p`
  --lit: light-dark(var(--color-rose-600), var(--color-rose-300));

  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  row-gap: 0.15rem;
  font-size: clamp(1.2rem, 4.5vw, 1.5rem);
  font-weight: 600;
  color: light-dark(var(--color-grey-400), var(--color-grey-500));
  margin: 0;
`;

// A hyphenated syllable runs straight into the next; a word's last
// syllable gets the space before the next word.
const Syllable = styled.span`
  display: inline-block;

  &:not([data-joined]):not(:last-child) {
    margin-right: 0.45rem;
  }

  animation: ${lightUp} 450ms ease-out var(--at) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    color: var(--lit);
  }
`;

const SingButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 999px;
  font: inherit;
  font-weight: 700;
  color: white;
  background: linear-gradient(
    135deg,
    var(--color-rose-500),
    var(--color-primary-500)
  );
  box-shadow: var(--elevation-sm);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: transform 150ms ease, opacity 200ms ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Status = styled.p`
  font-size: 0.95rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
  text-align: center;
  margin: 0;
`;
