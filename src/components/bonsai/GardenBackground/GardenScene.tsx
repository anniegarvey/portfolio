import {
  Adrift,
  Bob,
  Butterfly,
  Cloud,
  Cross,
  Daisy,
  FlapAcross,
  FlapUp,
  Lavender,
  ld,
  Rock,
  Spin,
  Tulip,
  vars,
  Wander,
} from "@/components/Scenery";

// ── Garden ────────────────────────────────────────────────────────────────────
//
// A cottage garden on a summer afternoon, and a warm dusk in dark mode: a
// windmill turning on the far hill, a rose arch over the path, flower beds
// that nod in the breeze, a robin at the birdbath, and a snail with nowhere in
// particular to be.

const CLOUDS = [
  { x: 70, y: 46, scale: 1.1, range: 22, period: 54, offset: -7 },
  { x: 205, y: 36, scale: 0.75, range: 15, period: 71, offset: -33 },
  { x: 372, y: 58, scale: 0.9, range: 18, period: 63, offset: -19 },
];

/** Small round trees dotted along the far hills. */
const HILL_TREES = [
  { x: 22, y: 97, r: 4.5 },
  { x: 30, y: 98, r: 3.4 },
  { x: 128, y: 99, r: 3.8 },
  { x: 244, y: 95, r: 4.2 },
  { x: 254, y: 96, r: 3 },
  { x: 356, y: 97, r: 4 },
];

/** Pickets either side of the rose arch, which stands over the path. */
const PICKETS = Array.from({ length: 58 }, (_, i) => 2 + i * 7).filter(
  (x) => x < 180 || x > 216,
);

/** Where roses climb the arch, in scene units. */
const ARCH_ROSES = [
  { x: 184, y: 104 },
  { x: 185, y: 96 },
  { x: 188, y: 89 },
  { x: 194, y: 84 },
  { x: 200, y: 83 },
  { x: 206, y: 84 },
  { x: 212, y: 89 },
  { x: 215, y: 96 },
  { x: 216, y: 104 },
  { x: 183, y: 111 },
  { x: 217, y: 111 },
];

const STONES = [
  { cx: 200, cy: 124, rx: 9, ry: 3.4 },
  { cx: 199, cy: 135, rx: 12, ry: 4.4 },
  { cx: 202, cy: 148, rx: 15, ry: 5.4 },
  { cx: 198, cy: 163, rx: 18, ry: 6.4 },
  { cx: 202, cy: 180, rx: 21, ry: 7.4 },
  { cx: 199, cy: 198, rx: 24, ry: 8 },
];

type Bloom = "tulip" | "daisy" | "lavender";

/**
 * Clumps of flowers that nod together. Each clump is one animated group, so a
 * bed costs a few layers however many flowers are in it.
 */
