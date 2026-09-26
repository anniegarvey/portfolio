import { Bob, Falling, Glimmer, ld, Rock, vars } from "@/components/Scenery";

// ── Autumn Forest ─────────────────────────────────────────────────────────────
//
// A wood in October: a low sun through the trees in light mode, an ember-red
// evening in dark. Sunbeams breathe, leaves let go and turn on the way down, a
// squirrel flicks its tail on the bough, and a hedgehog snuffles through the
// leaf pile.

const LEAF_COLOURS = [
  ld("#d84a20", "#9a2c10"),
  ld("#e8902a", "#a45a18"),
  ld("#f0c040", "#a8801c"),
  ld("#a8401c", "#6a220c"),
];

/** A leaf about its own middle, pointing up. */
const LEAF = "M0 -3 Q2.2 -0.6 0 3 Q-2.2 -0.6 0 -3 Z";

/** Canopies of the woods behind, far row then near row. */
const FAR_WOOD = Array.from({ length: 20 }, (_, i) => ({
  x: i * 21 + (i % 3) * 3,
  y: 104 + (i % 4) * 3,
  r: 13 + ((i * 7) % 5),
}));
const NEAR_WOOD = Array.from({ length: 14 }, (_, i) => ({
  x: 10 + i * 30 + (i % 2) * 6,
  y: 118 + (i % 3) * 3,
  r: 14 + ((i * 5) % 6),
}));

/** Leaves lying on the ground, scattered by a fixed rule so every render agrees. */
const LITTER = Array.from({ length: 56 }, (_, i) => ({
  x: (i * 71) % 400,
  y: 134 + ((i * 37) % 64),
  a: (i * 53) % 180,
  c: i % LEAF_COLOURS.length,
}));

/** Leaves on top of each leaf pile, by position along it. */
const PILE_LEAVES = Array.from({ length: 10 }, (_, i) => i);

const FALLING_LEAVES = [
  { x: 88, y: 58 },
  { x: 148, y: 44 },
  { x: 202, y: 54 },
  { x: 258, y: 39 },
  { x: 318, y: 64 },
  { x: 112, y: 84 },
  { x: 178, y: 74 },
  { x: 232, y: 81 },
  { x: 292, y: 69 },
  { x: 342, y: 57 },
  { x: 162, y: 100 },
  { x: 244, y: 96 },
];

const BEAMS = [
  { x: 120, w: 22, period: 9, offset: 0 },
  { x: 170, w: 14, period: 12, offset: -4 },
  { x: 222, w: 26, period: 10.5, offset: -7 },
];

/** Leafy canopy for one of the framing trees, as blobs about its middle. */
const CANOPY = [
  { dx: 0, dy: 0, rx: 66, ry: 40, c: ld("#b84a1c", "#6a1a08") },
  { dx: -24, dy: -12, rx: 44, ry: 30, c: ld("#cc5c22", "#801e0c") },
  { dx: 20, dy: -22, rx: 50, ry: 32, c: ld("#dc7428", "#962c14") },
  { dx: -8, dy: -30, rx: 36, ry: 24, c: ld("#e0862e", "#9e3616") },
  { dx: 30, dy: -36, rx: 33, ry: 21, c: ld("#ec9a38", "#aa441c") },
  { dx: 34, dy: 8, rx: 28, ry: 18, c: ld("#d4662a", "#882410") },
];

/** Dabs of brighter and darker leaves over the canopy. */
const CANOPY_DABS = Array.from({ length: 22 }, (_, i) => ({
  dx: -50 + ((i * 29) % 100),
  dy: -44 + ((i * 17) % 60),
  c: i % LEAF_COLOURS.length,
  a: (i * 41) % 180,
}));

function Canopy({ x, y, flip }: { x: number; y: number; flip: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      {CANOPY.map((b) => (
        <ellipse
          cx={b.dx}
          cy={b.dy}
          key={`${b.dx}-${b.dy}`}
          rx={b.rx}
          ry={b.ry}
          style={{ fill: b.c }}
        />
      ))}
      {CANOPY_DABS.map((d) => (
        <path
          d={LEAF}
          key={`${d.dx}-${d.dy}`}
          style={{ fill: LEAF_COLOURS[d.c] }}
          transform={`translate(${d.dx} ${d.dy}) rotate(${d.a}) scale(1.3)`}
        />
      ))}
    </g>
  );
}

