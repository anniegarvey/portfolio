import {
  Adrift,
  Cross,
  FlapUp,
  Glimmer,
  ld,
  Pour,
  vars,
} from "@/components/Scenery";

// ── Misty Mountain ────────────────────────────────────────────────────────────
//
// Ridge behind ridge fading into a dawn sky, or a moonlit one in dark mode.
// Cranes cross high up, a waterfall pours off a cliff into its own spray, mist
// drifts between the ridges, and a pagoda keeps a light on in the dark.

/** Ridges, far to near: each paler the further off it is. */
const RIDGES = [
  {
    d: "M0 118 L28 92 L50 104 L90 56 L112 76 L130 66 L160 96 L188 70 L214 42 L240 72 L262 60 L300 98 L328 74 L352 50 L378 80 L400 68 L400 150 L0 150 Z",
    fill: ld("#bccae0", "#1e2744"),
  },
  {
    d: "M0 116 L24 106 L44 110 L72 82 L96 104 L122 96 L150 112 L180 88 L206 102 L236 108 L270 84 L294 100 L318 94 L346 110 L372 90 L400 102 L400 160 L0 160 Z",
    fill: ld("#9eb0ca", "#171e38"),
  },
];

/** Snow on the peaks, each ragged along its lower edge. */
const SNOW = [
  "M90 56 L80 68 L85 67 L89 72 L93 67 L98 70 L101 66 Z",
  "M214 42 L201 60 L207 58 L211 63 L216 58 L221 62 L226 58 Z",
  "M352 50 L340 66 L346 64 L350 69 L355 64 L360 66 L363 62 Z",
  "M72 82 L64 92 L69 91 L72 95 L76 91 L80 92 Z",
  "M180 88 L172 98 L177 97 L180 101 L184 97 L188 98 Z",
  "M270 84 L262 94 L267 93 L270 97 L274 93 L278 94 Z",
];

const NEAR_PINES = [
  { x: 14, y: 168, h: 34 },
  { x: 30, y: 172, h: 26 },
  { x: 48, y: 166, h: 38 },
  { x: 350, y: 166, h: 36 },
  { x: 368, y: 170, h: 28 },
  { x: 388, y: 164, h: 40 },
];

const RIDGE_PINES = [
  { x: 150, y: 120, h: 9 },
  { x: 158, y: 121, h: 7 },
  { x: 222, y: 122, h: 8 },
  { x: 230, y: 123, h: 10 },
  { x: 238, y: 124, h: 7 },
  { x: 300, y: 110, h: 8 },
  { x: 372, y: 116, h: 9 },
];

const VEILS = [
  { cx: 130, cy: 104, rx: 190, ry: 12, range: 30, period: 74, offset: -11 },
  { cx: 280, cy: 124, rx: 190, ry: 14, range: 34, period: 66, offset: -30 },
  { cx: 180, cy: 148, rx: 210, ry: 14, range: 26, period: 88, offset: -52 },
];

const CRANES = [
  { x: 0, y: 0, offset: 0 },
  { x: -14, y: 6, offset: -0.4 },
  { x: -26, y: 13, offset: -0.8 },
];

function Pine({
  x,
  y,
  h,
  fill,
}: {
  x: number;
  y: number;
  h: number;
  fill: string;
}) {
  const w = h * 0.34;
  return (
    <path
      d={`M${x} ${y - h} L${x - w * 0.55} ${y - h * 0.62} L${x - w * 0.3} ${y - h * 0.62} L${x - w * 0.8} ${y - h * 0.3} L${x - w * 0.45} ${y - h * 0.3} L${x - w} ${y} L${x + w} ${y} L${x + w * 0.45} ${y - h * 0.3} L${x + w * 0.8} ${y - h * 0.3} L${x + w * 0.3} ${y - h * 0.62} L${x + w * 0.55} ${y - h * 0.62} Z`}
      style={{ fill }}
    />
  );
}

