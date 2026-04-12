"use client";

import type { BackgroundId } from "@/lib/bonsai/schema";

interface GardenBackgroundProps {
  backgroundId: BackgroundId;
  tendPos?: { x: number; y: number };
}

function getTendViewBox(tx: number, ty: number): string {
  const cx = (tx / 100) * 400;
  const w = 80;
  const h = 40;
  // With xMidYMid slice in the tend container (~470×172px at 1280px viewport),
  // scale = 470/80 = 5.875px/unit and only ~29 of the 40 viewBox height units
  // are visible (the rest is clipped). Simple centering on cy always maps the
  // tree's background-y to 50% of the container, but in garden view it sits at
  // ty% of the garden. Shift the viewBox so that cy lands at ty% of the container.
  const visibleH = 29; // ≈ container_h / scale = 172 / 5.875
  const y = Math.max(
    0,
    Math.min((ty / 100) * (200 - visibleH) + (visibleH - h) / 2, 200 - h),
  );
  const x = Math.max(0, Math.min(cx - w / 2, 400 - w));
  return `${x} ${y} ${w} ${h}`;
}

// ── Garden ────────────────────────────────────────────────────────────────────

function GardenScene() {
  return (
    <>
      {/* Sky */}
      <rect
        height={115}
        style={{ fill: "light-dark(#a8cce8, #1a2440)" }}
        width={400}
      />
      {/* Ground */}
      <rect
        height={85}
        style={{ fill: "light-dark(#84b850, #1c3010)" }}
        width={400}
        y={115}
      />
      {/* Darker ground horizon strip */}
      <rect
        height={5}
        style={{ fill: "light-dark(#70a03c, #162808)" }}
        width={400}
        y={115}
      />

      {/* Left bush cluster */}
      <ellipse
        cx={75}
        cy={116}
        rx={32}
        ry={15}
        style={{ fill: "light-dark(#5a9a34, #1a3810)" }}
      />
      <ellipse
        cx={90}
        cy={112}
        rx={24}
        ry={13}
        style={{ fill: "light-dark(#6aaa42, #223c14)" }}
      />
      <ellipse
        cx={60}
        cy={113}
        rx={18}
        ry={11}
        style={{ fill: "light-dark(#62a03a, #1e3812)" }}
      />

      {/* Right bush cluster */}
      <ellipse
        cx={330}
        cy={116}
        rx={28}
        ry={14}
        style={{ fill: "light-dark(#5a9a34, #1a3810)" }}
      />
      <ellipse
        cx={318}
        cy={112}
        rx={20}
        ry={12}
        style={{ fill: "light-dark(#6aaa42, #223c14)" }}
      />
      <ellipse
        cx={345}
        cy={114}
        rx={22}
        ry={12}
        style={{ fill: "light-dark(#62a03a, #1e3812)" }}
      />

      {/* Stone path dirt area */}
      <ellipse
        cx={200}
        cy={178}
        rx={58}
        ry={20}
        style={{ fill: "light-dark(#b4a880, #28201a)" }}
      />

      {/* Stepping stones — perspective: smaller near horizon, larger at front */}
      {/* Stone 1 */}
      <ellipse
        cx={200}
        cy={126}
        rx={14}
        ry={6}
        style={{ fill: "light-dark(#c0b490, #30281c)" }}
      />
      <ellipse
        cx={199}
        cy={125}
        rx={11}
        ry={4}
        style={{ fill: "light-dark(#d4c8a4, #3c3224)" }}
      />
      <ellipse
        cx={201}
        cy={127}
        rx={9}
        ry={3}
        style={{ fill: "light-dark(#a8a078, #241e14)" }}
      />
      {/* Stone 2 */}
      <ellipse
        cx={200}
        cy={141}
        rx={17}
        ry={7}
        style={{ fill: "light-dark(#beb290, #2c2418)" }}
      />
      <ellipse
        cx={199}
        cy={140}
        rx={14}
        ry={5}
        style={{ fill: "light-dark(#d2c6a2, #3a3020)" }}
      />
      <ellipse
        cx={200}
        cy={142}
        rx={11}
        ry={3}
        style={{ fill: "light-dark(#a49c78, #221c12)" }}
      />
      {/* Stone 3 */}
      <ellipse
        cx={201}
        cy={157}
        rx={19}
        ry={8}
        style={{ fill: "light-dark(#c0b490, #30281c)" }}
      />
      <ellipse
        cx={200}
        cy={156}
        rx={16}
        ry={6}
        style={{ fill: "light-dark(#d4c8a4, #3c3224)" }}
      />
      <ellipse
        cx={201}
        cy={158}
        rx={13}
        ry={4}
        style={{ fill: "light-dark(#a8a078, #241e14)" }}
      />
      {/* Stone 4 */}
      <ellipse
        cx={199}
        cy={173}
        rx={21}
        ry={9}
        style={{ fill: "light-dark(#bcb08c, #2c2418)" }}
      />
      <ellipse
        cx={198}
        cy={172}
        rx={18}
        ry={7}
        style={{ fill: "light-dark(#d0c4a0, #38301e)" }}
      />
      <ellipse
        cx={200}
        cy={174}
        rx={14}
        ry={4}
        style={{ fill: "light-dark(#a49c78, #221c12)" }}
      />
      {/* Stone 5 */}
      <ellipse
        cx={201}
        cy={191}
        rx={23}
        ry={9}
        style={{ fill: "light-dark(#c0b490, #30281c)" }}
      />
      <ellipse
        cx={200}
        cy={190}
        rx={20}
        ry={7}
        style={{ fill: "light-dark(#d4c8a4, #3c3224)" }}
      />

      {/* Grass tufts — left */}
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={48}
        x2={42}
        y1={121}
        y2={108}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={48}
        x2={50}
        y1={121}
        y2={107}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={48}
        x2={56}
        y1={121}
        y2={110}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={128}
        x2={122}
        y1={122}
        y2={109}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={128}
        x2={130}
        y1={122}
        y2={108}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={128}
        x2={136}
        y1={122}
        y2={111}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={28}
        x2={23}
        y1={145}
        y2={132}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={28}
        x2={30}
        y1={145}
        y2={131}
      />

      {/* Grass tufts — right */}
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={264}
        x2={258}
        y1={121}
        y2={108}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={264}
        x2={266}
        y1={121}
        y2={107}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={264}
        x2={272}
        y1={121}
        y2={110}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={350}
        x2={344}
        y1={122}
        y2={109}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2.5}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={350}
        x2={352}
        y1={122}
        y2={108}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={372}
        x2={367}
        y1={146}
        y2={133}
      />
      <line
        strokeLinecap="round"
        strokeWidth={2}
        style={{ stroke: "light-dark(#4a8a28, #286018)" }}
        x1={372}
        x2={374}
        y1={146}
        y2={132}
      />
    </>
  );
}