function Trunk({ x, flip }: { x: number; flip: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <g transform={`translate(${x} 0) scale(${s} 1)`}>
      <path
        d="M0 20 L30 20 Q28 120 36 200 L-4 200 Q2 120 0 20 Z"
        style={{ fill: ld("#5a3018", "#2e1408") }}
      />
      <path
        d="M30 58 Q60 48 90 40 M30 88 Q54 82 78 76 M30 118 Q50 112 76 110"
        fill="none"
        strokeLinecap="round"
        strokeWidth={9}
        style={{ stroke: ld("#5a3018", "#2e1408") }}
      />
      {/* Bark */}
      <path
        d="M8 40 Q6 80 10 120 Q8 160 12 196 M18 30 Q20 70 16 110 M22 130 Q24 160 22 196"
        fill="none"
        strokeLinecap="round"
        strokeWidth={1.2}
        style={{ stroke: ld("#40200e", "#1e0c04") }}
      />
      <path
        d="M4 30 L4 196"
        strokeWidth={4}
        style={{ stroke: ld("rgba(255,170,70,0.16)", "rgba(140,60,20,0.16)") }}
      />
    </g>
  );
}

export function AutumnForestScene({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: ld("#f6d88e", "#1c0a10") }} />
          <stop offset="0.6" style={{ stopColor: ld("#f2a660", "#5a2016") }} />
        </linearGradient>
        <linearGradient id={`${uid}-ground`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: ld("#b8662e", "#2a1008") }} />
          <stop offset="1" style={{ stopColor: ld("#8e4a20", "#170804") }} />
        </linearGradient>
        <radialGradient id={`${uid}-sun`}>
          <stop
            offset="0"
            style={{
              stopColor: ld("rgba(255,244,200,0.95)", "rgba(255,140,70,0.5)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(255,244,200,0)", "rgba(255,140,70,0)"),
            }}
          />
        </radialGradient>
        <linearGradient id={`${uid}-beam`} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0"
            style={{
              stopColor: ld("rgba(255,248,210,0.55)", "rgba(255,150,80,0.16)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(255,248,210,0)", "rgba(255,150,80,0)"),
            }}
          />
        </linearGradient>
      </defs>

      <rect fill={`url(#${uid}-sky)`} height={200} width={400} />
      <circle cx={214} cy={96} fill={`url(#${uid}-sun)`} r={70} />
      <circle
        cx={214}
        cy={96}
        r={10}
        style={{ fill: ld("#fff4d0", "#f0845a") }}
      />

      {/* The woods behind */}
      {FAR_WOOD.map((t) => (
        <g key={`far-${t.x}`}>
          <line
            strokeWidth={2}
            style={{ stroke: ld("#b0703e", "#3a1a12") }}
            x1={t.x}
            x2={t.x}
            y1={t.y}
            y2={134}
          />
          <circle
            cx={t.x}
            cy={t.y - t.r * 0.4}
            r={t.r}
            style={{ fill: ld("#e8a868", "#4a2016") }}
          />
        </g>
      ))}
      {NEAR_WOOD.map((t) => (
        <g key={`near-${t.x}`}>
          <line
            strokeWidth={3}
            style={{ stroke: ld("#8a4a24", "#2a100a") }}
            x1={t.x}
            x2={t.x}
            y1={t.y}
            y2={136}
          />
          <circle
            cx={t.x}
            cy={t.y - t.r * 0.5}
            r={t.r}
            style={{ fill: ld("#d8783a", "#3e1810") }}
          />
          <circle
            cx={t.x - t.r * 0.35}
            cy={t.y - t.r * 0.8}
            r={t.r * 0.55}
            style={{ fill: ld("#e8904a", "#4e2014") }}
          />
        </g>
      ))}

      {/* Sunbeams slanting through, breathing */}
      {BEAMS.map((b) => (
        <Glimmer
          key={b.x}
          style={vars({
            "--glimmer-low": "0.35",
            "--glimmer-period": `${b.period}s`,
            "--glimmer-offset": `${b.offset}s`,
          })}
        >
          <path
            d={`M${b.x} 0 L${b.x + b.w} 0 L${b.x + b.w + 70} 190 L${b.x + 40} 190 Z`}
            fill={`url(#${uid}-beam)`}
          />
        </Glimmer>
      ))}

      {/* Forest floor, a path through it, and the leaves on it */}
      <rect fill={`url(#${uid}-ground)`} height={68} width={400} y={132} />
      <path
        d="M196 132 Q180 150 196 166 Q214 184 178 200 L246 200 Q236 180 224 166 Q208 150 214 132 Z"
        style={{ fill: ld("#d49658", "#3a1c0e") }}
      />
      {LITTER.map((l) => (
        <path
          d={LEAF}
          key={`${l.x}-${l.y}`}
          style={{ fill: LEAF_COLOURS[l.c] }}
          transform={`translate(${l.x} ${l.y}) rotate(${l.a}) scale(0.9 0.6)`}
        />
      ))}

      <Trunk flip={false} x={0} />
      <Trunk flip={true} x={400} />

      {/* A squirrel on the left bough, flicking its tail */}
      <g transform="translate(62 104)">
        <Rock
          style={vars({
            "--rock": "10deg",
            "--rock-origin": "100% 100%",
            "--rock-period": "2.8s",
          })}
        >
          <path
            d="M-4 0 Q-12 -2 -12 -9 Q-12 -15 -6 -15 Q-9 -10 -5 -6 Q-3 -3 -4 0 Z"
            style={{ fill: ld("#b85a24", "#5a2410") }}
          />
        </Rock>
        <ellipse
          cx={0}
          cy={-3}
          rx={4.4}
          ry={3.4}
          style={{ fill: ld("#c86a2e", "#6a2c14") }}
        />
        <circle
          cx={4}
          cy={-6}
          r={2.6}
          style={{ fill: ld("#c86a2e", "#6a2c14") }}
        />
        <path
          d="M3.2 -8.2 L3.6 -10.4 L4.8 -8.4 Z"
          style={{ fill: ld("#c86a2e", "#6a2c14") }}
        />
        <circle cx={5} cy={-6.4} r={0.5} style={{ fill: "#1a0e08" }} />
        <circle
          cx={6.6}
          cy={-3.2}
          r={1.2}
          style={{ fill: ld("#8a5a2a", "#3a2010") }}
        />
        <ellipse
          cx={1}
          cy={-1.8}
          rx={2}
          ry={1.4}
          style={{ fill: ld("#f0c090", "#8a5a3a") }}
        />
      </g>

      <Canopy flip={false} x={52} y={50} />
      <Canopy flip={true} x={348} y={50} />

      {/* Leaf piles, one with a hedgehog in it */}
      {[
        { x: 70, y: 172 },
        { x: 318, y: 174 },
      ].map((p) => (
        <g key={p.x} transform={`translate(${p.x} ${p.y})`}>
          <ellipse
            cx={0}
            cy={0}
            rx={30}
            ry={10}
            style={{ fill: ld("#b84c1e", "#5a1e0a") }}
          />
          <ellipse
            cx={-8}
            cy={-4}
            rx={16}
            ry={7}
            style={{ fill: ld("#d8742a", "#7a2e10") }}
          />
          <ellipse
            cx={10}
            cy={-3}
            rx={14}
            ry={6}
            style={{ fill: ld("#e89a34", "#8a4214") }}
          />
          {PILE_LEAVES.map((i) => (
            <path
              d={LEAF}
              key={i}
              style={{ fill: LEAF_COLOURS[i % LEAF_COLOURS.length] }}
              transform={`translate(${-22 + i * 5} ${-3 - (i % 3) * 2}) rotate(${i * 47})`}
            />
          ))}
        </g>
      ))}
      <g transform="translate(84 168)">
        <Bob style={vars({ "--bob-y": "-1.5px", "--bob-period": "2.4s" })}>
          <path
            d="M-8 0 Q-9 -8 0 -9 Q8 -9 8 -2 L10 0 Z"
            style={{ fill: ld("#6a4a30", "#2e1e12") }}
          />
          <path
            d="M-7 -3 L-8 -7 M-4 -6 L-4 -10 M0 -7 L1 -11 M4 -6 L5 -9"
            strokeLinecap="round"
            strokeWidth={0.9}
            style={{ stroke: ld("#4a3020", "#1e120a") }}
          />
          <path
            d="M6 -3 Q10 -3 12 -0.5 L7 0 Z"
            style={{ fill: ld("#d0a878", "#6a5038") }}
          />
          <circle cx={12} cy={-0.8} r={0.8} style={{ fill: "#1a100a" }} />
          <circle cx={8} cy={-2.4} r={0.5} style={{ fill: "#1a100a" }} />
        </Bob>
      </g>

      {/* Toadstools and a pumpkin by the right-hand tree */}
      {[
        { x: 356, y: 162, h: 5, r: 4 },
        { x: 364, y: 164, h: 7, r: 5.2 },
        { x: 346, y: 166, h: 4, r: 3 },
      ].map((m) => (
        <g key={m.x}>
          <rect
            height={m.h}
            rx={0.8}
            style={{ fill: ld("#f4ecd8", "#8a8070") }}
            width={2}
            x={m.x - 1}
            y={m.y - m.h}
          />
          <path
            d={`M${m.x - m.r} ${m.y - m.h} Q${m.x} ${m.y - m.h - m.r * 1.4} ${m.x + m.r} ${m.y - m.h} Z`}
            style={{ fill: ld("#d8302a", "#7a1a14") }}
          />
          <circle
            cx={m.x - m.r * 0.35}
            cy={m.y - m.h - m.r * 0.45}
            r={0.7}
            style={{ fill: ld("#ffffff", "#b0a8a0") }}
          />
          <circle
            cx={m.x + m.r * 0.3}
            cy={m.y - m.h - m.r * 0.6}
            r={0.5}
            style={{ fill: ld("#ffffff", "#b0a8a0") }}
          />
        </g>
      ))}
      <g transform="translate(282 168)">
        <ellipse
          cx={-4}
          cy={0}
          rx={6}
          ry={6}
          style={{ fill: ld("#e0782a", "#8a3e12") }}
        />
        <ellipse
          cx={4}
          cy={0}
          rx={6}
          ry={6}
          style={{ fill: ld("#e0782a", "#8a3e12") }}
        />
        <ellipse
          cx={0}
          cy={0}
          rx={6}
          ry={6.4}
          style={{ fill: ld("#ec8a34", "#9a4816") }}
        />
        <path
          d="M0 -6 Q1 -9 3 -10"
          fill="none"
          strokeLinecap="round"
          strokeWidth={1.4}
          style={{ stroke: ld("#5a6a2a", "#2e3414") }}
        />
      </g>

      {/* Leaves letting go. Each drifts a different distance sideways and
          turns at its own rate, so twelve leaves never look like one leaf
          twelve times. */}
      {FALLING_LEAVES.map((leaf, i) => (
        <Falling
          key={`${leaf.x}-${leaf.y}`}
          style={vars({
            "--fall-x": `${(i % 2 === 0 ? 1 : -1) * (14 + (i % 4) * 9)}px`,
            "--fall-y": `${150 - leaf.y}px`,
            "--fall-spin": `${(i % 3 === 0 ? -1 : 1) * (160 + (i % 5) * 70)}deg`,
            "--fall-period": `${11 + (i % 6) * 2.4}s`,
            "--fall-offset": `${-(i * 2.7) % 17}s`,
          })}
        >
          <path
            d={LEAF}
            style={{ fill: LEAF_COLOURS[i % LEAF_COLOURS.length] }}
            transform={`translate(${leaf.x} ${leaf.y}) rotate(${i * 37}) scale(1.4)`}
          />
        </Falling>
      ))}
    </>
  );
}
