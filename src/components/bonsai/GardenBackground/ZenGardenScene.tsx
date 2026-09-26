import {
  Falling,
  FlapAcross,
  Glimmer,
  ld,
  Ripple,
  Spin,
  vars,
  Wander,
} from "@/components/Scenery";

// ── Zen Garden ────────────────────────────────────────────────────────────────
//
// Raked sand seen from above, moonlit in dark mode. A raked garden is a place
// that holds still on purpose, so the movement here is what has wandered in:
// koi turning under the lily pads, rings spreading where something touched the
// water, a dragonfly, and cherry petals letting go of the branch over the pond.

/** The rake's waves, a line every 7 units down the sand. */
const RAKE_YS = Array.from({ length: 29 }, (_, i) => 3 + i * 7);

function rakeLine(y: number): string {
  let d = `M-10 ${y}`;
  for (let x = -10; x < 410; x += 40) {
    d += ` q10 -1.6 20 0 t20 0`;
  }
  return d;
}

/** Stones, each ringed by its own ripples of raked sand. */
const STONES = [
  { cx: 132, cy: 150, rx: 28, ry: 20, rings: 4 },
  { cx: 302, cy: 84, rx: 21, ry: 16, rings: 3 },
  { cx: 222, cy: 132, rx: 13, ry: 10, rings: 3 },
];

const POND = { cx: 70, cy: 64, rx: 56, ry: 28 };

/** Pebbles edging the pond, placed round its rim. */
const RIM = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2;
  return {
    x: POND.cx + Math.cos(a) * (POND.rx + 2),
    y: POND.cy + Math.sin(a) * (POND.ry + 2),
    r: 2.2 + (i % 3) * 0.5,
  };
});

const BLOSSOMS = [
  { x: 18, y: 12 },
  { x: 30, y: 20 },
  { x: 44, y: 14 },
  { x: 56, y: 26 },
  { x: 66, y: 20 },
  { x: 80, y: 30 },
  { x: 90, y: 24 },
  { x: 38, y: 30 },
  { x: 100, y: 34 },
  { x: 24, y: 4 },
  { x: 72, y: 10 },
];

const PETALS = [
  { x: 44, y: 22, dx: 30, spin: 220, period: 22, offset: -4 },
  { x: 70, y: 26, dx: 44, spin: -180, period: 27, offset: -15 },
  { x: 92, y: 32, dx: 60, spin: 260, period: 31, offset: -9 },
  { x: 28, y: 18, dx: 22, spin: -240, period: 25, offset: -20 },
  { x: 60, y: 16, dx: 70, spin: 200, period: 35, offset: -27 },
];

const KOI = [
  {
    radius: 34,
    period: 26,
    body: ld("#f08030", "#a05828"),
    patch: ld("#ffffff", "#c8c4bc"),
  },
  {
    radius: 20,
    period: 33,
    body: ld("#fbf6ee", "#b8b4ac"),
    patch: ld("#e0402a", "#8a3020"),
  },
];

