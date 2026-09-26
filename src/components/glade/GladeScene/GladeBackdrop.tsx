import { keyframes, styled } from "next-yak";
import { type CSSProperties, type ReactNode, useId } from "react";
import {
  Bob,
  Butterfly,
  Cloud,
  Daisy,
  FlapAcross,
  Glimmer,
  Lavender,
  ld,
  Ripple,
  Rock,
  Spin,
  Tulip,
  vars,
  Wander,
} from "@/components/Scenery";

// ─── Glade backdrop ───────────────────────────────────────────────────────────
//
// Nothing here reports state; it exists so the glade looks like somewhere a
// creature would want to live, with a little life of its own: a fairy door in
// a stump that lights up at dusk, bees about the hive, a frog on a lily pad,
// butterflies, and flowers nodding in the breeze.
//
// The glade is far wider than it is tall, and how much wider depends on the
// screen, so the land (sky, hills, meadow) is one SVG stretched to fit, which
// only ever smooth curves can survive. Everything with a shape of its own is
// a prop: its own small SVG at a fixed size, placed along the glade by
// percentage, so a toadstool stays round on any screen.
//
// Every loop is long, low-amplitude and offset from its neighbours, and all of
// it stops under reduced motion, where each piece holds the position it was
// authored at.

export function GladeBackdrop() {
  const skyId = useId();
  return (
    <Backdrop aria-hidden="true">
      <Land preserveAspectRatio="none" viewBox="0 0 240 60">
        <defs>
          <linearGradient id={skyId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" style={{ stopColor: ld("#b8e0e8", "#1c2434") }} />
            <stop offset="0.5" style={{ stopColor: "var(--glade-sky)" }} />
          </linearGradient>
        </defs>
        <rect fill={`url(#${skyId})`} height="60" width="240" />
        {/* Far hills, blue with distance */}
        <path
          d="M0 24 Q20 12 44 20 Q70 8 100 18 Q126 10 150 19 Q178 8 206 18 Q224 12 240 16 L240 60 L0 60 Z"
          style={{ fill: ld("#a8cbb4", "#2c3a40") }}
        />
        {/* Distant treeline */}
        <path
          d="M0 28 Q8 18 16 26 Q24 17 32 24 Q40 20 48 26 Q56 16 64 26 Q72 16 80 24 Q88 19 96 26 Q104 17 112 22 Q120 20 128 26 Q136 20 144 24 Q152 17 160 22 Q168 17 176 26 Q184 20 192 26 Q200 16 208 26 Q216 16 224 22 Q232 16 240 24 L240 60 L0 60 Z"
          fill="var(--glade-treeline)"
        />
        {/* Meadow */}
        <path
          d="M0 34 Q60 26 120 34 Q180 42 240 32 L240 60 L0 60 Z"
          fill="var(--glade-meadow-far)"
        />
        <path
          d="M0 44 Q60 36 120 44 Q180 50 240 42 L240 60 L0 60 Z"
          fill="var(--glade-meadow-near)"
        />
        {/* A worn path wandering through */}
        <path
          d="M0 50 Q30 46 60 50 Q90 55 120 49 Q150 44 180 50 Q210 55 240 49 L240 52 Q210 58 180 53 Q150 47 120 52 Q90 58 60 53 Q30 49 0 53 Z"
          style={{ fill: ld("rgba(200,180,130,0.45)", "rgba(90,80,60,0.4)") }}
        />
      </Land>

      {STARS.map((s) => (
        <Star
          key={`${s.left}-${s.top}`}
          style={{ left: `${s.left}%`, top: s.top }}
        />
      ))}

      <Prop left={9} top={96} width={96}>
        <SunOrMoon />
      </Prop>

      {CLOUDS.map((c) => (
        <Drifting
          key={c.top}
          style={
            {
              top: c.top,
              "--cloud-duration": `${c.duration}s`,
              "--cloud-delay": `${c.delay}s`,
              "--cloud-park": `${c.park}cqw`,
            } as CSSProperties
          }
        >
          <svg
            aria-hidden="true"
            overflow="visible"
            viewBox="-30 -20 60 26"
            width={c.width}
          >
            <Cloud
              scale={1}
              shade={ld("rgba(210,230,236,0.9)", "rgba(40,50,64,0.7)")}
              tint="var(--glade-cloud)"
              x={0}
              y={0}
            />
          </svg>
        </Drifting>
      ))}

      {TREES.map((t) => (
        <Prop key={t.left} left={t.left} top={t.top} width={t.width}>
          {t.kind === "oak" && <Oak tone={t.tone} />}
          {t.kind === "pine" && <Pine />}
          {t.kind === "birch" && <Birch />}
        </Prop>
      ))}

      <Prop left={6} top={238} width={96}>
        <HollowLog />
      </Prop>
      <Prop left={17} top={266} width={110}>
        <ToadstoolRing />
      </Prop>
      <Prop left={27} top={220} width={40}>
        <Signpost />
      </Prop>
      <Prop left={36} top={246} width={84}>
        <FairyStump />
      </Prop>
      <Prop left={63} top={232} width={54}>
        <Beehive />
      </Prop>
      <Prop left={79} top={272} width={210}>
        <Pond />
      </Prop>
      {ROCKS.map((r) => (
        <Prop key={r.left} left={r.left} top={r.top} width={r.width}>
          <Rocks />
        </Prop>
      ))}

      {TUFTS.map((t) => (
        <Prop key={`${t.left}-${t.top}`} left={t.left} top={t.top} width={26}>
          <Tuft />
        </Prop>
      ))}

      {FLOWER_CLUMPS.map((c, i) => (
        <Prop key={c.left} left={c.left} top={c.top} width={74}>
          <FlowerClump index={i} />
        </Prop>
      ))}

      {BUTTERFLIES.map((b) => (
        <Prop key={b.left} left={b.left} top={b.top} width={46}>
          <svg aria-hidden="true" overflow="visible" viewBox="-15 -15 30 30">
            <Butterfly
              offset={b.offset}
              path={b.path}
              period={b.period}
              spot={b.spot}
              wing={b.wing}
              x={0}
              y={0}
            />
          </svg>
        </Prop>
      ))}
    </Backdrop>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  /* Lets the clouds cross the whole glade in its own width (cqw). */
  container-type: inline-size;
  pointer-events: none;
`;

const Land = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
`;

/**
 * A piece of scenery at a fixed size. `left` is a percentage along the glade
 * and `top` is where its foot stands, in pixels from the top.
 */
function Prop({
  left,
  top,
  width,
  children,
}: {
  left: number;
  top: number;
  width: number;
  children: ReactNode;
}) {
  return (
    <PropBox style={{ left: `${left}%`, top: top, width: width }}>
      {children}
    </PropBox>
  );
}

const PropBox = styled.div`
  position: absolute;
  transform: translate(-50%, -100%);

  & > svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
`;

/** Stars come out at dusk; by day they are simply not there. */
const Star = styled.span`
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: light-dark(transparent, #f4f0dc);
  box-shadow: 0 0 3px light-dark(transparent, #f4f0dc);
`;

const STARS = [
  { left: 3, top: 20 },
  { left: 7, top: 52 },
  { left: 15, top: 14 },
  { left: 21, top: 40 },
  { left: 28, top: 22 },
  { left: 34, top: 58 },
  { left: 40, top: 12 },
  { left: 46, top: 36 },
  { left: 53, top: 18 },
  { left: 58, top: 50 },
  { left: 66, top: 26 },
  { left: 72, top: 10 },
  { left: 77, top: 44 },
  { left: 84, top: 20 },
  { left: 89, top: 54 },
  { left: 95, top: 30 },
];

// Crosses the whole glade, starting and ending just out of sight.
const cloudDrift = keyframes`
  from { transform: translateX(-160px); }
  to   { transform: translateX(calc(100cqw + 20px)); }
`;

const Drifting = styled.div`
  position: absolute;
  left: 0;
  opacity: 0.85;
  animation: ${cloudDrift} var(--cloud-duration) var(--cloud-delay) linear
    infinite;

  & > svg {
    display: block;
    overflow: visible;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: translateX(var(--cloud-park));
  }
`;

/** `park` is where each waits under reduced motion, in % of the glade. */
const CLOUDS = [
  { top: 18, width: 150, duration: 260, delay: -60, park: 14 },
  { top: 64, width: 110, duration: 340, delay: -200, park: 40 },
  { top: 34, width: 130, duration: 300, delay: -130, park: 66 },
  { top: 80, width: 90, duration: 380, delay: -310, park: 88 },
];

// ─── Sky ──────────────────────────────────────────────────────────────────────

/** The sun by day, turning its rays; a moon with a halo at dusk. */
function SunOrMoon() {
  const glowId = useId();
  return (
    <svg aria-hidden="true" viewBox="-40 -40 80 80">
      <defs>
        <radialGradient id={glowId}>
          <stop
            offset="0.3"
            style={{
              stopColor: ld("rgba(255,240,170,0.7)", "rgba(220,230,255,0.3)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(255,240,170,0)", "rgba(220,230,255,0)"),
            }}
          />
        </radialGradient>
      </defs>
      <circle cx={0} cy={0} fill={`url(#${glowId})`} r={40} />
      <Spin style={vars({ "--spin-period": "140s" })}>
        {RAY_ANGLES.map((a) => (
          <path
            d="M-2 -17 L0 -28 L2 -17 Z"
            key={a}
            style={{ fill: ld("rgba(255,214,90,0.7)", "transparent") }}
            transform={`rotate(${a})`}
          />
        ))}
      </Spin>
      <circle cx={0} cy={0} r={13} style={{ fill: ld("#ffd95a", "#e8ecf6") }} />
      <circle
        cx={-4}
        cy={-3}
        r={3}
        style={{ fill: ld("rgba(255,255,255,0.4)", "rgba(180,190,215,0.6)") }}
      />
      <circle
        cx={4}
        cy={4}
        r={2}
        style={{ fill: ld("transparent", "rgba(180,190,215,0.6)") }}
      />
    </svg>
  );
}

const RAY_ANGLES = Array.from({ length: 12 }, (_, i) => i * 30);

// ─── Trees ────────────────────────────────────────────────────────────────────

const TREES: {
  kind: "oak" | "pine" | "birch";
  left: number;
  top: number;
  width: number;
  tone?: number;
}[] = [
  { kind: "oak", left: 2, top: 184, width: 118, tone: 0 },
  { kind: "pine", left: 8, top: 178, width: 60 },
  { kind: "birch", left: 13.5, top: 186, width: 70 },
  { kind: "oak", left: 21, top: 182, width: 128, tone: 1 },
  { kind: "pine", left: 29, top: 176, width: 54 },
  { kind: "pine", left: 32, top: 180, width: 44 },
  { kind: "oak", left: 40.5, top: 184, width: 104, tone: 2 },
  { kind: "birch", left: 47.5, top: 180, width: 66 },
  { kind: "oak", left: 55.5, top: 186, width: 136, tone: 0 },
  { kind: "pine", left: 64, top: 180, width: 58 },
  { kind: "birch", left: 69.5, top: 184, width: 72 },
  { kind: "oak", left: 76, top: 182, width: 116, tone: 1 },
  { kind: "pine", left: 83, top: 178, width: 56 },
  { kind: "oak", left: 90, top: 184, width: 124, tone: 2 },
  { kind: "pine", left: 97, top: 180, width: 60 },
];

/** Three greens, so neighbouring oaks are never twins. */
const OAK_TONES = [
  [ld("#6a9e5a", "#2e4034"), ld("#7eb46a", "#38503e")],
  [ld("#5e9450", "#2a3a30"), ld("#74aa60", "#344a38")],
  [ld("#7aa860", "#34463a"), ld("#8cbc72", "#3e5644")],
];

function Oak({ tone = 0 }: { tone?: number }) {
  const [deep, light] = OAK_TONES[tone];
  return (
    <svg aria-hidden="true" viewBox="0 0 60 64">
      <path
        d="M27 64 L28 40 Q22 36 18 38 Q24 32 28.5 36 L29 30 L31 30 L31.5 36 Q36 32 42 36 Q36 36 32 40 L33 64 Z"
        style={{ fill: ld("#7a5a3e", "#3a2c24") }}
      />
      <circle cx={30} cy={24} r={20} style={{ fill: deep }} />
      <circle cx={16} cy={32} r={13} style={{ fill: deep }} />
      <circle cx={44} cy={31} r={14} style={{ fill: deep }} />
      <circle cx={24} cy={17} r={12} style={{ fill: light }} />
      <circle cx={38} cy={20} r={10} style={{ fill: light }} />
      <circle cx={14} cy={27} r={7} style={{ fill: light }} />
      {/* A few apples, or blossom */}
      <circle
        cx={20}
        cy={30}
        r={1.6}
        style={{ fill: ld("#e8605a", "#8a4a50") }}
      />
      <circle
        cx={40}
        cy={28}
        r={1.6}
        style={{ fill: ld("#e8605a", "#8a4a50") }}
      />
      <circle
        cx={31}
        cy={12}
        r={1.6}
        style={{ fill: ld("#e8605a", "#8a4a50") }}
      />
    </svg>
  );
}

function Pine() {
  return (
    <svg aria-hidden="true" viewBox="0 0 30 64">
      <rect
        height={12}
        style={{ fill: ld("#6a4a34", "#34261e") }}
        width={4}
        x={13}
        y={52}
      />
      <path
        d="M15 0 L25 20 L5 20 Z"
        style={{ fill: ld("#4e8a5a", "#24382e") }}
      />
      <path
        d="M15 10 L28 36 L2 36 Z"
        style={{ fill: ld("#45805a", "#20342a") }}
      />
      <path
        d="M15 24 L30 54 L0 54 Z"
        style={{ fill: ld("#3e7650", "#1c3026") }}
      />
    </svg>
  );
}

function Birch() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 70">
      <rect
        height={40}
        style={{ fill: ld("#f2efe6", "#9a988e") }}
        width={4}
        x={18}
        y={30}
      />
      <path
        d="M18 38 L20 38 M20 46 L22 46 M18 55 L21 55 M19 63 L22 63"
        strokeWidth={1.4}
        style={{ stroke: ld("#3a3630", "#2a2824") }}
      />
      <ellipse
        cx={20}
        cy={22}
        rx={16}
        ry={22}
        style={{ fill: ld("#a8cc6c", "#3e5034") }}
      />
      <ellipse
        cx={14}
        cy={18}
        rx={8}
        ry={11}
        style={{ fill: ld("#bcd87e", "#485c3c") }}
      />
      <ellipse
        cx={26}
        cy={28}
        rx={7}
        ry={9}
        style={{ fill: ld("#94bc5e", "#36482e") }}
      />
    </svg>
  );
}

// ─── Meadow ───────────────────────────────────────────────────────────────────

function HollowLog() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 24">
      <rect
        height={16}
        rx={3}
        style={{ fill: ld("#8a6444", "#40302a") }}
        width={48}
        x={2}
        y={6}
      />
      <path
        d="M8 10 L40 10 M6 16 L44 16"
        strokeLinecap="round"
        strokeWidth={0.8}
        style={{ stroke: ld("#6e4e34", "#2e221c") }}
      />
      <ellipse
        cx={50}
        cy={14}
        rx={6}
        ry={8}
        style={{ fill: ld("#b8926a", "#5a4838") }}
      />
      <ellipse
        cx={50}
        cy={14}
        rx={4}
        ry={6}
        style={{ fill: ld("#3a2a1e", "#140e0a") }}
      />
      {/* Moss and a mushroom */}
      <path
        d="M6 7 Q12 3 18 7 Q24 4 28 7 Z"
        style={{ fill: ld("#7aa84a", "#34482a") }}
      />
      <rect
        height={4}
        style={{ fill: ld("#f0e8d8", "#908878") }}
        width={1.4}
        x={33.3}
        y={3}
      />
      <path
        d="M31 4 Q34 -0.5 37 4 Z"
        style={{ fill: ld("#e8a040", "#806030") }}
      />
      {/* Something is looking out of the log */}
      <Glimmer
        style={vars({
          "--glimmer-low": "0",
          "--glimmer-period": "9s",
          "--glimmer-offset": "-3s",
        })}
      >
        <circle
          cx={48.6}
          cy={13}
          r={0.9}
          style={{ fill: ld("#f4f0e0", "#ffe890") }}
        />
        <circle
          cx={51.6}
          cy={13}
          r={0.9}
          style={{ fill: ld("#f4f0e0", "#ffe890") }}
        />
      </Glimmer>
    </svg>
  );
}