// ── Zen Garden ────────────────────────────────────────────────────────────────

const ZEN_RAKE_YS = Array.from({ length: 20 }, (_, i) => 8 + i * 9.5);

function ZenGardenScene() {
  return (
    <>
      {/* Sand */}
      <rect
        height={200}
        style={{ fill: "light-dark(#ede6d0, #262218)" }}
        width={400}
      />

      {/* Raked sand lines */}
      {ZEN_RAKE_YS.map((y) => (
        <line
          key={y}
          strokeWidth={0.8}
          style={{
            stroke: "light-dark(rgba(150,130,80,0.38), rgba(130,110,65,0.55))",
          }}
          x1={0}
          x2={400}
          y1={y}
          y2={y}
        />
      ))}

      {/* Stone A — large, lower-left */}
      <ellipse
        cx={115}
        cy={150}
        rx={30}
        ry={23}
        style={{ fill: "light-dark(#7a7268, #524840)" }}
      />
      <ellipse
        cx={113}
        cy={147}
        rx={23}
        ry={17}
        style={{ fill: "light-dark(#9c9488, #6a6058)" }}
      />
      <ellipse
        cx={111}
        cy={144}
        rx={14}
        ry={10}
        style={{ fill: "light-dark(#aea698, #807870)" }}
      />
      <circle
        cx={120}
        cy={141}
        r={2.5}
        style={{ fill: "light-dark(#6a8850, #3e5c2a)" }}
      />
      <circle
        cx={114}
        cy={137}
        r={1.8}
        style={{ fill: "light-dark(#607840, #334e20)" }}
      />
      <circle
        cx={125}
        cy={145}
        r={1.5}
        style={{ fill: "light-dark(#6a8850, #3e5c2a)" }}
      />

      {/* Concentric raking around stone A */}
      <ellipse
        cx={115}
        cy={150}
        fill="none"
        rx={40}
        ry={31}
        strokeWidth={0.8}
        style={{
          stroke: "light-dark(rgba(140,120,70,0.3), rgba(130,110,65,0.48))",
        }}
      />
      <ellipse
        cx={115}
        cy={150}
        fill="none"
        rx={50}
        ry={39}
        strokeWidth={0.8}
        style={{
          stroke: "light-dark(rgba(140,120,70,0.22), rgba(130,110,65,0.38))",
        }}
      />

      {/* Stone B — medium, upper-right */}
      <ellipse
        cx={288}
        cy={88}
        rx={21}
        ry={17}
        style={{ fill: "light-dark(#7a7268, #524840)" }}
      />
      <ellipse
        cx={286}
        cy={86}
        rx={16}
        ry={12}
        style={{ fill: "light-dark(#9c9488, #6a6058)" }}
      />
      <ellipse
        cx={284}
        cy={84}
        rx={9}
        ry={7}
        style={{ fill: "light-dark(#aea698, #807870)" }}
      />
      <circle
        cx={293}
        cy={82}
        r={2}
        style={{ fill: "light-dark(#6a8850, #3e5c2a)" }}
      />
      <circle
        cx={288}
        cy={79}
        r={1.5}
        style={{ fill: "light-dark(#607840, #334e20)" }}
      />

      {/* Concentric raking around stone B */}
      <ellipse
        cx={288}
        cy={88}
        fill="none"
        rx={30}
        ry={24}
        strokeWidth={0.8}
        style={{
          stroke: "light-dark(rgba(140,120,70,0.3), rgba(130,110,65,0.48))",
        }}
      />
      <ellipse
        cx={288}
        cy={88}
        fill="none"
        rx={40}
        ry={32}
        strokeWidth={0.8}
        style={{
          stroke: "light-dark(rgba(140,120,70,0.22), rgba(130,110,65,0.38))",
        }}
      />

      {/* Stone C — small, center */}
      <ellipse
        cx={196}
        cy={120}
        rx={14}
        ry={11}
        style={{ fill: "light-dark(#7a7268, #524840)" }}
      />
      <ellipse
        cx={194}
        cy={118}
        rx={10}
        ry={7}
        style={{ fill: "light-dark(#9c9488, #6a6058)" }}
      />
      <ellipse
        cx={192}
        cy={117}
        rx={6}
        ry={4}
        style={{ fill: "light-dark(#aea698, #807870)" }}
      />

      {/* Concentric raking around stone C */}
      <ellipse
        cx={196}
        cy={120}
        fill="none"
        rx={22}
        ry={18}
        strokeWidth={0.8}
        style={{
          stroke: "light-dark(rgba(140,120,70,0.3), rgba(130,110,65,0.48))",
        }}
      />
    </>
  );
}