export function ZenGardenScene({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <radialGradient cx="0.55" cy="0.5" id={`${uid}-sand`} r="0.75">
          <stop offset="0" style={{ stopColor: ld("#f4ecd6", "#2e2a24") }} />
          <stop offset="1" style={{ stopColor: ld("#e0d4b4", "#1c1914") }} />
        </radialGradient>
        <radialGradient id={`${uid}-water`}>
          <stop offset="0" style={{ stopColor: ld("#3e8a9c", "#10283a") }} />
          <stop offset="1" style={{ stopColor: ld("#7cc0c8", "#264a5a") }} />
        </radialGradient>
        <clipPath id={`${uid}-pond`}>
          <ellipse cx={POND.cx} cy={POND.cy} rx={POND.rx} ry={POND.ry} />
        </clipPath>
      </defs>

      <rect fill={`url(#${uid}-sand)`} height={200} width={400} />

      {RAKE_YS.map((y) => (
        <path
          d={rakeLine(y)}
          fill="none"
          key={y}
          strokeWidth={0.9}
          style={{
            stroke: ld("rgba(150,128,80,0.4)", "rgba(140,120,80,0.45)"),
          }}
        />
      ))}

      {/* Each stone clears its own patch of sand and is raked round. */}
      {STONES.map((s) => (
        <g key={`stone-${s.cx}`}>
          <ellipse
            cx={s.cx}
            cy={s.cy}
            rx={s.rx + s.rings * 7 + 3}
            ry={s.ry + s.rings * 6 + 3}
            style={{ fill: ld("#efe6cc", "#28241e") }}
          />
          {Array.from({ length: s.rings }, (_, i) => i + 1).map((ring) => (
            <ellipse
              cx={s.cx}
              cy={s.cy}
              fill="none"
              key={ring}
              rx={s.rx + ring * 7}
              ry={s.ry + ring * 6}
              strokeWidth={0.9}
              style={{
                stroke: ld("rgba(150,128,80,0.42)", "rgba(140,120,80,0.48)"),
              }}
            />
          ))}
          {/* Moss the stone is bedded in */}
          <ellipse
            cx={s.cx + 2}
            cy={s.cy + s.ry * 0.55}
            rx={s.rx * 1.08}
            ry={s.ry * 0.5}
            style={{ fill: ld("#7a9a50", "#2c3c22") }}
          />
          <ellipse
            cx={s.cx}
            cy={s.cy + 2}
            rx={s.rx}
            ry={s.ry}
            style={{ fill: ld("#6e665c", "#3a342e") }}
          />
          <ellipse
            cx={s.cx - 2}
            cy={s.cy - 1}
            rx={s.rx * 0.88}
            ry={s.ry * 0.82}
            style={{ fill: ld("#948c80", "#58504a") }}
          />
          <ellipse
            cx={s.cx - s.rx * 0.25}
            cy={s.cy - s.ry * 0.3}
            rx={s.rx * 0.45}
            ry={s.ry * 0.35}
            style={{ fill: ld("#b4ac9e", "#746c64") }}
          />
          <circle
            cx={s.cx + s.rx * 0.35}
            cy={s.cy - s.ry * 0.4}
            r={s.rx * 0.12}
            style={{ fill: ld("#7a9a50", "#3e5a2c") }}
          />
          <circle
            cx={s.cx + s.rx * 0.5}
            cy={s.cy - s.ry * 0.1}
            r={s.rx * 0.08}
            style={{ fill: ld("#6a8a40", "#34502a") }}
          />
        </g>
      ))}

      {/* ── Koi pond ──────────────────────────────────────────────────── */}
      {RIM.map((p) => (
        <ellipse
          cx={p.x}
          cy={p.y}
          key={`${p.x.toFixed(1)}-${p.y.toFixed(1)}`}
          rx={p.r * 1.3}
          ry={p.r}
          style={{ fill: ld("#a8a094", "#4a4640") }}
        />
      ))}
      <ellipse
        cx={POND.cx}
        cy={POND.cy}
        fill={`url(#${uid}-water)`}
        rx={POND.rx}
        ry={POND.ry}
      />
      <g clipPath={`url(#${uid}-pond)`}>
        {/* Koi circling under the surface, seen at a slant */}
        {KOI.map((k) => (
          <g
            key={k.radius}
            transform={`translate(${POND.cx} ${POND.cy}) scale(1 0.62)`}
          >
            <Spin style={vars({ "--spin-period": `${k.period}s` })}>
              {/* Keeps the spinning box centred on the pond. */}
              <circle cx={0} cy={0} fill="none" r={k.radius + 6} />
              <g transform={`translate(${k.radius} 0)`}>
                <ellipse
                  cx={0}
                  cy={0}
                  rx={2.6}
                  ry={7}
                  style={{ fill: k.body }}
                />
                <path d="M0 -6 L-3 -11 L3 -11 Z" style={{ fill: k.body }} />
                <ellipse
                  cx={0.4}
                  cy={2}
                  rx={1.5}
                  ry={2.4}
                  style={{ fill: k.patch }}
                />
                <path
                  d="M-2.4 1 L-4.6 -1 M2.4 1 L4.6 -1"
                  strokeLinecap="round"
                  strokeWidth={1.1}
                  style={{ stroke: k.body }}
                />
              </g>
            </Spin>
          </g>
        ))}
        {[
          { x: 52, y: 58, period: 7, offset: 0 },
          { x: 96, y: 72, period: 9, offset: -4 },
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
              rx={10}
              ry={4}
              strokeWidth={0.7}
              style={{
                stroke: ld("rgba(255,255,255,0.8)", "rgba(180,210,230,0.6)"),
              }}
            />
          </Ripple>
        ))}
        <ellipse
          cx={58}
          cy={52}
          rx={24}
          ry={5}
          style={{
            fill: ld("rgba(255,255,255,0.18)", "rgba(200,220,255,0.08)"),
          }}
        />
      </g>
      {/* Lily pads, one in flower */}
      {[
        { x: 36, y: 70, r: 7, a: 20 },
        { x: 100, y: 58, r: 6, a: 160 },
        { x: 86, y: 80, r: 5, a: 260 },
      ].map((p) => (
        <g key={p.x} transform={`translate(${p.x} ${p.y}) scale(1 0.62)`}>
          <path
            d={`M0 0 L${p.r} ${-p.r * 0.4} A${p.r} ${p.r} 0 1 1 ${p.r} ${p.r * 0.4} Z`}
            style={{ fill: ld("#4e8c3a", "#1e3a22") }}
            transform={`rotate(${p.a})`}
          />
        </g>
      ))}
      <g transform="translate(36 68)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse
            cx={0}
            cy={-2.2}
            key={a}
            rx={1.2}
            ry={2.4}
            style={{ fill: ld("#f6c0cc", "#9a6a78") }}
            transform={`rotate(${a})`}
          />
        ))}
        <circle
          cx={0}
          cy={0}
          r={1.1}
          style={{ fill: ld("#f0c040", "#a08030") }}
        />
      </g>

      {/* A dragonfly over the water */}
      <g transform="translate(118 50)">
        <Wander
          style={vars({
            "--w1x": "-22px",
            "--w1y": "6px",
            "--w2x": "-40px",
            "--w2y": "-4px",
            "--w3x": "-14px",
            "--w3y": "-10px",
            "--wander-period": "14s",
          })}
        >
          <FlapAcross style={vars({ "--flap-period": "0.14s" })}>
            <ellipse
              cx={-3.4}
              cy={-0.8}
              rx={3.4}
              ry={0.9}
              style={{
                fill: ld("rgba(210,240,255,0.8)", "rgba(160,190,220,0.4)"),
              }}
            />
            <ellipse
              cx={3.4}
              cy={-0.8}
              rx={3.4}
              ry={0.9}
              style={{
                fill: ld("rgba(210,240,255,0.8)", "rgba(160,190,220,0.4)"),
              }}
            />
            <ellipse
              cx={-3}
              cy={1}
              rx={3}
              ry={0.8}
              style={{
                fill: ld("rgba(210,240,255,0.7)", "rgba(160,190,220,0.35)"),
              }}
            />
            <ellipse
              cx={3}
              cy={1}
              rx={3}
              ry={0.8}
              style={{
                fill: ld("rgba(210,240,255,0.7)", "rgba(160,190,220,0.35)"),
              }}
            />
          </FlapAcross>
          <rect
            height={9}
            rx={0.5}
            style={{ fill: ld("#2a8aa8", "#3a6a80") }}
            width={1}
            x={-0.5}
            y={-2}
          />
          <circle
            cx={0}
            cy={-2.2}
            r={0.9}
            style={{ fill: ld("#1a5a70", "#2a4a60") }}
          />
        </Wander>
      </g>

      {/* ── Cherry branch over the pond ───────────────────────────────── */}
      <path
        d="M-6 2 Q30 10 58 22 Q84 32 108 36 M40 15 Q46 4 54 0 M72 27 Q80 16 92 16 M30 11 Q24 22 30 30"
        fill="none"
        strokeLinecap="round"
        strokeWidth={3}
        style={{ stroke: ld("#5a3a2a", "#2a1c18") }}
      />
      {BLOSSOMS.map((b, i) => (
        <g key={`${b.x}-${b.y}`} transform={`translate(${b.x} ${b.y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle
              cx={0}
              cy={-2.2}
              key={a}
              r={1.9}
              style={{
                fill:
                  i % 3 === 0
                    ? ld("#f7c6d2", "#8a6070")
                    : ld("#fbdce4", "#9a7482"),
              }}
              transform={`rotate(${a + i * 17})`}
            />
          ))}
          <circle
            cx={0}
            cy={0}
            r={1}
            style={{ fill: ld("#e0708a", "#7a4050") }}
          />
        </g>
      ))}
      {PETALS.map((p) => (
        <Falling
          key={`petal-${p.x}`}
          style={vars({
            "--fall-x": `${p.dx}px`,
            "--fall-y": "120px",
            "--fall-spin": `${p.spin}deg`,
            "--fall-period": `${p.period}s`,
            "--fall-offset": `${p.offset}s`,
          })}
        >
          <ellipse
            cx={p.x}
            cy={p.y}
            rx={2.2}
            ry={1.4}
            style={{ fill: ld("#f2b4c4", "#8a5a68") }}
            transform={`rotate(30 ${p.x} ${p.y})`}
          />
        </Falling>
      ))}

      {/* ── Stone lantern on a bed of moss ────────────────────────────── */}
      <g transform="translate(362 168)">
        <ellipse
          cx={0}
          cy={4}
          rx={26}
          ry={9}
          style={{ fill: ld("#7a9a50", "#26361e") }}
        />
        <ellipse
          cx={-10}
          cy={2}
          rx={10}
          ry={5}
          style={{ fill: ld("#8aaa5c", "#2e4024") }}
        />
        <path
          d="M-7 4 L-5 -2 L5 -2 L7 4 Z"
          style={{ fill: ld("#8a8478", "#4a4640") }}
        />
        <rect
          height={10}
          style={{ fill: ld("#9a9488", "#56524a") }}
          width={4}
          x={-2}
          y={-12}
        />
        <rect
          height={3}
          style={{ fill: ld("#8a8478", "#4a4640") }}
          width={12}
          x={-6}
          y={-15}
        />
        <Glimmer
          style={vars({
            "--glimmer-low": "0.5",
            "--glimmer-period": "7s",
          })}
        >
          <circle
            cx={0}
            cy={-20}
            r={9}
            style={{ fill: ld("transparent", "rgba(255,180,70,0.22)") }}
          />
        </Glimmer>
        <rect
          height={8}
          style={{ fill: ld("#a8a296", "#5e5a52") }}
          width={10}
          x={-5}
          y={-23}
        />
        <rect
          height={4.4}
          style={{ fill: ld("#4a463e", "#f0b050") }}
          width={4.6}
          x={-2.3}
          y={-21.4}
        />
        <path
          d="M-10 -23 Q0 -30 10 -23 Z"
          style={{ fill: ld("#7e786c", "#46423c") }}
        />
        <path
          d="M-12 -23 L12 -23 L9 -25 L-9 -25 Z"
          style={{ fill: ld("#8a8478", "#4a4640") }}
        />
        <circle
          cx={0}
          cy={-29}
          r={1.8}
          style={{ fill: ld("#8a8478", "#4a4640") }}
        />
      </g>

      {/* A bamboo rake, left where the raking stopped */}
      <g transform="translate(268 180) rotate(-14)">
        <line
          strokeLinecap="round"
          strokeWidth={1.6}
          style={{ stroke: ld("#b89a5a", "#5a4a30") }}
          x1={0}
          x2={50}
          y1={0}
          y2={0}
        />
        <rect
          height={14}
          rx={1}
          style={{ fill: ld("#a8884a", "#4e4028") }}
          width={2.4}
          x={48}
          y={-7}
        />
        {[-6, -3, 0, 3, 6].map((t) => (
          <line
            key={t}
            strokeLinecap="round"
            strokeWidth={0.8}
            style={{ stroke: ld("#a8884a", "#4e4028") }}
            x1={50}
            x2={54}
            y1={t}
            y2={t}
          />
        ))}
      </g>
    </>
  );
}
