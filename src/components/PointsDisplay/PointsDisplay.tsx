"use client";

import { Coins } from "lucide-react";
import { styled } from "next-yak";
import { useEffect, useRef } from "react";
import { usePoints } from "@/lib/points/context";
import { formatMultiplier, usePointsMultiplier } from "@/lib/points/prestige";

export function PointsDisplay() {
  const { points } = usePoints();
  const multiplier = usePointsMultiplier();
  const prevRef = useRef(points);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (points !== prevRef.current && wrapperRef.current) {
      wrapperRef.current.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.45)" },
          { transform: "scale(0.92)" },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "ease-out" },
      );
    }
    prevRef.current = points;
  }, [points]);

  return (
    <Wrapper data-points-display ref={wrapperRef}>
      <Coins size={15} />
      <Count>{points}</Count>
      {multiplier > 1 && (
        <Multiplier title="Every point you earn is multiplied by your restarts">
          {formatMultiplier(multiplier)}
        </Multiplier>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-points);
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid color-mix(in oklch, var(--color-points) 40%, transparent);
  background: color-mix(in oklch, var(--color-points) 6%, transparent);
  user-select: none;
  line-height: 1;
`;

const Count = styled.span`
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
`;

const Multiplier = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.85;
`;