const CLUMPS: {
  x: number;
  y: number;
  flowers: { kind: Bloom; dx: number; h: number; color: string }[];
  period: number;
}[] = [
  {
    x: 38,
    y: 162,
    period: 6.2,
    flowers: [
      { kind: "tulip", dx: 0, h: 13, color: ld("#e8505a", "#a83a48") },
      { kind: "tulip", dx: 5, h: 16, color: ld("#f0a040", "#b07030") },
      { kind: "tulip", dx: 10, h: 12, color: ld("#e8505a", "#a83a48") },
      { kind: "lavender", dx: -6, h: 14, color: ld("#9a7ad0", "#6a58a0") },
      { kind: "lavender", dx: 15, h: 15, color: ld("#9a7ad0", "#6a58a0") },
    ],
  },
  {
    x: 78,
    y: 168,
    period: 7.4,
    flowers: [
      { kind: "daisy", dx: 0, h: 12, color: ld("#ffffff", "#c8c4d8") },
      { kind: "daisy", dx: 7, h: 15, color: ld("#ffffff", "#c8c4d8") },
      { kind: "tulip", dx: 13, h: 13, color: ld("#f080b0", "#a05878") },
      { kind: "daisy", dx: 19, h: 11, color: ld("#ffe070", "#b8a050") },
    ],
  },
  {
    x: 128,
    y: 158,
    period: 5.6,
    flowers: [
      { kind: "lavender", dx: 0, h: 13, color: ld("#9a7ad0", "#6a58a0") },
      { kind: "lavender", dx: 4, h: 16, color: ld("#8a6ac8", "#5e4e98") },
      { kind: "lavender", dx: 8, h: 12, color: ld("#9a7ad0", "#6a58a0") },
      { kind: "tulip", dx: 13, h: 11, color: ld("#f0a040", "#b07030") },
    ],
  },
  {
    x: 20,
    y: 186,
    period: 8.1,
    flowers: [
      { kind: "daisy", dx: 0, h: 13, color: ld("#ffffff", "#c8c4d8") },
      { kind: "tulip", dx: 7, h: 16, color: ld("#e8505a", "#a83a48") },
      { kind: "daisy", dx: 14, h: 12, color: ld("#ffe070", "#b8a050") },
    ],
  },
  {
    x: 262,
    y: 160,
    period: 6.8,
    flowers: [
      { kind: "tulip", dx: 0, h: 12, color: ld("#f080b0", "#a05878") },
      { kind: "tulip", dx: 5, h: 15, color: ld("#e8505a", "#a83a48") },
      { kind: "daisy", dx: 11, h: 13, color: ld("#ffffff", "#c8c4d8") },
      { kind: "lavender", dx: 17, h: 14, color: ld("#9a7ad0", "#6a58a0") },
    ],
  },
  {
    x: 304,
    y: 168,
    period: 5.9,
    flowers: [
      { kind: "daisy", dx: 0, h: 14, color: ld("#ffe070", "#b8a050") },
      { kind: "daisy", dx: 6, h: 11, color: ld("#ffffff", "#c8c4d8") },
      { kind: "tulip", dx: 12, h: 15, color: ld("#f0a040", "#b07030") },
      { kind: "tulip", dx: 17, h: 12, color: ld("#e8505a", "#a83a48") },
    ],
  },
  {
    x: 350,
    y: 158,
    period: 7.1,
    flowers: [
      { kind: "lavender", dx: 0, h: 15, color: ld("#9a7ad0", "#6a58a0") },
      { kind: "tulip", dx: 5, h: 13, color: ld("#f080b0", "#a05878") },
      { kind: "lavender", dx: 10, h: 12, color: ld("#8a6ac8", "#5e4e98") },
      { kind: "daisy", dx: 16, h: 15, color: ld("#ffffff", "#c8c4d8") },
    ],
  },
  {
    x: 362,
    y: 186,
    period: 6.4,
    flowers: [
      { kind: "tulip", dx: 0, h: 14, color: ld("#e8505a", "#a83a48") },
      { kind: "daisy", dx: 6, h: 12, color: ld("#ffe070", "#b8a050") },
      { kind: "tulip", dx: 12, h: 15, color: ld("#f0a040", "#b07030") },
    ],
  },
];

const TUFTS = [
  { x: 12, y: 132 },
  { x: 60, y: 140 },
  { x: 104, y: 176 },
  { x: 150, y: 132 },
  { x: 160, y: 190 },
  { x: 236, y: 190 },
  { x: 246, y: 134 },
  { x: 290, y: 142 },
  { x: 330, y: 186 },
  { x: 388, y: 134 },
];

/** Dusk only: transparent by day. */
const FIREFLIES = [
  { x: 60, y: 130, path: [14, -8, 26, 4, 8, 10], period: 13 },
  { x: 150, y: 122, path: [-10, -6, -20, 6, -4, 10], period: 16 },
  { x: 250, y: 128, path: [12, 8, 22, -6, 6, -10], period: 14 },
  { x: 318, y: 138, path: [-14, -4, -6, 10, 10, 6], period: 18 },
  { x: 380, y: 124, path: [-8, 8, -18, -2, -6, -8], period: 15 },
] as const;

function Blooms({ flowers }: { flowers: (typeof CLUMPS)[number]["flowers"] }) {
  return flowers.map((f) => {
    if (f.kind === "tulip") {
      return <Tulip color={f.color} h={f.h} key={f.dx} x={f.dx} />;
    }
    if (f.kind === "daisy") {
      return <Daisy color={f.color} h={f.h} key={f.dx} x={f.dx} />;
    }
    return <Lavender color={f.color} h={f.h} key={f.dx} x={f.dx} />;
  });
}