// ── Misty Mountain ────────────────────────────────────────────────────────────

function MistyMountainScene() {
  return (
    <>
      {/* Sky */}
      <rect
        height={200}
        style={{ fill: "light-dark(#c8d8f0, #0c1020)" }}
        width={400}
      />
      {/* Sky brightens toward horizon */}
      <rect
        height={80}
        style={{
          fill: "light-dark(rgba(200,215,235,0.45), rgba(20,32,60,0.5))",
        }}
        width={400}
        y={80}
      />

      {/* Far peaks — pale, washed out */}
      <polygon
        points="40,165 120,50 200,165"
        style={{ fill: "light-dark(#c2cee0, #1e2a40)" }}
      />
      <polygon
        points="150,165 235,36 315,165"
        style={{ fill: "light-dark(#bac8e0, #181e38)" }}
      />
      <polygon
        points="230,165 335,46 400,128 400,165"
        style={{ fill: "light-dark(#becade, #1a2238)" }}
      />

      {/* Snow caps — far peaks */}
      <polygon
        points="120,50 104,84 136,84"
        style={{
          fill: "light-dark(rgba(255,255,255,0.75), rgba(220,230,255,0.5))",
        }}
      />
      <polygon
        points="235,36 218,68 252,70"
        style={{
          fill: "light-dark(rgba(255,255,255,0.75), rgba(220,230,255,0.5))",
        }}
      />
      <polygon
        points="335,46 318,76 352,78"
        style={{
          fill: "light-dark(rgba(255,255,255,0.7), rgba(220,230,255,0.45))",
        }}
      />

      {/* Mid peaks — more defined */}
      <polygon
        points="0,168 72,86 155,168"
        style={{ fill: "light-dark(#98aac0, #141c30)" }}
      />
      <polygon
        points="90,168 180,70 265,168"
        style={{ fill: "light-dark(#8898b8, #101828)" }}
      />
      <polygon
        points="205,168 305,76 395,168"
        style={{ fill: "light-dark(#92a2bc, #12192e)" }}
      />

      {/* Snow caps — mid peaks */}
      <polygon
        points="72,86 57,114 88,115"
        style={{
          fill: "light-dark(rgba(255,255,255,0.8), rgba(220,230,255,0.58))",
        }}
      />
      <polygon
        points="180,70 164,98 196,100"
        style={{
          fill: "light-dark(rgba(255,255,255,0.8), rgba(220,230,255,0.58))",
        }}
      />
      <polygon
        points="305,76 288,105 322,107"
        style={{
          fill: "light-dark(rgba(255,255,255,0.75), rgba(220,230,255,0.52))",
        }}
      />

      {/* Dark valley floor */}
      <rect
        height={40}
        style={{ fill: "light-dark(#6a7a90, #080c18)" }}
        width={400}
        y={160}
      />

      {/* Mist bands */}
      <rect
        height={22}
        style={{
          fill: "light-dark(rgba(218,228,242,0.6), rgba(38,54,96,0.42))",
        }}
        width={400}
        y={148}
      />
      <rect
        height={14}
        style={{
          fill: "light-dark(rgba(218,228,242,0.72), rgba(38,54,96,0.55))",
        }}
        width={400}
        y={158}
      />

      {/* Pine silhouettes on lower slopes */}
      <polygon
        points="35,162 42,130 49,162"
        style={{ fill: "light-dark(#485868, #060a14)" }}
      />
      <polygon
        points="32,157 42,122 52,157"
        style={{ fill: "light-dark(#38485a, #040810)" }}
      />
      <polygon
        points="354,162 361,130 368,162"
        style={{ fill: "light-dark(#485868, #060a14)" }}
      />
      <polygon
        points="351,157 361,122 371,157"
        style={{ fill: "light-dark(#38485a, #040810)" }}
      />
    </>
  );
}

