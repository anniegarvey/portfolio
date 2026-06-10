"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { getTodayDateString } from "@/lib/date";
import { LAST_ACTIVE_DATE_KEY, POINTS_STORAGE_KEY } from "./keys";
import { playCollectSound, playDepositSound } from "./sounds";

const MAX_PARTICLE_COUNT = 50;
const BURST_DURATION_MS = 280;
const FLY_DURATION_MS = 680;
const BURST_RADIUS = 52;
/** Max total spread between first and last particle landing (at MAX_PARTICLE_COUNT) */
const MAX_STAGGER_MS = 2000;

interface ParticleData {
  id: string;
  originX: number;
  originY: number;
  burstDx: number;
  burstDy: number;
  /** Points this particle carries — increments the counter when it lands */
  amount: number;
  /** Ms after burst completes before this particle flies (stagger for larger rewards) */
  flyDelay: number;
}

// ─── Particle ─────────────────────────────────────────────────────────────────

function Particle({
  data,
  onComplete,
}: {
  data: ParticleData;
  onComplete: (id: string) => void;
}) {
  const [phase, setPhase] = useState<"initial" | "burst" | "fly">("initial");
  const [flyDx, setFlyDx] = useState(0);
  const [flyDy, setFlyDy] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Kick off burst on next frame so the initial→burst transition is visible
    const raf = requestAnimationFrame(() => setPhase("burst"));

    const flyTimer = setTimeout(() => {
      // Find whichever points display is currently visible
      const candidates = document.querySelectorAll("[data-points-display]");
      const display = Array.from(candidates).find(
        (el) => el.getBoundingClientRect().width > 0,
      );
      if (display) {
        const rect = display.getBoundingClientRect();
        setFlyDx(rect.left + rect.width / 2 - data.originX);
        setFlyDy(rect.top + rect.height / 2 - data.originY);
      }
      setPhase("fly");
    }, BURST_DURATION_MS + data.flyDelay);

    const doneTimer = setTimeout(
      () => {
        onCompleteRef.current(data.id);
      },
      BURST_DURATION_MS + data.flyDelay + FLY_DURATION_MS,
    );

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(flyTimer);
      clearTimeout(doneTimer);
    };
  }, [data.id, data.originX, data.originY, data.flyDelay]);

  let transform: string;
  let transition: string;
  let opacity: number;

  if (phase === "initial") {
    transform = "translate(-50%, -50%) scale(0)";
    transition = "none";
    opacity = 1;
  } else if (phase === "burst") {
    transform = `translate(calc(-50% + ${data.burstDx}px), calc(-50% + ${data.burstDy}px)) scale(1.1)`;
    transition = `transform ${BURST_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1)`;
    opacity = 1;
  } else {
    transform = `translate(calc(-50% + ${flyDx}px), calc(-50% + ${flyDy}px)) scale(0.4)`;
    transition = `transform ${FLY_DURATION_MS}ms cubic-bezier(0.6, 0, 0.4, 1), opacity ${FLY_DURATION_MS * 0.8}ms ${FLY_DURATION_MS * 0.2}ms ease-in`;
    opacity = 0;
  }

  return (
    <div
      style={{
        position: "fixed",
        left: data.originX,
        top: data.originY,
        width: 11,
        height: 11,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 35% 35%, #ffe066, var(--color-points))",
        boxShadow:
          "0 0 7px 2px color-mix(in oklch, var(--color-points) 55%, transparent)",
        transform,
        transition,
        opacity,
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform, opacity",
      }}
    />
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface PointsContextType {
  points: number;
  awardPoints: (amount: number, rect: DOMRect) => void;
  spendPoints: (amount: number) => boolean;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

let particleSeq = 0;

export function PointsProvider({ children }: { children: ReactNode }) {
  const [points, setPoints] = useState(0);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(POINTS_STORAGE_KEY);
    if (stored) {
      const n = parseInt(stored, 10);
      if (!Number.isNaN(n)) setPoints(n);
    }
  }, []);

  const handleParticleComplete = useCallback((id: string) => {
    setParticles((prev) => {
      const particle = prev.find((p) => p.id === id);
      if (particle && particle.amount > 0) {
        setPoints((pts) => {
          const next = pts + particle.amount;
          localStorage.setItem(POINTS_STORAGE_KEY, String(next));
          return next;
        });
        playDepositSound();
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const spendPoints = useCallback(
    (amount: number): boolean => {
      if (points < amount) return false;
      setPoints((pts) => {
        const next = pts - amount;
        localStorage.setItem(POINTS_STORAGE_KEY, String(next));
        return next;
      });
      return true;
    },
    [points],
  );

  const awardPoints = useCallback((amount: number, rect: DOMRect) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LAST_ACTIVE_DATE_KEY, getTodayDateString());
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Skip animation for users who prefer reduced motion — just add points
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setPoints((pts) => {
        const next = pts + amount;
        localStorage.setItem(POINTS_STORAGE_KEY, String(next));
        return next;
      });
      return;
    }

    playCollectSound();

    const particleCount = Math.min(amount, MAX_PARTICLE_COUNT);
    // Stagger window scales from 0 (1 particle) up to MAX_STAGGER_MS (MAX_PARTICLE_COUNT),
    // with ~50ms per particle so small rewards feel snappy and large ones feel full.
    const staggerWindow = Math.min((particleCount - 1) * 50, MAX_STAGGER_MS);

    const newParticles: ParticleData[] = Array.from(
      { length: particleCount },
      (_, i) => {
        const angle =
          (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        const radius = BURST_RADIUS * (0.55 + Math.random() * 0.6);
        // Each particle carries 1 point; the last carries any remainder
        const particleAmount =
          i === particleCount - 1 ? amount - (particleCount - 1) : 1;
        const flyDelay =
          particleCount > 1
            ? Math.round((i / (particleCount - 1)) * staggerWindow)
            : 0;
        return {
          id: `p-${++particleSeq}`,
          originX: x,
          originY: y,
          burstDx: Math.cos(angle) * radius,
          burstDy: Math.sin(angle) * radius,
          amount: particleAmount,
          flyDelay,
        };
      },
    );

    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  return (
    <PointsContext.Provider value={{ points, awardPoints, spendPoints }}>
      {children}
      {mounted && particles.length > 0
        ? createPortal(
            particles.map((p) => (
              <Particle
                data={p}
                key={p.id}
                onComplete={handleParticleComplete}
              />
            )),
            document.body,
          )
        : null}
    </PointsContext.Provider>
  );
}

// biome-ignore lint/style/useComponentExportOnlyModules: Standard pattern for Context + Hook
export function usePoints() {
  const ctx = use(PointsContext);
  if (ctx === undefined) {
    throw new Error("usePoints must be used within a PointsProvider");
  }
  return ctx;
}
