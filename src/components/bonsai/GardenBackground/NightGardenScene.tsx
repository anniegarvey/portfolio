import {
  Blink,
  Daisy,
  Glimmer,
  ld,
  Shoot,
  vars,
  Wander,
} from "@/components/Scenery";

// ── Night Garden ──────────────────────────────────────────────────────────────
//
// Always night, a shade deeper in dark mode. The sky keeps its own slow
// rhythms (stars that each breathe in their own time, now and then a shooting
// star), and the garden is lit by small things: lanterns, a cottage window on
// the hill, glowing toadstools, fireflies, and an owl who blinks at you.

const STARS: { cx: number; cy: number; r: number }[] = [
  { cx: 28, cy: 16, r: 1.2 },
  { cx: 62, cy: 7, r: 1.5 },
  { cx: 92, cy: 22, r: 1.0 },
  { cx: 118, cy: 11, r: 1.8 },
  { cx: 145, cy: 5, r: 1.2 },
  { cx: 168, cy: 28, r: 0.9 },
  { cx: 192, cy: 13, r: 1.5 },
  { cx: 218, cy: 7, r: 1.2 },
  { cx: 242, cy: 20, r: 1.0 },
  { cx: 258, cy: 35, r: 0.8 },
  { cx: 285, cy: 10, r: 1.4 },
  { cx: 308, cy: 25, r: 1.0 },
  { cx: 372, cy: 8, r: 1.6 },
  { cx: 386, cy: 72, r: 1.2 },
  { cx: 373, cy: 29, r: 0.9 },
  { cx: 14, cy: 40, r: 0.8 },
  { cx: 78, cy: 44, r: 1.0 },
  { cx: 208, cy: 42, r: 0.9 },
  { cx: 150, cy: 62, r: 1.1 },
  { cx: 175, cy: 51, r: 0.7 },
  { cx: 55, cy: 55, r: 0.9 },
  { cx: 238, cy: 66, r: 0.8 },
  { cx: 120, cy: 84, r: 0.9 },
  { cx: 22, cy: 88, r: 0.8 },
  { cx: 276, cy: 88, r: 0.9 },
];

/** Bright stars drawn as four-pointed sparkles. */
const SPARKLES = [
  { x: 104, y: 36, s: 3.4 },
  { x: 232, y: 30, s: 2.8 },
  { x: 40, y: 70, s: 2.4 },
];

/**
 * The stars twinkle in four groups on different rhythms, scattered so no
 * group reads as a shape: the whole sky never pulses together, and it costs
 * four layers rather than one per star.
 */
const TWINKLE = [
  { low: 0.35, period: 4.6, offset: 0 },
  { low: 0.45, period: 6.3, offset: -2.1 },
  { low: 0.3, period: 5.4, offset: -3.7 },
  { low: 0.5, period: 7.8, offset: -1.2 },
];

const FIREFLIES = [
  { x: 60, y: 150, path: [14, -10, 28, 2, 10, 8], period: 12 },
  { x: 92, y: 132, path: [-10, -8, -22, 4, -6, 10], period: 15 },
  { x: 140, y: 160, path: [12, 8, 26, -6, 8, -12], period: 13 },
  { x: 176, y: 138, path: [-14, -4, -6, 10, 10, 6], period: 17 },
  { x: 214, y: 176, path: [10, -10, 22, 0, 6, 8], period: 14 },
  { x: 248, y: 142, path: [-8, 8, -18, -4, -6, -10], period: 16 },
  { x: 300, y: 134, path: [12, -6, 20, 8, 4, 10], period: 12.5 },
  { x: 326, y: 184, path: [-12, -8, -24, 2, -10, 8], period: 18 },
  { x: 368, y: 150, path: [-10, 10, -20, -2, -4, -8], period: 14.5 },
  { x: 24, y: 130, path: [12, 6, 20, -8, 6, -10], period: 16.5 },
] as const;

const LANTERNS = [
  { x: 108, base: 163, scale: 1, period: 6.5, offset: 0 },
  { x: 352, base: 170, scale: 1.15, period: 8.2, offset: -3.4 },
];

const MOONFLOWERS = [
  { x: 92, y: 172, h: 10 },
  { x: 98, y: 176, h: 13 },
  { x: 120, y: 174, h: 11 },
  { x: 338, y: 182, h: 12 },
  { x: 366, y: 184, h: 10 },
];

