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
import { playCollectSound, playDepositSound } from "./sounds";

const POINTS_STORAGE_KEY = "energy-planner-points";
const PARTICLE_COUNT = 6;
const BURST_DURATION_MS = 280;
const FLY_DURATION_MS = 680;
const BURST_RADIUS = 52;

interface ParticleData {
  id: string;
  originX: number;
  originY: number;
  burstDx: number;
  burstDy: number;
  /** Only the lead particle (index 0) carries the amount to increment the counter */
  amount: number;
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
    }, BURST_DURATION_MS);

    const doneTimer = setTimeout(() => {
      onCompleteRef.current(data.id);
    }, BURST_DURATION_MS + FLY_DURATION_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(flyTimer);
      clearTimeout(doneTimer);
    };
  }, [data.id, data.originX, data.originY]);

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
        background: "radial-gradient(circle at 35% 35%, #ffe066, #f59e0b)",
        boxShadow: "0 0 7px 2px rgba(245, 158, 11, 0.55)",
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
  awardPoints: (amount: number, x: number, y: number) => void;
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

  const awardPoints = useCallback((amount: number, x: number, y: number) => {
    if (typeof window === "undefined") return;

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

    const newParticles: ParticleData[] = Array.from(
      { length: PARTICLE_COUNT },
      (_, i) => {
        const angle =
          (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
        const radius = BURST_RADIUS * (0.55 + Math.random() * 0.6);
        return {
          id: `p-${++particleSeq}`,
          originX: x,
          originY: y,
          burstDx: Math.cos(angle) * radius,
          burstDy: Math.sin(angle) * radius,
          amount: i === 0 ? amount : 0,
        };
      },
    );

    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  return (
    <PointsContext.Provider value={{ points, awardPoints }}>
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