/**
 * A garden snail heading right: a soft foot with a silvery trail behind it, a
 * striped spiral shell, and eye stalks that wave as it goes.
 */
function Snail({ uid }: { uid: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-trail`} x1="0" x2="1" y1="0" y2="0">
          <stop
            offset="0"
            style={{
              stopColor: ld("rgba(255,255,255,0)", "rgba(200,210,240,0)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(255,255,255,0.75)", "rgba(200,210,240,0.35)"),
            }}
          />
        </linearGradient>
        <radialGradient cx="0.38" cy="0.35" id={`${uid}-shell`} r="0.7">
          <stop offset="0" style={{ stopColor: ld("#f2c27a", "#8a6a40") }} />
          <stop offset="0.6" style={{ stopColor: ld("#c47a3a", "#6a4424") }} />
          <stop offset="1" style={{ stopColor: ld("#8a4a22", "#3e2614") }} />
        </radialGradient>
      </defs>
      {/* Trail */}
      <rect
        fill={`url(#${uid}-trail)`}
        height={1.2}
        rx={0.6}
        width={22}
        x={-28}
        y={-0.9}
      />
      {/* Foot and head */}
      <path
        d="M-8 0 Q-8.4 -1.6 -5 -1.8 L4 -2 Q7 -2.4 8.4 -4.6 Q9.8 -6.2 11 -4.6 Q11.8 -2.6 10.2 -1 Q9 0.2 6.4 0.2 L-6 0.2 Q-8 0.2 -8 0 Z"
        style={{ fill: ld("#d8bc90", "#6a5a44") }}
      />
      <path
        d="M-7 -0.2 L8 -0.2"
        strokeLinecap="round"
        strokeWidth={0.5}
        style={{ stroke: ld("#b89a70", "#4e4232") }}
      />
      {/* Eye stalks, waving a little */}
      <Rock
        style={vars({
          "--rock": "7deg",
          "--rock-origin": "0% 100%",
          "--rock-period": "3.2s",
        })}
      >
        <path
          d="M9.4 -5.2 Q10 -7.6 11 -9.4 M10.4 -5 Q11.8 -7 13.6 -8.2"
          fill="none"
          strokeLinecap="round"
          strokeWidth={0.7}
          style={{ stroke: ld("#c8a878", "#5e5040") }}
        />
        <circle
          cx={11}
          cy={-9.6}
          r={0.75}
          style={{ fill: ld("#3a2a20", "#e8dcc0") }}
        />
        <circle
          cx={13.7}
          cy={-8.4}
          r={0.75}
          style={{ fill: ld("#3a2a20", "#e8dcc0") }}
        />
      </Rock>
      <circle
        cx={10.8}
        cy={-3.4}
        r={0.35}
        style={{ fill: ld("#3a2a20", "#1a1410") }}
      />
      {/* Shell, with its spiral and a glint */}
      <circle cx={-1} cy={-5.6} fill={`url(#${uid}-shell)`} r={5.4} />
      <path
        d="M-1 -5.6 m0.9 0.2 a0.9 0.9 0 1 1 -0.9 -1.1 a2 2 0 1 1 -1.6 2.6 a3.2 3.2 0 1 1 4.6 -3.6 a4.4 4.4 0 1 1 -8 3.6"
        fill="none"
        strokeLinecap="round"
        strokeWidth={0.7}
        style={{ stroke: ld("#7a3e1a", "#2e1c10") }}
      />
      <path
        d="M-3.8 -9 Q-2.2 -10.6 0 -10.4"
        fill="none"
        strokeLinecap="round"
        strokeWidth={0.8}
        style={{ stroke: ld("rgba(255,255,255,0.7)", "rgba(230,220,200,0.3)") }}
      />
    </g>
  );
}

export function GardenScene({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: ld("#7fbde8", "#1c2248") }} />
          <stop offset="1" style={{ stopColor: ld("#d4ecf4", "#6a4a6e") }} />
        </linearGradient>
        <linearGradient id={`${uid}-ground`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: ld("#8fc85c", "#24381c") }} />
          <stop offset="1" style={{ stopColor: ld("#6aa83c", "#152410") }} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop
            offset="0"
            style={{
              stopColor: ld("rgba(255,244,192,0.9)", "rgba(244,232,208,0.4)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(255,244,192,0)", "rgba(244,232,208,0)"),
            }}
          />
        </radialGradient>
      </defs>

      <rect fill={`url(#${uid}-sky)`} height={122} width={400} />

      {/* Sun by day; a low, pale moon at dusk, with the rays gone. */}
      <circle cx={318} cy={60} fill={`url(#${uid}-glow)`} r={36} />
      <g transform="translate(318 60)">
        <Spin style={vars({ "--spin-period": "120s" })}>
          {Array.from({ length: 12 }, (_, i) => (
            <path
              d="M-1.6 -15 L0 -24 L1.6 -15 Z"
              key={`ray-${i * 30}`}
              style={{ fill: ld("rgba(255,210,80,0.6)", "transparent") }}
              transform={`rotate(${i * 30})`}
            />
          ))}
        </Spin>
      </g>
      <circle
        cx={318}
        cy={60}
        r={11}
        style={{ fill: ld("#ffd84e", "#efe4c4") }}
      />
      <circle
        cx={314}
        cy={57}
        r={3}
        style={{ fill: ld("rgba(255,255,255,0.45)", "rgba(200,190,160,0.5)") }}
      />

      {CLOUDS.map((c) => (
        <Adrift
          key={`cloud-${c.x}`}
          style={vars({
            "--sway-range": `${c.range}px`,
            "--sway-period": `${c.period}s`,
            "--sway-offset": `${c.offset}s`,
          })}
        >
          <Cloud
            scale={c.scale}
            shade={ld("rgba(200,220,240,0.9)", "rgba(120,100,150,0.25)")}
            tint={ld("rgba(255,255,255,0.92)", "rgba(190,170,210,0.22)")}
            x={c.x}
            y={c.y}
          />
        </Adrift>
      ))}

      {/* Two swallows, a long way up, crossing and gone. */}
      <Cross
        style={vars({
          "--cross-x": "470px",
          "--cross-y": "-14px",
          "--cross-period": "46s",
          "--cross-offset": "-12s",
        })}
      >
        {[
          { x: -30, y: 64, offset: 0 },
          { x: -42, y: 70, offset: -0.3 },
        ].map((b) => (
          <g key={b.x} transform={`translate(${b.x} ${b.y})`}>
            <FlapUp
              style={vars({
                "--flap-period": "0.7s",
                "--flap-offset": `${b.offset}s`,
              })}
            >
              <path
                d="M-3.5 -1.2 Q-1.6 -2.4 0 0 Q1.6 -2.4 3.5 -1.2"
                fill="none"
                strokeLinecap="round"
                strokeWidth={0.8}
                style={{ stroke: ld("#3a4a5a", "#1a1428") }}
              />
            </FlapUp>
          </g>
        ))}
      </Cross>

      {/* Far hills */}
      <path
        d="M0 100 Q40 82 92 93 T196 88 T300 84 T400 92 L400 122 L0 122 Z"
        style={{ fill: ld("#b8dc9c", "#34384a") }}
      />
      {HILL_TREES.map((t) => (
        <g key={`hill-${t.x}`}>
          <rect
            height={t.r * 1.4}
            style={{ fill: ld("#7a6a4a", "#241c20") }}
            width={0.9}
            x={t.x - 0.45}
            y={t.y - t.r * 0.4}
          />
          <circle
            cx={t.x}
            cy={t.y - t.r}
            r={t.r}
            style={{ fill: ld("#7cb860", "#2a3438") }}
          />
        </g>
      ))}

      {/* Windmill on the far hill, sails turning on the breeze */}
      <g transform="translate(76 92)">
        <path
          d="M-4.5 0 L-2.6 -15 L2.6 -15 L4.5 0 Z"
          style={{ fill: ld("#f2e6d0", "#4a4452") }}
        />
        <path
          d="M-3.4 -15 L0 -19.5 L3.4 -15 Z"
          style={{ fill: ld("#c0584a", "#5a3440") }}
        />
        <rect
          height={3.4}
          rx={1.2}
          style={{ fill: ld("#8a6040", "#2e2228") }}
          width={2.4}
          x={-1.2}
          y={-3.4}
        />
        <circle
          cx={0}
          cy={-9}
          r={0.9}
          style={{ fill: ld("#6a8ab0", "#e8c870") }}
        />
        <g transform="translate(0 -15)">
          <Spin style={vars({ "--spin-period": "16s" })}>
            {[0, 90, 180, 270].map((a) => (
              <g key={a} transform={`rotate(${a})`}>
                <line
                  strokeWidth={0.6}
                  style={{ stroke: ld("#7a5a3a", "#2e2228") }}
                  x1={0}
                  x2={0}
                  y1={0}
                  y2={-11}
                />
                <rect
                  height={8}
                  style={{ fill: ld("rgba(255,250,240,0.9)", "#5a5460") }}
                  width={2.6}
                  x={0.3}
                  y={-11}
                />
              </g>
            ))}
            <circle
              cx={0}
              cy={0}
              r={1}
              style={{ fill: ld("#7a5a3a", "#2e2228") }}
            />
          </Spin>
        </g>
      </g>

      {/* Near hills */}
      <path
        d="M0 108 Q60 96 132 105 T262 101 T400 104 L400 122 L0 122 Z"
        style={{ fill: ld("#a2d080", "#2a3a2a") }}
      />

      {/* Lawn */}
      <rect fill={`url(#${uid}-ground)`} height={88} width={400} y={112} />

      {/* Picket fence along the bottom of the hills */}
      <rect
        height={1.6}
        style={{ fill: ld("#e4dccb", "#3c3a44") }}
        width={400}
        y={106}
      />
      <rect
        height={1.6}
        style={{ fill: ld("#e4dccb", "#3c3a44") }}
        width={400}
        y={112}
      />
      {PICKETS.map((x) => (
        <path
          d={`M${x} 118 L${x} 104 L${x + 2} 101.5 L${x + 4} 104 L${x + 4} 118 Z`}
          key={x}
          style={{ fill: ld("#fbf7ee", "#4e4c58") }}
        />
      ))}

      {/* Hedges in front of the fence, dotted with blossom */}
      {[
        { x: 70, r: 1 },
        { x: 334, r: 0.9 },
      ].map((h) => (
        <g
          key={`hedge-${h.x}`}
          transform={`translate(${h.x} 118) scale(${h.r})`}
        >
          <ellipse
            cx={0}
            cy={0}
            rx={34}
            ry={13}
            style={{ fill: ld("#4e9030", "#1c3014") }}
          />
          <ellipse
            cx={-14}
            cy={-5}
            rx={18}
            ry={11}
            style={{ fill: ld("#5ea03a", "#22381a") }}
          />
          <ellipse
            cx={14}
            cy={-6}
            rx={20}
            ry={12}
            style={{ fill: ld("#62a63e", "#243a1a") }}
          />
          <ellipse
            cx={0}
            cy={-10}
            rx={14}
            ry={8}
            style={{ fill: ld("#70b248", "#2a421e") }}
          />
          {[
            [-24, -3],
            [-14, -12],
            [-4, -6],
            [6, -14],
            [16, -8],
            [26, -2],
            [-8, 2],
            [12, 1],
          ].map(([dx, dy]) => (
            <circle
              cx={dx}
              cy={dy}
              key={`${dx}-${dy}`}
              r={1.5}
              style={{ fill: ld("#f7b0c8", "#8a5870") }}
            />
          ))}
        </g>
      ))}

      {/* Rose arch over the path */}
      <path
        d="M184 118 L184 100 A16 16 0 0 1 216 100 L216 118"
        fill="none"
        strokeWidth={2.2}
        style={{ stroke: ld("#8a6a48", "#3a2c28") }}
      />
      <path
        d="M184 116 Q181 106 185 98 Q190 86 200 84 Q210 86 215 98 Q219 106 216 116"
        fill="none"
        strokeWidth={2.4}
        style={{ stroke: ld("#4a8a30", "#1e3418") }}
      />
      {ARCH_ROSES.map((r, i) => (
        <circle
          cx={r.x}
          cy={r.y}
          key={`${r.x}-${r.y}`}
          r={i % 3 === 0 ? 2 : 1.6}
          style={{
            fill:
              i % 2 === 0 ? ld("#e84a6a", "#9a3a50") : ld("#f8a0b8", "#a86a80"),
          }}
        />
      ))}

      {/* Path, widening as it comes towards us */}
      <path
        d="M190 116 Q184 150 162 200 L240 200 Q216 150 210 116 Z"
        style={{ fill: ld("#d8c89c", "#3a3026") }}
      />
      {STONES.map((s) => (
        <g key={s.cy}>
          <ellipse
            cx={s.cx}
            cy={s.cy + 1}
            rx={s.rx}
            ry={s.ry}
            style={{ fill: ld("#a89c7c", "#241e18") }}
          />
          <ellipse
            cx={s.cx}
            cy={s.cy}
            rx={s.rx}
            ry={s.ry}
            style={{ fill: ld("#cfc4a4", "#4a4034") }}
          />
          <ellipse
            cx={s.cx - s.rx * 0.2}
            cy={s.cy - s.ry * 0.25}
            rx={s.rx * 0.55}
            ry={s.ry * 0.45}
            style={{ fill: ld("#e2d9bc", "#574c3e") }}
          />
        </g>
      ))}

      {/* Beds under the flowers */}
      <ellipse
        cx={82}
        cy={170}
        rx={72}
        ry={16}
        style={{ fill: ld("#8a6444", "#2a1e16") }}
      />
      <ellipse
        cx={318}
        cy={170}
        rx={72}
        ry={16}
        style={{ fill: ld("#8a6444", "#2a1e16") }}
      />
      <ellipse
        cx={82}
        cy={168}
        rx={68}
        ry={13}
        style={{ fill: ld("#a07a52", "#33251a") }}
      />
      <ellipse
        cx={318}
        cy={168}
        rx={68}
        ry={13}
        style={{ fill: ld("#a07a52", "#33251a") }}
      />

      {TUFTS.map((t) => (
        <path
          d={`M${t.x - 3} ${t.y} Q${t.x - 3} ${t.y - 5} ${t.x - 5} ${t.y - 8} M${t.x} ${t.y} L${t.x} ${t.y - 9} M${t.x + 3} ${t.y} Q${t.x + 3} ${t.y - 5} ${t.x + 5} ${t.y - 7}`}
          fill="none"
          key={`tuft-${t.x}-${t.y}`}
          strokeLinecap="round"
          strokeWidth={1.2}
          style={{ stroke: ld("#4a8a28", "#2a4a1c") }}
        />
      ))}

      {/* Birdbath, with a robin that hops on the rim */}
      <g transform="translate(150 142)">
        <path
          d="M-3 0 L-2 -12 L2 -12 L3 0 Z"
          style={{ fill: ld("#c8c0b0", "#4a4650") }}
        />
        <ellipse
          cx={0}
          cy={0.5}
          rx={7}
          ry={2}
          style={{ fill: ld("#b0a898", "#3e3a44") }}
        />
        <ellipse
          cx={0}
          cy={-13}
          rx={11}
          ry={3.2}
          style={{ fill: ld("#d4ccbc", "#56525c") }}
        />
        <ellipse
          cx={0}
          cy={-13.6}
          rx={8.6}
          ry={2}
          style={{ fill: ld("#9ed0ec", "#3a4a6a") }}
        />
        <Bob
          style={vars({
            "--bob-y": "-2.5px",
            "--bob-period": "3.6s",
          })}
        >
          <g transform="translate(6 -16)">
            <ellipse
              cx={0}
              cy={0}
              rx={3}
              ry={2.4}
              style={{ fill: ld("#8a6a50", "#3a2c28") }}
            />
            <ellipse
              cx={-1}
              cy={0.6}
              rx={1.8}
              ry={1.6}
              style={{ fill: ld("#e86a3a", "#9a4a30") }}
            />
            <circle
              cx={-2.2}
              cy={-2}
              r={1.7}
              style={{ fill: ld("#8a6a50", "#3a2c28") }}
            />
            <circle cx={-2.8} cy={-2.3} r={0.35} style={{ fill: "#1a1410" }} />
            <path
              d="M-3.8 -2 L-5 -1.6 L-3.8 -1.4 Z"
              style={{ fill: ld("#e0a040", "#806030") }}
            />
            <path
              d="M2.6 -0.6 L5 -1.8 L4.4 0.4 Z"
              style={{ fill: ld("#6a5040", "#2a2020") }}
            />
          </g>
        </Bob>
      </g>

      {CLUMPS.map((c) => (
        <g key={`clump-${c.x}-${c.y}`} transform={`translate(${c.x} ${c.y})`}>
          <ellipse
            cx={c.flowers.length * 2.5}
            cy={0}
            rx={c.flowers.length * 3 + 4}
            ry={3.2}
            style={{ fill: ld("#4e8a30", "#1c3216") }}
          />
          <Rock
            style={vars({
              "--rock": "3deg",
              "--rock-period": `${c.period}s`,
              "--rock-offset": `${-c.x / 40}s`,
            })}
          >
            <Blooms flowers={c.flowers} />
          </Rock>
        </g>
      ))}

      {/* A snail, taking the whole afternoon over it along the lawn */}
      <Cross
        style={vars({
          "--cross-x": "64px",
          "--cross-period": "160s",
          "--cross-offset": "-50s",
        })}
      >
        <g transform="translate(228 134) scale(1.25)">
          <Snail uid={uid} />
        </g>
      </Cross>

      {/* A bumblebee doing the rounds of the right-hand bed */}
      <g transform="translate(300 148)">
        <Wander
          style={vars({
            "--w1x": "22px",
            "--w1y": "-6px",
            "--w2x": "44px",
            "--w2y": "4px",
            "--w3x": "18px",
            "--w3y": "8px",
            "--wander-period": "11s",
          })}
        >
          <FlapAcross style={vars({ "--flap-period": "0.12s" })}>
            <ellipse
              cx={-0.2}
              cy={-2}
              rx={1.8}
              ry={1.2}
              style={{
                fill: ld("rgba(255,255,255,0.8)", "rgba(200,200,220,0.35)"),
              }}
            />
          </FlapAcross>
          <ellipse
            cx={0}
            cy={0}
            rx={2.4}
            ry={1.7}
            style={{ fill: ld("#f0c030", "#9a8030") }}
          />
          <path
            d="M-0.6 -1.6 L-0.6 1.6 M1 -1.4 L1 1.4"
            strokeWidth={0.7}
            style={{ stroke: ld("#2a2010", "#1a1410") }}
          />
        </Wander>
      </g>

      <Butterfly
        offset={-3}
        path={[18, -10, 34, 2, 14, 8]}
        period={17}
        spot={ld("#ffffff", "#b0a8c0")}
        wing={ld("#f0a040", "#8a6040")}
        x={60}
        y={140}
      />
      <Butterfly
        offset={-9}
        path={[-16, -8, -30, 4, -10, 10]}
        period={21}
        scale={0.85}
        spot={ld("#2a2a4a", "#1a1a2a")}
        wing={ld("#88c0f0", "#50688a")}
        x={120}
        y={128}
      />
      <Butterfly
        offset={-5}
        path={[-20, -6, -8, -16, 12, -8]}
        period={19}
        scale={0.9}
        spot={ld("#f0a040", "#8a6040")}
        wing={ld("#fff4b0", "#9a9070")}
        x={344}
        y={138}
      />

      {FIREFLIES.map((f) => (
        <g key={`fly-${f.x}`} transform={`translate(${f.x} ${f.y})`}>
          <Wander
            style={vars({
              "--w1x": `${f.path[0]}px`,
              "--w1y": `${f.path[1]}px`,
              "--w2x": `${f.path[2]}px`,
              "--w2y": `${f.path[3]}px`,
              "--w3x": `${f.path[4]}px`,
              "--w3y": `${f.path[5]}px`,
              "--wander-period": `${f.period}s`,
            })}
          >
            <circle
              cx={0}
              cy={0}
              r={2.6}
              style={{ fill: ld("transparent", "rgba(255,220,110,0.25)") }}
            />
            <circle
              cx={0}
              cy={0}
              r={0.8}
              style={{ fill: ld("transparent", "#ffe690") }}
            />
          </Wander>
        </g>
      ))}
    </>
  );
}