function Lantern({
  x,
  base,
  scale,
  period,
  offset,
  glow,
}: (typeof LANTERNS)[number] & { glow: string }) {
  return (
    <g transform={`translate(${x} ${base}) scale(${scale})`}>
      <rect
        height={17}
        rx={1}
        style={{ fill: ld("#5a5270", "#282030") }}
        width={2}
        x={-1}
        y={-17}
      />
      <rect
        height={2}
        rx={1}
        style={{ fill: ld("#6a6080", "#302840") }}
        width={8}
        x={-4}
        y={-2}
      />
      {/* A flame, so it breathes. */}
      <Glimmer
        style={vars({
          "--glimmer-low": "0.5",
          "--glimmer-period": `${period}s`,
          "--glimmer-offset": `${offset}s`,
        })}
      >
        <circle cx={0} cy={-8} fill={glow} r={18} />
      </Glimmer>
      <rect
        height={10}
        rx={1}
        style={{ fill: ld("#ffd070", "#ffb830") }}
        width={9}
        x={-4.5}
        y={-13}
      />
      <path
        d="M-1.5 -13 L-1.5 -3 M1.5 -13 L1.5 -3 M-4.5 -8 L4.5 -8"
        strokeWidth={0.5}
        style={{ stroke: ld("#7a5a28", "#3e2c0e") }}
      />
      <path
        d="M-5.5 -13 L0 -18.5 L5.5 -13 Z"
        style={{ fill: ld("#5a5070", "#282040") }}
      />
      <circle
        cx={0}
        cy={-19.2}
        r={1}
        style={{ fill: ld("#9a9088", "#5a5048") }}
      />
    </g>
  );
}