const RING = [
  { x: 8, y: 16, h: 5, r: 4 },
  { x: 20, y: 12, h: 4, r: 3.2 },
  { x: 34, y: 11, h: 6, r: 4.6 },
  { x: 48, y: 12, h: 4, r: 3.4 },
  { x: 60, y: 16, h: 5, r: 4.2 },
  { x: 16, y: 22, h: 6, r: 4.8 },
  { x: 34, y: 24, h: 4, r: 3.6 },
  { x: 52, y: 22, h: 6, r: 5 },
];

function ToadstoolRing() {
  return (
    <svg aria-hidden="true" viewBox="0 0 68 26">
      {RING.map((m) => (
        <g key={`${m.x}-${m.y}`}>
          <rect
            height={m.h}
            rx={0.8}
            style={{ fill: ld("#f4ecdc", "#9a9284") }}
            width={2}
            x={m.x - 1}
            y={m.y - m.h}
          />
          <path
            d={`M${m.x - m.r} ${m.y - m.h} Q${m.x} ${m.y - m.h - m.r * 1.5} ${m.x + m.r} ${m.y - m.h} Z`}
            style={{ fill: ld("#e0403a", "#8a3a3a") }}
          />
          <circle
            cx={m.x - m.r * 0.35}
            cy={m.y - m.h - m.r * 0.45}
            r={0.7}
            style={{ fill: ld("#ffffff", "#c8c0b8") }}
          />
          <circle
            cx={m.x + m.r * 0.35}
            cy={m.y - m.h - m.r * 0.6}
            r={0.55}
            style={{ fill: ld("#ffffff", "#c8c0b8") }}
          />
        </g>
      ))}
    </svg>
  );
}

