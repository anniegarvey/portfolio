"use client";

import { Coins } from "lucide-react";
import { styled } from "next-yak";
import { useEffect, useRef } from "react";
import { usePoints } from "@/lib/points/context";

export function PointsDisplay() {
  const { points } = usePoints();
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
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: light-dark(var(--color-orange-700), #f59e0b);
  font-weight: 700;
  font-size: 0.9rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid light-dark(oklch(55.3% 0.195 38.402 / 0.4), #f59e0b66);
  background: light-dark(oklch(55.3% 0.195 38.402 / 0.08), #f59e0b0f);
  user-select: none;
  line-height: 1;
`;

const Count = styled.span`
  font-variant-numeric: tabular-nums;
  min-width: 2ch;
`;