export function NightGardenScene({ uid }: { uid: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: ld("#15143a", "#06051a") }} />
          <stop offset="0.6" style={{ stopColor: ld("#3a2e66", "#1a1438") }} />
        </linearGradient>
        <linearGradient id={`${uid}-ground`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: ld("#22203a", "#100e1c") }} />
          <stop offset="1" style={{ stopColor: ld("#141222", "#07060c") }} />
        </linearGradient>
        <radialGradient id={`${uid}-halo`}>
          <stop
            offset="0.25"
            style={{
              stopColor: ld("rgba(220,230,255,0.5)", "rgba(210,222,255,0.35)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(220,230,255,0)", "rgba(210,222,255,0)"),
            }}
          />
        </radialGradient>
        <radialGradient id={`${uid}-milky`}>
          <stop
            offset="0"
            style={{
              stopColor: ld("rgba(200,190,255,0.22)", "rgba(180,170,240,0.16)"),
            }}
          />
          <stop
            offset="1"
            style={{
              stopColor: ld("rgba(200,190,255,0)", "rgba(180,170,240,0)"),
            }}
          />
        </radialGradient>
        <radialGradient id={`${uid}-warm`}>
          <stop offset="0" style={{ stopColor: "rgba(255,196,80,0.55)" }} />
          <stop offset="1" style={{ stopColor: "rgba(255,196,80,0)" }} />
        </radialGradient>
        <radialGradient id={`${uid}-cool`}>
          <stop offset="0" style={{ stopColor: "rgba(100,240,210,0.45)" }} />
          <stop offset="1" style={{ stopColor: "rgba(100,240,210,0)" }} />
        </radialGradient>
        <linearGradient id={`${uid}-trail`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: "rgba(255,255,255,0)" }} />
          <stop offset="1" style={{ stopColor: "rgba(255,255,255,0.95)" }} />
        </linearGradient>
      </defs>

      <rect fill={`url(#${uid}-sky)`} height={200} width={400} />
      <ellipse
        cx={170}
        cy={46}
        fill={`url(#${uid}-milky)`}
        rx={200}
        ry={26}
        transform="rotate(-14 170 46)"
      />

      {TWINKLE.map((t, g) => (
        <Glimmer
          key={t.period}
          style={vars({
            "--glimmer-low": `${t.low}`,
            "--glimmer-period": `${t.period}s`,
            "--glimmer-offset": `${t.offset}s`,
          })}
        >
          {STARS.filter((_, i) => i % 4 === g).map((s) => (
            <circle
              cx={s.cx}
              cy={s.cy}
              key={`${s.cx}-${s.cy}`}
              r={s.r}
              style={{ fill: "rgba(255,255,255,0.92)" }}
            />
          ))}
          {SPARKLES.filter((_, i) => i % 4 === g).map((s) => (
            <path
              d={`M${s.x} ${s.y - s.s} Q${s.x} ${s.y} ${s.x + s.s} ${s.y} Q${s.x} ${s.y} ${s.x} ${s.y + s.s} Q${s.x} ${s.y} ${s.x - s.s} ${s.y} Q${s.x} ${s.y} ${s.x} ${s.y - s.s} Z`}
              key={`${s.x}-${s.y}`}
              style={{ fill: "#fffbe8" }}
            />
          ))}
        </Glimmer>
      ))}

      {/* Now and then, a shooting star */}
      <Shoot
        style={vars({
          "--cross-x": "110px",
          "--cross-y": "36px",
          "--cross-period": "19s",
          "--cross-offset": "-6s",
        })}
      >
        <path
          d="M40 14 L64 21.8"
          strokeLinecap="round"
          strokeWidth={1.2}
          style={{ stroke: `url(#${uid}-trail)` }}
        />
        <circle cx={64} cy={21.8} r={1.1} style={{ fill: "#ffffff" }} />
      </Shoot>

      {/* Moon, with its halo and a few seas */}
      <circle cx={330} cy={52} fill={`url(#${uid}-halo)`} r={40} />
      <circle
        cx={330}
        cy={52}
        r={12}
        style={{ fill: ld("#eef2ff", "#d4ddf4") }}
      />
      <circle
        cx={326}
        cy={48}
        r={3}
        style={{ fill: ld("#d8dff0", "#b8c2dc") }}
      />
      <circle
        cx={334}
        cy={56}
        r={2.2}
        style={{ fill: ld("#d8dff0", "#b8c2dc") }}
      />
      <circle
        cx={335}
        cy={47}
        r={1.3}
        style={{ fill: ld("#d8dff0", "#b8c2dc") }}
      />

      {/* The far hill, with a cottage whose window is still lit */}
      <path
        d="M0 122 Q20 110 44 112 Q62 100 84 108 Q110 114 140 110 Q170 104 204 114 Q240 118 270 108 Q300 100 330 112 Q364 118 400 108 L400 130 L0 130 Z"
        style={{ fill: ld("#2a2450", "#120e26") }}
      />
      {[16, 26, 150, 162, 258, 386].map((x, i) => (
        <circle
          cx={x}
          cy={112 - (i % 2) * 2}
          key={x}
          r={5 + (i % 3)}
          style={{ fill: ld("#221e44", "#0e0b20") }}
        />
      ))}
      <g transform="translate(70 104)">
        <rect
          height={9}
          style={{ fill: ld("#3a3060", "#1a1530") }}
          width={14}
          x={-7}
          y={-9}
        />
        <path
          d="M-9 -9 L0 -16 L9 -9 Z"
          style={{ fill: ld("#302850", "#141028") }}
        />
        <rect
          height={5}
          style={{ fill: ld("#302850", "#141028") }}
          width={2}
          x={3}
          y={-17}
        />
        <Glimmer
          style={vars({
            "--glimmer-low": "0.7",
            "--glimmer-period": "9s",
          })}
        >
          <rect
            height={3}
            style={{ fill: "#ffcf6a" }}
            width={3}
            x={-4}
            y={-6.5}
          />
          <rect
            height={3}
            style={{ fill: "#ffcf6a" }}
            width={3}
            x={1.5}
            y={-6.5}
          />
        </Glimmer>
      </g>

      <rect fill={`url(#${uid}-ground)`} height={78} width={400} y={122} />

      {/* Shrubs along the foot of the hill */}
      {[
        { x: 30, r: 9 },
        { x: 46, r: 6 },
        { x: 178, r: 7 },
        { x: 192, r: 10 },
        { x: 208, r: 6 },
        { x: 336, r: 8 },
        { x: 352, r: 11 },
      ].map((b) => (
        <ellipse
          cx={b.x}
          cy={126}
          key={b.x}
          rx={b.r * 1.3}
          ry={b.r}
          style={{ fill: ld("#1c1a34", "#0b0a16") }}
        />
      ))}

      {/* Pond, holding the moon */}
      <ellipse
        cx={262}
        cy={160}
        rx={46}
        ry={10}
        style={{ fill: ld("#1c2448", "#0a0e22") }}
      />
      <ellipse
        cx={262}
        cy={159}
        rx={42}
        ry={8}
        style={{ fill: ld("#26305c", "#10162e") }}
      />
      <Glimmer
        style={vars({
          "--glimmer-low": "0.35",
          "--glimmer-period": "5s",
        })}
      >
        <ellipse
          cx={292}
          cy={158}
          rx={7}
          ry={1.6}
          style={{ fill: "rgba(230,236,255,0.75)" }}
        />
        <ellipse
          cx={288}
          cy={161}
          rx={4}
          ry={0.8}
          style={{ fill: "rgba(230,236,255,0.5)" }}
        />
      </Glimmer>
      <path
        d="M216 160 Q214 150 212 144 M219 160 Q219 148 221 140 M222 161 Q224 152 228 147 M304 160 Q306 150 309 146 M307 161 Q308 150 307 142"
        fill="none"
        strokeLinecap="round"
        strokeWidth={1}
        style={{ stroke: ld("#34405a", "#1a2230") }}
      />

      {LANTERNS.map((l) => (
        <Lantern glow={`url(#${uid}-warm)`} key={l.x} {...l} />
      ))}

      {MOONFLOWERS.map((f) => (
        <g key={f.x} transform={`translate(${f.x} ${f.y})`}>
          <Daisy color={ld("#f4f0ff", "#d8d4ec")} h={f.h} x={0} />
        </g>
      ))}

      {/* Toadstools that glow of their own accord */}
      <g transform="translate(34 180)">
        <Glimmer
          style={vars({
            "--glimmer-low": "0.45",
            "--glimmer-period": "4.4s",
          })}
        >
          <ellipse cx={3} cy={-7} fill={`url(#${uid}-cool)`} rx={22} ry={13} />
        </Glimmer>
        {[
          { x: -6, h: 6, r: 4 },
          { x: 3, h: 9, r: 5.4 },
          { x: 12, h: 5, r: 3.4 },
        ].map((m) => (
          <g key={m.x}>
            <rect
              height={m.h}
              rx={0.8}
              style={{ fill: ld("#d8e8e4", "#a8c0bc") }}
              width={1.8}
              x={m.x - 0.9}
              y={-m.h}
            />
            <path
              d={`M${m.x - m.r} ${-m.h} Q${m.x} ${-m.h - m.r * 1.3} ${m.x + m.r} ${-m.h} Z`}
              style={{ fill: ld("#6ee8d0", "#50d0b8") }}
            />
            <circle
              cx={m.x - m.r * 0.3}
              cy={-m.h - m.r * 0.4}
              r={0.6}
              style={{ fill: "#e8fff8" }}
            />
          </g>
        ))}
      </g>

      {/* An owl on a bough, keeping watch */}
      <path
        d="M404 66 Q380 68 352 76 M380 69 Q372 62 366 60"
        fill="none"
        strokeLinecap="round"
        strokeWidth={3}
        style={{ stroke: ld("#2a2238", "#120e1a") }}
      />
      {[
        [358, 72],
        [364, 60],
        [352, 78],
      ].map(([x, y]) => (
        <ellipse
          cx={x}
          cy={y}
          key={`${x}-${y}`}
          rx={4}
          ry={2}
          style={{ fill: ld("#243a2e", "#0e1a14") }}
          transform={`rotate(-20 ${x} ${y})`}
        />
      ))}
      <g transform="translate(382 58)">
        <ellipse
          cx={0}
          cy={0}
          rx={6}
          ry={8}
          style={{ fill: ld("#6a5874", "#34283c") }}
        />
        <ellipse
          cx={0}
          cy={2.4}
          rx={3.8}
          ry={5}
          style={{ fill: ld("#8a7890", "#4a3c50") }}
        />
        <path
          d="M-5.4 -5 L-4.6 -10 L-2 -6.6 Z M5.4 -5 L4.6 -10 L2 -6.6 Z"
          style={{ fill: ld("#6a5874", "#34283c") }}
        />
        <Blink
          style={vars({ "--blink-period": "7s", "--blink-offset": "-2s" })}
        >
          <circle cx={-2.3} cy={-3.6} r={2} style={{ fill: "#ffd24a" }} />
          <circle cx={2.3} cy={-3.6} r={2} style={{ fill: "#ffd24a" }} />
          <circle cx={-2.3} cy={-3.6} r={0.9} style={{ fill: "#1a1410" }} />
          <circle cx={2.3} cy={-3.6} r={0.9} style={{ fill: "#1a1410" }} />
        </Blink>
        <path d="M-0.8 -1.6 L0 -0.2 L0.8 -1.6 Z" style={{ fill: "#e0a040" }} />
        <path
          d="M-2 7.6 L-2 9 M2 7.6 L2 9"
          strokeWidth={0.8}
          style={{ stroke: "#e0a040" }}
        />
      </g>

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
            <circle cx={0} cy={0} fill={`url(#${uid}-warm)`} r={4} />
            <circle cx={0} cy={0} r={0.9} style={{ fill: "#ffec9a" }} />
          </Wander>
        </g>
      ))}
    </>
  );
}