function Signpost() {
  return (
    <svg aria-hidden="true" viewBox="0 0 30 40">
      <rect
        height={32}
        style={{ fill: ld("#8a6444", "#40302a") }}
        width={3}
        x={13.5}
        y={8}
      />
      <path
        d="M4 8 L22 8 L27 11.5 L22 15 L4 15 Z"
        style={{ fill: ld("#c09a6a", "#5a4838") }}
      />
      <path
        d="M26 18 L8 18 L3 21.5 L8 25 L26 25 Z"
        style={{ fill: ld("#b08a5a", "#524232") }}
      />
      <path
        d="M8 11.5 L18 11.5 M12 21.5 L22 21.5"
        strokeLinecap="round"
        strokeWidth={0.8}
        style={{ stroke: ld("#6e4e34", "#2e221c") }}
      />
      {/* A snail has made it to the top */}
      <circle
        cx={16}
        cy={5.2}
        r={2.6}
        style={{ fill: ld("#d0904a", "#6a4a2c") }}
      />
      <path
        d="M13 8 L20 8 Q21 7 21 5"
        fill="none"
        strokeLinecap="round"
        strokeWidth={1}
        style={{ stroke: ld("#d8c0a0", "#6a5c4c") }}
      />
    </svg>
  );
}

/** A stump with a tiny door and window, lit from inside at dusk. */
function FairyStump() {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 44">
      <path
        d="M10 44 Q12 30 12 14 L48 14 Q48 30 50 44 Z"
        style={{ fill: ld("#8a6444", "#40302a") }}
      />
      <path
        d="M4 44 Q8 40 12 36 L14 44 Z M56 44 Q52 40 48 36 L46 44 Z"
        style={{ fill: ld("#7a5638", "#382a24") }}
      />
      <ellipse
        cx={30}
        cy={14}
        rx={18}
        ry={5}
        style={{ fill: ld("#d8b888", "#6a5840") }}
      />
      <ellipse
        cx={30}
        cy={14}
        fill="none"
        rx={11}
        ry={3}
        strokeWidth={0.7}
        style={{ stroke: ld("#b09068", "#54462f") }}
      />
      {/* Door */}
      <path
        d="M24 44 L24 34 A6 6 0 0 1 36 34 L36 44 Z"
        style={{ fill: ld("#b85a3a", "#5a3028") }}
      />
      <path
        d="M30 28 L30 44"
        strokeWidth={0.6}
        style={{ stroke: ld("#8a3e28", "#3a1e18") }}
      />
      <circle
        cx={33.4}
        cy={38}
        r={0.9}
        style={{ fill: ld("#f0c040", "#c8a040") }}
      />
      {/* Window, lit at dusk */}
      <Glimmer
        style={vars({
          "--glimmer-low": "0.6",
          "--glimmer-period": "6s",
        })}
      >
        <circle
          cx={42}
          cy={24}
          r={7}
          style={{ fill: ld("transparent", "rgba(255,200,90,0.25)") }}
        />
        <circle
          cx={42}
          cy={24}
          r={3}
          style={{ fill: ld("#3a2a1e", "#ffcf6a") }}
        />
      </Glimmer>
      <path
        d="M39 24 L45 24 M42 21 L42 27"
        strokeWidth={0.6}
        style={{ stroke: ld("#8a6444", "#40302a") }}
      />
      {/* Toadstool roof ornament and a sprig of moss */}
      <rect
        height={5}
        style={{ fill: ld("#f0e8d8", "#908878") }}
        width={1.6}
        x={18.2}
        y={6}
      />
      <path d="M15 7 Q19 1 23 7 Z" style={{ fill: ld("#e0403a", "#8a3a3a") }} />
      <path
        d="M36 12 Q40 8 44 12 Z"
        style={{ fill: ld("#7aa84a", "#34482a") }}
      />
    </svg>
  );
}