/** A bank of mist, soft all round, drifting to and fro between ridges. */
function Veil({ veil, uid }: { veil: (typeof VEILS)[number]; uid: string }) {
  return (
    <Adrift
      style={vars({
        "--sway-range": `${veil.range}px`,
        "--sway-period": `${veil.period}s`,
        "--sway-offset": `${veil.offset}s`,
      })}
    >
      <ellipse
        cx={veil.cx}
        cy={veil.cy}
        fill={`url(#${uid}-mist)`}
        rx={veil.rx}
        ry={veil.ry}
      />
    </Adrift>
  );
}

export function MistyMountainScene({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: ld("#8fb4e0", "#070a1c") }} />
          <stop offset="0.7" style={{ stopColor: ld("#f2dccc", "#26305a") }} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop
            offset="0"
            style={{
              stopColor: ld("rgba(255,236,200,0.85)", "rgba(220,228,255,0.35)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(255,236,200,0)", "rgba(220,228,255,0)"),
            }}
          />
        </radialGradient>
        <radialGradient id={`${uid}-mist`}>
          <stop
            offset="0.4"
            style={{
              stopColor: ld("rgba(246,242,242,0.7)", "rgba(110,130,180,0.3)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(246,242,242,0)", "rgba(110,130,180,0)"),
            }}
          />
        </radialGradient>
        <clipPath id={`${uid}-fall`}>
          <path d="M106 99 L117 99 L119 142 L104 142 Z" />
        </clipPath>
      </defs>

      <rect fill={`url(#${uid}-sky)`} height={200} width={400} />

      {/* Sun low in a dawn sky; the moon in dark mode */}
      <circle cx={292} cy={52} fill={`url(#${uid}-glow)`} r={34} />
      <circle
        cx={292}
        cy={52}
        r={10}
        style={{ fill: ld("#fff3d6", "#e4eaf8") }}
      />
      <circle
        cx={289}
        cy={50}
        r={2.2}
        style={{ fill: ld("transparent", "rgba(170,180,210,0.5)") }}
      />
      <circle
        cx={295}
        cy={55}
        r={1.4}
        style={{ fill: ld("transparent", "rgba(170,180,210,0.5)") }}
      />

      {/* Cranes, crossing the peaks in a loose V */}
      <Cross
        style={vars({
          "--cross-x": "500px",
          "--cross-y": "-18px",
          "--cross-period": "64s",
          "--cross-offset": "-20s",
        })}
      >
        <g transform="translate(-50 44)">
          {CRANES.map((c) => (
            <g key={c.x} transform={`translate(${c.x} ${c.y})`}>
              <FlapUp
                style={vars({
                  "--flap-period": "1.6s",
                  "--flap-offset": `${c.offset}s`,
                })}
              >
                <path
                  d="M-5 -3 Q-2 -3.4 0 0 Q2 -3.4 5 -3"
                  fill="none"
                  strokeLinecap="round"
                  strokeWidth={1}
                  style={{ stroke: ld("#f8f6f0", "#b8c0d8") }}
                />
              </FlapUp>
              <path
                d="M-4 0.4 L0 0 L5.5 -1.4"
                fill="none"
                strokeLinecap="round"
                strokeWidth={0.8}
                style={{ stroke: ld("#f8f6f0", "#b8c0d8") }}
              />
              <circle
                cx={5.8}
                cy={-1.5}
                r={0.6}
                style={{ fill: ld("#d0402a", "#8a3a3a") }}
              />
            </g>
          ))}
        </g>
      </Cross>

      {RIDGES.map((r, i) => (
        <g key={r.d}>
          <path d={r.d} style={{ fill: r.fill }} />
          {SNOW.slice(i * 3, i * 3 + 3).map((d) => (
            <path
              d={d}
              key={d}
              style={{
                fill: ld("rgba(255,255,255,0.92)", "rgba(220,228,255,0.6)"),
              }}
            />
          ))}
        </g>
      ))}

      <Veil uid={uid} veil={VEILS[0]} />

      {/* Near ridge, with a cliff the waterfall comes off */}
      <path
        d="M0 128 Q30 112 60 118 Q84 106 102 99 L120 99 Q140 112 170 120 Q200 112 230 124 Q260 116 290 108 Q320 100 342 108 Q370 118 400 112 L400 170 L0 170 Z"
        style={{ fill: ld("#7c90aa", "#11172c") }}
      />
      <path
        d="M102 99 L120 99 L122 144 L100 144 Z"
        style={{ fill: ld("#6a7e98", "#0d1224") }}
      />
      {RIDGE_PINES.map((p) => (
        <Pine fill={ld("#566a80", "#0a0e1e")} key={p.x} {...p} />
      ))}

      {/* Waterfall: streaks running down inside the fall's outline */}
      <path
        d="M106 99 L117 99 L119 142 L104 142 Z"
        style={{ fill: ld("#cfe4f2", "#3a5070") }}
      />
      <g clipPath={`url(#${uid}-fall)`}>
        <Pour style={vars({ "--pour-y": "16px", "--pour-period": "1.4s" })}>
          {[0, 1, 2, 3].map((col) =>
            [0, 1, 2, 3].map((row) => (
              <line
                key={`${col}-${row}`}
                strokeLinecap="round"
                strokeWidth={1}
                style={{
                  stroke: ld("rgba(255,255,255,0.9)", "rgba(190,210,240,0.6)"),
                }}
                x1={107.5 + col * 3 + (row % 2)}
                x2={107.5 + col * 3 + (row % 2)}
                y1={83 + row * 16 + col * 4}
                y2={91 + row * 16 + col * 4}
              />
            )),
          )}
        </Pour>
      </g>
      <Glimmer
        style={vars({
          "--glimmer-low": "0.55",
          "--glimmer-period": "3.2s",
        })}
      >
        <ellipse
          cx={111}
          cy={143}
          rx={14}
          ry={5}
          style={{
            fill: ld("rgba(255,255,255,0.85)", "rgba(170,190,230,0.4)"),
          }}
        />
      </Glimmer>

      {/* A pagoda on the near ridge, its lamp lit at night */}
      <g transform="translate(336 106)">
        <rect
          height={4}
          style={{ fill: ld("#8a5a48", "#241820") }}
          width={10}
          x={-5}
          y={-4}
        />
        <path
          d="M-9 -4 Q-5 -6 -4 -7 L4 -7 Q5 -6 9 -4 Z"
          style={{ fill: ld("#4a3a44", "#141020") }}
        />
        <rect
          height={4}
          style={{ fill: ld("#8a5a48", "#241820") }}
          width={8}
          x={-4}
          y={-11}
        />
        <Glimmer
          style={vars({
            "--glimmer-low": "0.6",
            "--glimmer-period": "5.5s",
          })}
        >
          <rect
            height={2.2}
            style={{ fill: ld("#3a2a2a", "#ffc860") }}
            width={2}
            x={-1}
            y={-10}
          />
        </Glimmer>
        <path
          d="M-8 -11 Q-4 -13 -3 -14 L3 -14 Q4 -13 8 -11 Z"
          style={{ fill: ld("#4a3a44", "#141020") }}
        />
        <rect
          height={3.4}
          style={{ fill: ld("#8a5a48", "#241820") }}
          width={6}
          x={-3}
          y={-17.4}
        />
        <path
          d="M-6.5 -17.4 Q-3 -19 -2 -20 L2 -20 Q3 -19 6.5 -17.4 Z"
          style={{ fill: ld("#4a3a44", "#141020") }}
        />
        <line
          strokeWidth={0.6}
          style={{ stroke: ld("#4a3a44", "#141020") }}
          x1={0}
          x2={0}
          y1={-20}
          y2={-24}
        />
      </g>

      <Veil uid={uid} veil={VEILS[1]} />

      {/* Valley floor, and the stream the waterfall feeds */}
      <path
        d="M0 150 Q50 136 110 146 Q170 156 230 144 Q300 132 400 148 L400 200 L0 200 Z"
        style={{ fill: ld("#607490", "#0a0e1c") }}
      />
      <path
        d="M104 143 Q96 152 112 160 Q134 170 120 184 Q110 194 124 200 L136 200 Q124 192 132 184 Q146 168 122 158 Q110 151 119 143 Z"
        style={{ fill: ld("#b8d4e8", "#28405e") }}
      />

      {NEAR_PINES.map((p) => (
        <Pine fill={ld("#3c4c5e", "#05080f")} key={p.x} {...p} />
      ))}

      <Veil uid={uid} veil={VEILS[2]} />
    </>
  );
}