// ── Night Garden ──────────────────────────────────────────────────────────────

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
  { cx: 328, cy: 6, r: 1.6 },
  { cx: 352, cy: 17, r: 1.2 },
  { cx: 373, cy: 29, r: 0.9 },
  { cx: 388, cy: 11, r: 1.3 },
  { cx: 14, cy: 40, r: 0.8 },
  { cx: 78, cy: 44, r: 1.0 },
  { cx: 208, cy: 42, r: 0.9 },
  { cx: 338, cy: 45, r: 1.1 },
  { cx: 175, cy: 51, r: 0.7 },
  { cx: 55, cy: 55, r: 0.9 },
];

function NightGardenScene() {
  return (
    <>
      {/* Night sky */}
      <rect
        height={200}
        style={{ fill: "light-dark(#18162c, #08060e)" }}
        width={400}
      />
      {/* Ground */}
      <rect
        height={72}
        style={{ fill: "light-dark(#1a1612, #0e0c08)" }}
        width={400}
        y={128}
      />
      {/* Ground darkens toward bottom */}
      <rect
        height={40}
        style={{ fill: "light-dark(#141210, #0a0806)" }}
        width={400}
        y={160}
      />

      {/* Stars */}
      {STARS.map((s) => (
        <circle
          cx={s.cx}
          cy={s.cy}
          key={`${s.cx}-${s.cy}`}
          r={s.r}
          style={{
            fill: "light-dark(rgba(255,255,255,0.88), rgba(255,255,255,0.96))",
          }}
        />
      ))}

      {/* Moon — outer glow, mid glow, disk */}
      <circle
        cx={340}
        cy={34}
        r={20}
        style={{
          fill: "light-dark(rgba(200,218,255,0.18), rgba(200,218,255,0.12))",
        }}
      />
      <circle
        cx={340}
        cy={34}
        r={13}
        style={{
          fill: "light-dark(rgba(220,232,255,0.32), rgba(220,232,255,0.2))",
        }}
      />
      <circle
        cx={340}
        cy={34}
        r={8}
        style={{ fill: "light-dark(#e8f0ff, #c8d8ff)" }}
      />

      {/* Sky-ground transition haze */}
      <rect
        height={10}
        style={{
          fill: "light-dark(rgba(35,30,72,0.5), rgba(18,14,38,0.6))",
        }}
        width={400}
        y={124}
      />

      {/* ── Lantern 1 (left, cx≈108, ~⅓ scale, base y=163) ─────────── */}
      {/* Post */}
      <rect
        height={17}
        rx={1}
        style={{ fill: "light-dark(#4a4258, #282030)" }}
        width={2}
        x={107}
        y={146}
      />
      {/* Pedestal */}
      <rect
        height={2}
        rx={1}
        style={{ fill: "light-dark(#5a5068, #302840)" }}
        width={8}
        x={104}
        y={161}
      />
      {/* Glow halo */}
      <ellipse
        cx={108}
        cy={155}
        rx={11}
        ry={8}
        style={{
          fill: "light-dark(rgba(255,190,50,0.18), rgba(255,165,30,0.28))",
        }}
      />
      {/* Lantern body */}
      <rect
        height={10}
        rx={1}
        style={{
          fill: "light-dark(rgba(255,198,62,0.88), rgba(255,178,42,0.92))",
        }}
        width={9}
        x={104}
        y={151}
      />
      {/* Lantern frame */}
      <rect
        fill="none"
        height={10}
        rx={1}
        strokeWidth={0.5}
        style={{ stroke: "light-dark(#7a6030, #503e18)" }}
        width={9}
        x={104}
        y={151}
      />
      {/* Vertical dividers */}
      <line
        strokeWidth={0.5}
        style={{ stroke: "light-dark(#6a5020, #3e2c0e)" }}
        x1={107}
        x2={107}
        y1={151}
        y2={161}
      />
      <line
        strokeWidth={0.5}
        style={{ stroke: "light-dark(#6a5020, #3e2c0e)" }}
        x1={110}
        x2={110}
        y1={151}
        y2={161}
      />
      {/* Horizontal divider */}
      <line
        strokeWidth={0.5}
        style={{ stroke: "light-dark(#6a5020, #3e2c0e)" }}
        x1={104}
        x2={113}
        y1={156}
        y2={156}
      />
      {/* Cap — back face */}
      <polygon
        points="103,151 108,146 113,151"
        style={{ fill: "light-dark(#4a4260, #282040)" }}
      />
      {/* Cap — front face */}
      <polygon
        points="104,151 108,147 112,151"
        style={{ fill: "light-dark(#6a607c, #3e3458)" }}
      />
      {/* Finial */}
      <circle
        cx={108}
        cy={145}
        r={1}
        style={{ fill: "light-dark(#9a9088, #5a5048)" }}
      />

      {/* ── Lantern 2 (right, cx≈282, ~⅓ scale, base y=159) ─────────── */}
      {/* Post */}
      <rect
        height={15}
        rx={1}
        style={{ fill: "light-dark(#4a4258, #282030)" }}
        width={2}
        x={281}
        y={145}
      />
      {/* Pedestal */}
      <rect
        height={2}
        rx={1}
        style={{ fill: "light-dark(#5a5068, #302840)" }}
        width={6}
        x={279}
        y={157}
      />
      {/* Glow halo */}
      <ellipse
        cx={282}
        cy={152}
        rx={9}
        ry={7}
        style={{
          fill: "light-dark(rgba(255,190,50,0.16), rgba(255,165,30,0.25))",
        }}
      />
      {/* Lantern body */}
      <rect
        height={9}
        rx={1}
        style={{
          fill: "light-dark(rgba(255,198,62,0.84), rgba(255,178,42,0.88))",
        }}
        width={8}
        x={278}
        y={148}
      />
      {/* Lantern frame */}
      <rect
        fill="none"
        height={9}
        rx={1}
        strokeWidth={0.5}
        style={{ stroke: "light-dark(#7a6030, #503e18)" }}
        width={8}
        x={278}
        y={148}
      />
      {/* Vertical dividers */}
      <line
        strokeWidth={0.5}
        style={{ stroke: "light-dark(#6a5020, #3e2c0e)" }}
        x1={281}
        x2={281}
        y1={148}
        y2={157}
      />
      <line
        strokeWidth={0.5}
        style={{ stroke: "light-dark(#6a5020, #3e2c0e)" }}
        x1={283}
        x2={283}
        y1={148}
        y2={157}
      />
      {/* Horizontal divider */}
      <line
        strokeWidth={0.5}
        style={{ stroke: "light-dark(#6a5020, #3e2c0e)" }}
        x1={278}
        x2={286}
        y1={153}
        y2={153}
      />
      {/* Cap — back face */}
      <polygon
        points="278,149 282,145 286,149"
        style={{ fill: "light-dark(#4a4260, #282040)" }}
      />
      {/* Cap — front face */}
      <polygon
        points="279,149 282,146 285,149"
        style={{ fill: "light-dark(#6a607c, #3e3458)" }}
      />
      {/* Finial */}
      <circle
        cx={282}
        cy={144}
        r={1}
        style={{ fill: "light-dark(#9a9088, #5a5048)" }}
      />
    </>
  );
}