const BEES = [
  { path: [8, -6, 14, 2, 4, 6], period: 5.2, offset: 0 },
  { path: [-8, -4, -12, 4, -2, 6], period: 6.4, offset: -2 },
] as const;

function Beehive() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 44">
      <rect
        height={10}
        style={{ fill: ld("#8a6444", "#40302a") }}
        width={3}
        x={18.5}
        y={34}
      />
      <rect
        height={2.4}
        style={{ fill: ld("#a07a52", "#4a382c") }}
        width={20}
        x={10}
        y={32}
      />
      <path
        d="M9 32 Q8 12 20 10 Q32 12 31 32 Z"
        style={{ fill: ld("#e8c070", "#7a6640") }}
      />
      <path
        d="M10 27 Q20 25 30 27 M9.6 22 Q20 20 30.4 22 M11 17 Q20 15 29 17"
        fill="none"
        strokeWidth={1}
        style={{ stroke: ld("#c89a4a", "#5a4a2e") }}
      />
      <path
        d="M17 32 A3 3 0 0 1 23 32 Z"
        style={{ fill: ld("#4a3420", "#1e140c") }}
      />
      {BEES.map((b) => (
        <g key={b.period} transform="translate(20 26)">
          <Wander
            style={vars({
              "--w1x": `${b.path[0]}px`,
              "--w1y": `${b.path[1]}px`,
              "--w2x": `${b.path[2]}px`,
              "--w2y": `${b.path[3]}px`,
              "--w3x": `${b.path[4]}px`,
              "--w3y": `${b.path[5]}px`,
              "--wander-period": `${b.period}s`,
              "--wander-offset": `${b.offset}s`,
            })}
          >
            <FlapAcross style={vars({ "--flap-period": "0.12s" })}>
              <ellipse
                cx={0}
                cy={-1.4}
                rx={1.4}
                ry={0.9}
                style={{ fill: "rgba(255,255,255,0.8)" }}
              />
            </FlapAcross>
            <ellipse
              cx={0}
              cy={0}
              rx={1.7}
              ry={1.2}
              style={{ fill: ld("#f0c030", "#b09030") }}
            />
            <path
              d="M-0.4 -1.1 L-0.4 1.1 M0.7 -1 L0.7 1"
              strokeWidth={0.5}
              style={{ stroke: "#2a2010" }}
            />
          </Wander>
        </g>
      ))}
    </svg>
  );
}

const REEDS = [
  { x: 10, h: 18, lean: -6 },
  { x: 14, h: 24, lean: -2 },
  { x: 18, h: 16, lean: 4 },
  { x: 104, h: 20, lean: -3 },
  { x: 108, h: 26, lean: 3 },
];

/** Pond with lily pads, a frog, rings on the water and a dragonfly. */
function Pond() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 40">
      <ellipse
        cx={60}
        cy={26}
        rx={56}
        ry={13}
        style={{ fill: ld("#8cb888", "#3a4c3c") }}
      />
      <ellipse cx={60} cy={26} fill="var(--glade-pond)" rx={52} ry={11} />
      <ellipse
        cx={52}
        cy={23}
        rx={30}
        ry={4}
        style={{ fill: "var(--glade-pond-shine)", opacity: 0.6 }}
      />
      {[
        { x: 40, y: 30, period: 7, offset: 0 },
        { x: 78, y: 24, period: 9, offset: -4 },
      ].map((r) => (
        <Ripple
          key={r.x}
          style={vars({
            "--ripple-period": `${r.period}s`,
            "--ripple-offset": `${r.offset}s`,
          })}
        >
          <ellipse
            cx={r.x}
            cy={r.y}
            fill="none"
            rx={9}
            ry={2.6}
            strokeWidth={0.6}
            style={{
              stroke: ld("rgba(255,255,255,0.9)", "rgba(200,220,230,0.6)"),
            }}
          />
        </Ripple>
      ))}
      {/* Lily pads */}
      {[
        { x: 30, y: 26, r: 5 },
        { x: 70, y: 31, r: 6 },
        { x: 88, y: 22, r: 4 },
      ].map((p) => (
        <path
          d={`M${p.x} ${p.y} L${p.x + p.r} ${p.y - 1} A${p.r} ${p.r * 0.4} 0 1 1 ${p.x + p.r} ${p.y + 1} Z`}
          key={p.x}
          style={{ fill: ld("#5a9a44", "#2a4a2e") }}
        />
      ))}
      <circle
        cx={88}
        cy={21}
        r={1.6}
        style={{ fill: ld("#f7c0d0", "#9a6a7a") }}
      />
      {/* The frog, who does a small hop now and then */}
      <Bob style={vars({ "--bob-y": "-1.6px", "--bob-period": "4.5s" })}>
        <g transform="translate(70 29)">
          <ellipse
            cx={0}
            cy={0}
            rx={3.6}
            ry={2.4}
            style={{ fill: ld("#6cb040", "#3a6030") }}
          />
          <circle
            cx={-1.8}
            cy={-2}
            r={1.3}
            style={{ fill: ld("#6cb040", "#3a6030") }}
          />
          <circle
            cx={1.8}
            cy={-2}
            r={1.3}
            style={{ fill: ld("#6cb040", "#3a6030") }}
          />
          <circle cx={-1.8} cy={-2.2} r={0.55} style={{ fill: "#1a1a10" }} />
          <circle cx={1.8} cy={-2.2} r={0.55} style={{ fill: "#1a1a10" }} />
          <path
            d="M-1.4 0.4 Q0 1.2 1.4 0.4"
            fill="none"
            strokeWidth={0.4}
            style={{ stroke: "#1a1a10" }}
          />
        </g>
      </Bob>
      {REEDS.map((r) => (
        <Rock
          key={r.x}
          style={vars({
            "--rock": "4deg",
            "--rock-period": `${5 + (r.x % 4)}s`,
            "--rock-offset": `${-r.x / 20}s`,
          })}
        >
          <path
            d={`M${r.x} 30 Q${r.x + r.lean * 0.4} ${30 - r.h * 0.6} ${r.x + r.lean} ${30 - r.h}`}
            fill="none"
            strokeLinecap="round"
            strokeWidth={0.9}
            style={{ stroke: ld("#4e8a3a", "#2a4a2c") }}
          />
          <ellipse
            cx={r.x + r.lean * 0.85}
            cy={30 - r.h * 0.82}
            rx={1.1}
            ry={3}
            style={{ fill: ld("#8a5a34", "#4a3024") }}
            transform={`rotate(${r.lean * 2} ${r.x + r.lean * 0.85} ${30 - r.h * 0.82})`}
          />
        </Rock>
      ))}
      <g transform="translate(96 10)">
        <Wander
          style={vars({
            "--w1x": "-18px",
            "--w1y": "4px",
            "--w2x": "-34px",
            "--w2y": "-2px",
            "--w3x": "-12px",
            "--w3y": "-6px",
            "--wander-period": "12s",
          })}
        >
          <FlapAcross style={vars({ "--flap-period": "0.14s" })}>
            <ellipse
              cx={-2.6}
              cy={-0.4}
              rx={2.6}
              ry={0.7}
              style={{
                fill: ld("rgba(210,240,255,0.85)", "rgba(160,190,220,0.4)"),
              }}
            />
            <ellipse
              cx={2.6}
              cy={-0.4}
              rx={2.6}
              ry={0.7}
              style={{
                fill: ld("rgba(210,240,255,0.85)", "rgba(160,190,220,0.4)"),
              }}
            />
          </FlapAcross>
          <rect
            height={1}
            rx={0.5}
            style={{ fill: ld("#2a8aa8", "#3a6a80") }}
            width={7}
            x={-2}
            y={-0.5}
          />
        </Wander>
      </g>
    </svg>
  );
}