// ── Autumn Forest ─────────────────────────────────────────────────────────────

const FALLING_LEAVES: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate: number;
}[] = [
  { cx: 88, cy: 58, rx: 5, ry: 3, rotate: 20 },
  { cx: 148, cy: 44, rx: 4, ry: 2.5, rotate: -35 },
  { cx: 202, cy: 54, rx: 5, ry: 3, rotate: 10 },
  { cx: 258, cy: 39, rx: 4, ry: 2.5, rotate: 50 },
  { cx: 318, cy: 64, rx: 5, ry: 3, rotate: -20 },
  { cx: 112, cy: 84, rx: 4, ry: 2.5, rotate: 40 },
  { cx: 178, cy: 74, rx: 3.5, ry: 2, rotate: -15 },
  { cx: 232, cy: 81, rx: 4, ry: 2.5, rotate: 30 },
  { cx: 292, cy: 69, rx: 3.5, ry: 2, rotate: -45 },
  { cx: 342, cy: 57, rx: 4, ry: 2.5, rotate: 15 },
  { cx: 162, cy: 100, rx: 3.5, ry: 2, rotate: -25 },
  { cx: 244, cy: 96, rx: 3, ry: 2, rotate: 35 },
];

function AutumnForestScene() {
  return (
    <>
      {/* Warm amber sky */}
      <rect
        height={200}
        style={{ fill: "light-dark(#e8c870, #1e0e04)" }}
        width={400}
      />
      {/* Sky haze toward horizon */}
      <rect
        height={50}
        style={{
          fill: "light-dark(rgba(205,135,55,0.38), rgba(28,10,2,0.5))",
        }}
        width={400}
        y={80}
      />

      {/* Ground */}
      <rect
        height={70}
        style={{ fill: "light-dark(#a05828, #180804)" }}
        width={400}
        y={130}
      />
      {/* Leaf litter layer */}
      <rect
        height={14}
        style={{
          fill: "light-dark(rgba(175,75,28,0.42), rgba(75,28,6,0.5))",
        }}
        width={400}
        y={136}
      />

      {/* ── Left tree ──────────────────────────────────────────────── */}
      {/* Trunk */}
      <rect
        height={178}
        rx={5}
        style={{ fill: "light-dark(#5a3018, #2e1408)" }}
        width={30}
        x={0}
        y={22}
      />
      {/* Trunk highlight */}
      <rect
        height={178}
        style={{
          fill: "light-dark(rgba(255,165,55,0.13), rgba(120,55,18,0.15))",
        }}
        width={7}
        x={5}
        y={22}
      />
      {/* Left branches */}
      <line
        strokeLinecap="round"
        strokeWidth={14}
        style={{ stroke: "light-dark(#5a3018, #2e1408)" }}
        x1={30}
        x2={88}
        y1={58}
        y2={42}
      />
      <line
        strokeLinecap="round"
        strokeWidth={11}
        style={{ stroke: "light-dark(#5a3018, #2e1408)" }}
        x1={30}
        x2={78}
        y1={88}
        y2={76}
      />
      <line
        strokeLinecap="round"
        strokeWidth={9}
        style={{ stroke: "light-dark(#5a3018, #2e1408)" }}
        x1={30}
        x2={72}
        y1={118}
        y2={110}
      />

      {/* Left canopy — layered ellipses, red/orange/gold */}
      <ellipse
        cx={52}
        cy={50}
        rx={65}
        ry={40}
        style={{ fill: "light-dark(#c05820, #7a1c0a)" }}
      />
      <ellipse
        cx={28}
        cy={38}
        rx={44}
        ry={30}
        style={{ fill: "light-dark(#d06828, #8e2210)" }}
      />
      <ellipse
        cx={72}
        cy={28}
        rx={50}
        ry={32}
        style={{ fill: "light-dark(#e07830, #a83018)" }}
      />
      <ellipse
        cx={44}
        cy={20}
        rx={36}
        ry={24}
        style={{ fill: "light-dark(#d88030, #923618)" }}
      />
      <ellipse
        cx={82}
        cy={14}
        rx={33}
        ry={21}
        style={{ fill: "light-dark(#e88838, #aa4020)" }}
      />

      {/* ── Right tree ─────────────────────────────────────────────── */}
      <rect
        height={178}
        rx={5}
        style={{ fill: "light-dark(#5a3018, #2e1408)" }}
        width={30}
        x={370}
        y={22}
      />
      <rect
        height={178}
        style={{
          fill: "light-dark(rgba(255,165,55,0.10), rgba(120,55,18,0.12))",
        }}
        width={7}
        x={388}
        y={22}
      />
      <line
        strokeLinecap="round"
        strokeWidth={14}
        style={{ stroke: "light-dark(#5a3018, #2e1408)" }}
        x1={370}
        x2={312}
        y1={58}
        y2={42}
      />
      <line
        strokeLinecap="round"
        strokeWidth={11}
        style={{ stroke: "light-dark(#5a3018, #2e1408)" }}
        x1={370}
        x2={322}
        y1={88}
        y2={76}
      />
      <line
        strokeLinecap="round"
        strokeWidth={9}
        style={{ stroke: "light-dark(#5a3018, #2e1408)" }}
        x1={370}
        x2={328}
        y1={118}
        y2={110}
      />

      {/* Right canopy */}
      <ellipse
        cx={348}
        cy={50}
        rx={65}
        ry={40}
        style={{ fill: "light-dark(#c05820, #7a1c0a)" }}
      />
      <ellipse
        cx={372}
        cy={38}
        rx={44}
        ry={30}
        style={{ fill: "light-dark(#d06828, #8e2210)" }}
      />
      <ellipse
        cx={328}
        cy={28}
        rx={50}
        ry={32}
        style={{ fill: "light-dark(#e07830, #a83018)" }}
      />
      <ellipse
        cx={356}
        cy={20}
        rx={36}
        ry={24}
        style={{ fill: "light-dark(#d88030, #923618)" }}
      />
      <ellipse
        cx={318}
        cy={14}
        rx={33}
        ry={21}
        style={{ fill: "light-dark(#e88838, #aa4020)" }}
      />

      {/* Falling leaves */}
      {FALLING_LEAVES.map((leaf) => (
        <ellipse
          cx={leaf.cx}
          cy={leaf.cy}
          key={`${leaf.cx}-${leaf.cy}`}
          rx={leaf.rx}
          ry={leaf.ry}
          style={{ fill: "light-dark(#c84820, #9e2c10)" }}
          transform={`rotate(${leaf.rotate}, ${leaf.cx}, ${leaf.cy})`}
        />
      ))}

      {/* Sun glow upper-left */}
      <circle
        cx={28}
        cy={18}
        r={24}
        style={{
          fill: "light-dark(rgba(255,222,80,0.45), rgba(200,120,20,0.35))",
        }}
      />
      <circle
        cx={28}
        cy={18}
        r={15}
        style={{
          fill: "light-dark(rgba(255,238,120,0.55), rgba(220,140,28,0.45))",
        }}
      />
    </>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function GardenBackground({
  backgroundId,
  tendPos,
}: GardenBackgroundProps) {
  const viewBox = tendPos
    ? getTendViewBox(tendPos.x, tendPos.y)
    : "0 0 400 200";
  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
      viewBox={viewBox}
    >
      {backgroundId === "garden" && <GardenScene />}
      {backgroundId === "zen-garden" && <ZenGardenScene />}
      {backgroundId === "misty-mountain" && <MistyMountainScene />}
      {backgroundId === "night-garden" && <NightGardenScene />}
      {backgroundId === "autumn-forest" && <AutumnForestScene />}
    </svg>
  );
}