const ROCKS = [
  { left: 46, top: 250, width: 34 },
  { left: 98, top: 310, width: 40 },
  { left: 71, top: 314, width: 30 },
];

function Rocks() {
  return (
    <svg aria-hidden="true" viewBox="0 0 30 14">
      <ellipse
        cx={12}
        cy={9}
        rx={10}
        ry={5}
        style={{ fill: ld("#9a9a92", "#4a4c4a") }}
      />
      <ellipse
        cx={10}
        cy={7.4}
        rx={6}
        ry={2.6}
        style={{ fill: ld("#b4b4ac", "#5a5c5a") }}
      />
      <ellipse
        cx={23}
        cy={11}
        rx={5}
        ry={3}
        style={{ fill: ld("#8a8a82", "#424442") }}
      />
      <path
        d="M4 9 Q7 5 11 6 Q8 8 4 9 Z"
        style={{ fill: ld("#7aa84a", "#34482a") }}
      />
    </svg>
  );
}

const TUFTS = [
  { left: 4, top: 290 },
  { left: 12, top: 244 },
  { left: 23, top: 256 },
  { left: 30, top: 306 },
  { left: 38, top: 284 },
  { left: 43, top: 226 },
  { left: 50, top: 300 },
  { left: 57, top: 248 },
  { left: 66, top: 308 },
  { left: 74, top: 240 },
  { left: 82, top: 304 },
  { left: 88, top: 246 },
  { left: 93, top: 296 },
];

function Tuft() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 10">
      <path
        d="M3 10 Q3 5 1 2 M6 10 Q6 4 5 0 M9 10 Q9 5 11 1 M12 10 Q12 6 15 4"
        fill="none"
        strokeLinecap="round"
        strokeWidth={1}
        style={{ stroke: ld("#6a9a4e", "#3a4c34") }}
      />
    </svg>
  );
}

const FLOWER_CLUMPS = [
  { left: 11, top: 296 },
  { left: 24, top: 304 },
  { left: 31, top: 276 },
  { left: 44, top: 298 },
  { left: 52, top: 272 },
  { left: 60, top: 306 },
  { left: 68, top: 282 },
  { left: 86, top: 300 },
  { left: 94, top: 274 },
];

const PINK = "var(--glade-bloom-pink)";
const GOLD = "var(--glade-bloom-gold)";
const WHITE = "var(--glade-bloom-white)";
const BLUE = ld("#8aa8e8", "#5a6a98");
const LILAC = ld("#b08ad8", "#6e5a8e");

/**
 * The clumps come in three plantings, taken in turn, so neighbours differ
 * without anything being random.
 */
const PLANTINGS: {
  kind: "tulip" | "daisy" | "lavender";
  x: number;
  h: number;
  color: string;
}[][] = [
  [
    { kind: "daisy", x: 4, h: 9, color: WHITE },
    { kind: "tulip", x: 9, h: 12, color: PINK },
    { kind: "daisy", x: 14, h: 8, color: GOLD },
    { kind: "tulip", x: 19, h: 10, color: PINK },
  ],
  [
    { kind: "lavender", x: 4, h: 11, color: LILAC },
    { kind: "daisy", x: 9, h: 9, color: WHITE },
    { kind: "lavender", x: 13, h: 13, color: LILAC },
    { kind: "daisy", x: 18, h: 8, color: BLUE },
  ],
  [
    { kind: "tulip", x: 4, h: 10, color: GOLD },
    { kind: "daisy", x: 9, h: 12, color: PINK },
    { kind: "tulip", x: 14, h: 9, color: GOLD },
    { kind: "daisy", x: 19, h: 11, color: WHITE },
  ],
];

function FlowerClump({ index }: { index: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 16">
      <ellipse
        cx={11.5}
        cy={15.2}
        rx={10}
        ry={1.6}
        style={{ fill: ld("#7cae5e", "#3a4a36") }}
      />
      <g transform="translate(0 15)">
        <Rock
          style={vars({
            "--rock": "4deg",
            "--rock-period": `${5.5 + (index % 4) * 0.8}s`,
            "--rock-offset": `${-index * 1.3}s`,
          })}
        >
          {PLANTINGS[index % PLANTINGS.length].map((f) => {
            if (f.kind === "tulip") {
              return <Tulip color={f.color} h={f.h} key={f.x} x={f.x} />;
            }
            if (f.kind === "daisy") {
              return <Daisy color={f.color} h={f.h} key={f.x} x={f.x} />;
            }
            return <Lavender color={f.color} h={f.h} key={f.x} x={f.x} />;
          })}
        </Rock>
      </g>
    </svg>
  );
}

const BUTTERFLIES: {
  left: number;
  top: number;
  path: [number, number, number, number, number, number];
  period: number;
  offset: number;
  wing: string;
  spot: string;
}[] = [
  {
    left: 20,
    top: 236,
    path: [30, -16, 60, 4, 24, 14],
    period: 19,
    offset: -3,
    wing: ld("#f0a040", "#8a6040"),
    spot: ld("#ffffff", "#b0a8c0"),
  },
  {
    left: 50,
    top: 220,
    path: [-26, -10, -54, 8, -20, 16],
    period: 23,
    offset: -11,
    wing: ld("#88c0f0", "#50688a"),
    spot: ld("#2a2a4a", "#1a1a2a"),
  },
  {
    left: 73,
    top: 250,
    path: [24, -18, 50, -4, 20, 10],
    period: 21,
    offset: -7,
    wing: ld("#fff4b0", "#9a9070"),
    spot: ld("#f0a040", "#8a6040"),
  },
];
