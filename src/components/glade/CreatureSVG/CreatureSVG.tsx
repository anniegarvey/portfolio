import { keyframes, styled } from "next-yak";
import type { CSSProperties, ReactNode } from "react";
import type { SpeciesId } from "@/lib/glade/schema";

// Flat-shape creatures on a shared 64×64 viewBox, in a cohesive palette.
// Each is drawn from its catalog blurb (the wren sings, the mole is up to its
// shoulders in a molehill, the Glimmerwing carries its lantern), with the big
// low-set eyes, catchlights and blush that make a face read as friendly at
// 52px. Anything seen from the side faces right, the way the scene's walk
// loop assumes.
//
// Small parts move on their own (a blink, a wingbeat, a twitch of the tail),
// tagged with `data-part` and animated from the one stylesheet at the bottom,
// so every creature is alive wherever it is shown. All of it stops under
// reduced motion.

const INK = "#2d2a26";
const PINK = "#f48fb1";

/** Pivots a part about a point given in viewBox units. */
function pivot(x: number, y: number, delay = 0): CSSProperties {
  return { transformOrigin: `${x}px ${y}px`, animationDelay: `${delay}s` };
}

function Eye({
  x,
  y,
  r = 2.3,
  fill = INK,
}: {
  x: number;
  y: number;
  r?: number;
  fill?: string;
}) {
  return (
    <g data-part="eye">
      <circle cx={x} cy={y} fill={fill} r={r} />
      <circle cx={x - r * 0.3} cy={y - r * 0.35} fill="#ffffff" r={r * 0.4} />
    </g>
  );
}

/** A contented closed eye: a small downward arc. */
function ClosedEye({
  x,
  y,
  stroke = INK,
}: {
  x: number;
  y: number;
  stroke?: string;
}) {
  return (
    <path
      d={`M${x - 2.2} ${y} Q${x} ${y + 2.4} ${x + 2.2} ${y}`}
      fill="none"
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth="1.5"
    />
  );
}

function Blush({ x, y, fill = PINK }: { x: number; y: number; fill?: string }) {
  return <ellipse cx={x} cy={y} fill={fill} opacity="0.5" rx="2.6" ry="1.6" />;
}

function Smile({
  x,
  y,
  w = 2,
  stroke = INK,
}: {
  x: number;
  y: number;
  w?: number;
  stroke?: string;
}) {
  return (
    <path
      d={`M${x - w} ${y} Q${x} ${y + w} ${x + w} ${y}`}
      fill="none"
      stroke={stroke}
      strokeLinecap="round"
      strokeWidth="1.2"
    />
  );
}

/** A soft halo that swells and settles: three faint rings, so it has no edge. */
function Halo({
  x,
  y,
  r,
  fill,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
}) {
  return (
    <g data-part="glow" fill={fill} opacity="0.5">
      <circle cx={x} cy={y} opacity="0.22" r={r} />
      <circle cx={x} cy={y} opacity="0.26" r={r * 0.78} />
      <circle cx={x} cy={y} opacity="0.3" r={r * 0.56} />
    </g>
  );
}

/** A four-pointed twinkle. */
function Sparkle({
  x,
  y,
  s = 2.5,
  fill = "#ffffff",
  delay = 0,
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
  delay?: number;
}) {
  const k = s * 0.28;
  return (
    <path
      d={`M${x} ${y - s} L${x + k} ${y - k} L${x + s} ${y} L${x + k} ${y + k} L${x} ${y + s} L${x - k} ${y + k} L${x - s} ${y} L${x - k} ${y - k} Z`}
      data-part="sparkle"
      fill={fill}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

/** A quaver drifting up from a singer. */
function Note({
  x,
  y,
  fill,
  delay = 0,
}: {
  x: number;
  y: number;
  fill: string;
  delay?: number;
}) {
  return (
    <g data-part="note" style={{ animationDelay: `${delay}s` }}>
      <ellipse cx={x} cy={y} fill={fill} rx="2" ry="1.5" />
      <path
        d={`M${x + 1.6} ${y} V${y - 7} L${x + 5} ${y - 5.5}`}
        fill="none"
        stroke={fill}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      />
    </g>
  );
}

/** Mirrors its children left-to-right across the middle of the viewBox. */
function Mirror({ children }: { children: ReactNode }) {
  return <g transform="translate(64 0) scale(-1 1)">{children}</g>;
}

// ─── Everyday creatures ───────────────────────────────────────────────────────

/** A plump songbird, mid-tune. */
function Robin() {
  return (
    <>
      <Note delay={0} fill="#e8694a" x={50} y={18} />
      <path d="M44 42 L57 37 L55 47 Z" fill="#6d4c41" />
      <circle cx="31" cy="37" fill="#9a7b6b" r="16" />
      <ellipse cx="31" cy="48" fill="#f3e9dc" rx="9" ry="5.5" />
      {/* The red runs from the breast up over the face */}
      <path
        d="M21 32 Q22 26 30 26 Q38 26 39 32 Q41 42 30 46 Q19 42 21 32 Z"
        fill="#e8694a"
      />
      <path d="M41 33 Q52 38 45 50 Q38 47 39 37 Z" fill="#7a5d50" />
      <Eye x={25.5} y={31} />
      <Eye x={34.5} y={31} />
      <path d="M27.5 34 L32.5 34 L30 38 Z" fill="#f2a541" />
      <Blush fill="#ffb199" x={22.5} y={35} />
      <Blush fill="#ffb199" x={37.5} y={35} />
      <path
        d="M27 53 V57 M25 57 H29 M35 53 V57 M33 57 H37"
        fill="none"
        stroke="#c98a3c"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </>
  );
}

/** A soft, round grazer with a clover it found. */
function Rabbit() {
  return (
    <>
      <g data-part="ear" style={pivot(26, 26)}>
        <ellipse
          cx="24"
          cy="15"
          fill="#d7ccc8"
          rx="4.6"
          ry="12"
          transform="rotate(-8 24 15)"
        />
        <ellipse
          cx="24"
          cy="16"
          fill="#f8bbd0"
          rx="2.2"
          ry="8.5"
          transform="rotate(-8 24 16)"
        />
      </g>
      <g data-part="ear" style={pivot(38, 26, -1.3)}>
        <ellipse
          cx="40"
          cy="15"
          fill="#d7ccc8"
          rx="4.6"
          ry="12"
          transform="rotate(8 40 15)"
        />
        <ellipse
          cx="40"
          cy="16"
          fill="#f8bbd0"
          rx="2.2"
          ry="8.5"
          transform="rotate(8 40 16)"
        />
      </g>
      <circle cx="46" cy="51" fill="#ffffff" r="5" />
      <ellipse cx="32" cy="48" fill="#d7ccc8" rx="14" ry="10.5" />
      <ellipse cx="32" cy="50" fill="#efe8e4" rx="7" ry="7" />
      <ellipse cx="32" cy="32" fill="#d7ccc8" rx="12.5" ry="10.5" />
      <ellipse cx="27.5" cy="36.5" fill="#efe8e4" rx="4.5" ry="3.4" />
      <ellipse cx="36.5" cy="36.5" fill="#efe8e4" rx="4.5" ry="3.4" />
      <Eye x={26} y={31} />
      <Eye x={38} y={31} />
      <path d="M30.6 34 L33.4 34 L32 35.8 Z" fill="#f48fb1" />
      <Blush x={22.5} y={35.5} />
      <Blush x={41.5} y={35.5} />
      {/* Clover */}
      <path
        d="M32 38 Q33 42 36 44"
        fill="none"
        stroke="#5f9a4a"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <circle cx="36" cy="43.4" fill="#7cc060" r="1.8" />
      <circle cx="38.4" cy="45" fill="#7cc060" r="1.8" />
      <circle cx="35.6" cy="46" fill="#7cc060" r="1.8" />
      <ellipse cx="25" cy="57.5" fill="#c4b6b1" rx="5" ry="2.4" />
      <ellipse cx="39" cy="57.5" fill="#c4b6b1" rx="5" ry="2.4" />
    </>
  );
}

/** A hoarder with a great plume of a tail and an acorn to share. */
function Squirrel() {
  return (
    <>
      <g data-part="tail" style={pivot(40, 54)}>
        <path
          d="M38 55 Q60 56 59 32 Q58 13 45 13 Q36 14 38 24 Q44 21 47 28 Q50 40 37 49 Z"
          fill="#a1593b"
        />
        <path
          d="M53 46 Q57 34 53 22 Q50 16 45 17"
          fill="none"
          stroke="#c98560"
          strokeLinecap="round"
          strokeWidth="2.6"
        />
      </g>
      <ellipse cx="29" cy="47" fill="#bf6b48" rx="11.5" ry="10.5" />
      <ellipse cx="29" cy="49" fill="#f3dcb8" rx="6.5" ry="7.5" />
      <path d="M20 23 L19 12 L27 19 Z" fill="#a1593b" />
      <path d="M38 23 L39 12 L31 19 Z" fill="#a1593b" />
      <circle cx="29" cy="29" fill="#bf6b48" r="10.5" />
      <ellipse cx="24.5" cy="33" fill="#d98f6c" rx="4.5" ry="3.6" />
      <ellipse cx="33.5" cy="33" fill="#d98f6c" rx="4.5" ry="3.6" />
      <Eye x={24.5} y={28} />
      <Eye x={33.5} y={28} />
      <ellipse cx="29" cy="31.6" fill="#5d3a2a" rx="1.5" ry="1.1" />
      <Blush x={21.5} y={32.5} />
      <Blush x={36.5} y={32.5} />
      {/* Acorn, held in both paws */}
      <ellipse cx="29" cy="45" fill="#d9a55c" rx="3.4" ry="4" />
      <path d="M25 43.5 Q29 38.5 33 43.5 Z" fill="#7a5230" />
      <path d="M29 40 V38.4" stroke="#7a5230" strokeLinecap="round" />
      <ellipse cx="24.5" cy="45.5" fill="#a1593b" rx="2.4" ry="1.8" />
      <ellipse cx="33.5" cy="45.5" fill="#a1593b" rx="2.4" ry="1.8" />
      <ellipse cx="24" cy="57.5" fill="#a1593b" rx="4.4" ry="2.2" />
      <ellipse cx="34" cy="57.5" fill="#a1593b" rx="4.4" ry="2.2" />
    </>
  );
}

/** All prickles behind, all softness in front. */
function Hedgehog() {
  return (
    <>
      <path
        d="M9 50 L5 41 L11 42 L8 32 L15 35 L15 25 L22 30 L25 20 L31 27 L36 19 L40 28 L46 23 L46 33 Q48 44 44 52 Z"
        fill="#5a4334"
      />
      <path
        d="M11 51 Q9 31 29 29 Q46 29 47 46 Q47 54 30 55 Q13 55 11 51 Z"
        fill="#7a5c48"
      />
      <path
        d="M16 44 L18 39 M22 47 L24 42 M21 37 L24 33 M28 42 L30 37 M29 34 L32 31 M34 46 L36 41 M36 37 L39 34 M15 50 L17 46 M28 50 L30 46"
        fill="none"
        stroke="#b8977a"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
      <ellipse cx="30" cy="54" fill="#ecd3b4" rx="14" ry="3.4" />
      <circle cx="40" cy="38" fill="#d9b896" r="3.4" />
      <circle cx="40.4" cy="38.4" fill="#f0c4b4" r="1.7" />
      <ellipse cx="47" cy="45.5" fill="#ecd3b4" rx="10" ry="8.5" />
      <ellipse cx="55" cy="47.5" fill="#ecd3b4" rx="5.4" ry="3.8" />
      <circle cx="59.4" cy="46.6" fill="#3a2c21" r="1.9" />
      <Eye x={49} y={42.5} />
      <Smile w={1.8} x={54} y={49.6} />
      <Blush x={45.5} y={48} />
      <ellipse cx="22" cy="57" fill="#c9a882" rx="3.4" ry="2" />
      <ellipse cx="40" cy="57" fill="#c9a882" rx="3.4" ry="2" />
    </>
  );
}

/** Big ears, bright eyes, and a seed it spotted first. */
function Mouse() {
  return (
    <>
      <path
        d="M42 52 Q54 52 54 42 Q54 36 49 37"
        data-part="tail"
        fill="none"
        stroke="#d9a5a8"
        strokeLinecap="round"
        strokeWidth="2.2"
        style={pivot(42, 52)}
      />
      <g data-part="ear" style={pivot(25, 28)}>
        <circle cx="21" cy="23" fill="#9e9089" r="8" />
        <circle cx="21" cy="23" fill="#f8bbd0" r="5" />
      </g>
      <g data-part="ear" style={pivot(39, 28, -0.8)}>
        <circle cx="43" cy="23" fill="#9e9089" r="8" />
        <circle cx="43" cy="23" fill="#f8bbd0" r="5" />
      </g>
      <ellipse cx="32" cy="48" fill="#b0a49c" rx="11.5" ry="9" />
      <ellipse cx="32" cy="50" fill="#e6dfd9" rx="6.5" ry="6.5" />
      <ellipse cx="32" cy="33" fill="#b0a49c" rx="11" ry="9.5" />
      <Eye r={2.5} x={27} y={32} />
      <Eye r={2.5} x={37} y={32} />
      <circle cx="32" cy="36.4" fill="#f48fb1" r="1.6" />
      <path
        d="M28 37 L21 36 M28 38.4 L22 40.4 M36 37 L43 36 M36 38.4 L42 40.4"
        fill="none"
        stroke="#8a7f78"
        strokeLinecap="round"
        strokeWidth="0.8"
      />
      <Blush x={23.5} y={36.5} />
      <Blush x={40.5} y={36.5} />
      {/* Sunflower seed */}
      <path
        d="M32 42 Q35.4 46 32 50.4 Q28.6 46 32 42 Z"
        fill="#f1e3c0"
        stroke="#6d5a48"
        strokeWidth="0.9"
      />
      <ellipse cx="27.6" cy="47" fill="#9e9089" rx="2.2" ry="1.7" />
      <ellipse cx="36.4" cy="47" fill="#9e9089" rx="2.2" ry="1.7" />
      <ellipse cx="27" cy="57" fill="#d9a5a8" rx="3.4" ry="1.9" />
      <ellipse cx="37" cy="57" fill="#d9a5a8" rx="3.4" ry="1.9" />
    </>
  );
}

/** Pocket-sized, tail cocked, singing far above its weight. */
function Wren() {
  return (
    <>
      <Note delay={0} fill="#8a6a4f" x={54} y={17} />
      <Note delay={-1.4} fill="#c08a52" x={47} y={10} />
      <g data-part="tail" style={pivot(22, 38)}>
        <path d="M24 36 L9 19 L16 19 L28 31 Z" fill="#8a6a4f" />
        <path
          d="M14 22 L17 21 M17.5 26 L20.5 24.6 M21 30 L24 28.4"
          fill="none"
          stroke="#5f4632"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </g>
      <circle cx="31" cy="42" fill="#a8845f" r="13" />
      <ellipse cx="35" cy="46" fill="#ecd9bf" rx="8" ry="7.5" />
      <path d="M20 38 Q28 32 35 41 Q29 50 21 46 Z" fill="#8a6a4f" />
      <path
        d="M24 39 L26 43 M28 39.4 L29.6 43.6"
        fill="none"
        stroke="#5f4632"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <circle cx="39" cy="31" fill="#a8845f" r="9.5" />
      <path
        d="M33 27.4 Q39 24.4 46 27.6"
        fill="none"
        stroke="#ecd9bf"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <Eye x={41.5} y={30.5} />
      {/* Beak thrown wide open */}
      <path d="M47 28 L57 24 L49 32 Z" fill="#6d5444" />
      <path d="M47.4 32 L55 36 L46 35 Z" fill="#6d5444" />
      <path d="M48.6 31.4 L53 29.4 L52 33.4 Z" fill="#f29a9a" />
      <Blush fill="#f2a58a" x={38.5} y={35} />
      <path
        d="M29 54 V58 M27 58 H31 M36 54 V58 M34 58 H38"
        fill="none"
        stroke="#6d5444"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </>
  );
}

/** Up to its shoulders in a fresh molehill, velvet and unbothered. */
function Mole() {
  return (
    <>
      <ellipse cx="32" cy="54" fill="#7a5c44" rx="25" ry="7" />
      <path d="M17 56 Q15 25 32 25 Q49 25 47 56 Z" fill="#4f443c" />
      <path
        d="M22 36 Q25 28.5 33 28"
        fill="none"
        opacity="0.6"
        stroke="#8a7a6e"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <ellipse cx="32" cy="42" fill="#6a5d53" rx="7" ry="5.4" />
      <path
        d="M26 42 L20 41 M26 43.6 L21 45.4 M38 42 L44 41 M38 43.6 L43 45.4"
        fill="none"
        stroke="#9a8c80"
        strokeLinecap="round"
        strokeWidth="0.8"
      />
      <circle cx="32" cy="40.4" fill="#f29ca0" r="2.8" />
      <circle cx="31.2" cy="39.6" fill="#ffd3d3" r="0.9" />
      <Eye r={1.5} x={25} y={36} />
      <Eye r={1.5} x={39} y={36} />
      <Smile stroke="#2d2622" w={1.8} x={32} y={44.6} />
      <Blush x={23.5} y={40.5} />
      <Blush x={40.5} y={40.5} />
      {/* Fresh earth, with the digging paws resting on it */}
      <path d="M5 60 Q12 47 22 54 Q32 50 42 54 Q52 47 59 60 Z" fill="#8d6b4f" />
      <circle cx="12" cy="50" fill="#8d6b4f" r="1.6" />
      <circle cx="54" cy="51" fill="#8d6b4f" r="1.3" />
      <ellipse cx="19" cy="52" fill="#f2a9a5" rx="6" ry="4" />
      <ellipse cx="45" cy="52" fill="#f2a9a5" rx="6" ry="4" />
      <path
        d="M15 51 L14 54.6 M19 51.6 L19 55.4 M23 51 L24 54.6 M41 51 L40 54.6 M45 51.6 L45 55.4 M49 51 L50 54.6"
        fill="none"
        stroke="#d98782"
        strokeLinecap="round"
        strokeWidth="1"
      />
    </>
  );
}

/** Sitting neatly, tail wrapped round, missing nothing. */
function Fox() {
  return (
    <>
      <g data-part="tail" style={pivot(42, 54)}>
        <path
          d="M40 56 Q61 58 59 38 Q57 28 49 31 Q53 43 39 49 Z"
          fill="#d96c3a"
        />
        <path d="M59 38 Q57 28 49 31 Q50.4 36.4 55 41 Z" fill="#fff5ea" />
      </g>
      <path d="M21 57 Q19 38 32 38 Q45 38 43 57 Z" fill="#d96c3a" />
      <path
        d="M26.4 45 Q32 40.4 37.6 45 Q38 54.6 32 56 Q26 54.6 26.4 45 Z"
        fill="#fff5ea"
      />
      <g data-part="ear" style={pivot(22, 22)}>
        <path d="M16 27 L14 9 L28 19 Z" fill="#d96c3a" />
        <path d="M17.6 22 L16.6 13 L23.4 18 Z" fill="#5d3a2a" />
      </g>
      <g data-part="ear" style={pivot(42, 22, -1.7)}>
        <path d="M48 27 L50 9 L36 19 Z" fill="#d96c3a" />
        <path d="M46.4 22 L47.4 13 L40.6 18 Z" fill="#5d3a2a" />
      </g>
      <path
        d="M17 27 Q18 17 32 17 Q46 17 47 27 Q47 33 39 38 Q32 42 25 38 Q17 33 17 27 Z"
        fill="#d96c3a"
      />
      <path
        d="M17 28 Q23 31 28 30 Q32 29 32 33 Q32 29 36 30 Q41 31 47 28 Q47 33 39 38 Q32 42 25 38 Q17 33 17 28 Z"
        fill="#fff5ea"
      />
      <Eye x={25.5} y={26.5} />
      <Eye x={38.5} y={26.5} />
      <ellipse cx="32" cy="34" fill={INK} rx="2" ry="1.4" />
      <Smile w={1.8} x={32} y={36.4} />
      <Blush fill="#ff9d8a" x={21.5} y={32} />
      <Blush fill="#ff9d8a" x={42.5} y={32} />
      <ellipse cx="27" cy="57.5" fill="#5d3a2a" rx="3.6" ry="2.1" />
      <ellipse cx="37" cy="57.5" fill="#5d3a2a" rx="3.6" ry="2.1" />
    </>
  );
}

/** A dappled young stag, calm as the meadow, a daisy tucked behind one ear. */
function Deer() {
  return (
    <>
      <path
        d="M25 19 Q22 11 16 9 M22.4 13.4 Q23 9 27 6.4 M39 19 Q42 11 48 9 M41.6 13.4 Q41 9 37 6.4"
        fill="none"
        stroke="#8a6f55"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <g data-part="ear" style={pivot(22, 25)}>
        <ellipse
          cx="15"
          cy="23"
          fill="#c19a6b"
          rx="6.6"
          ry="3.4"
          transform="rotate(-22 15 23)"
        />
        <ellipse
          cx="15.4"
          cy="23.2"
          fill="#f0cfc0"
          rx="4"
          ry="1.7"
          transform="rotate(-22 15.4 23.2)"
        />
      </g>
      <g data-part="ear" style={pivot(42, 25, -2.1)}>
        <ellipse
          cx="49"
          cy="23"
          fill="#c19a6b"
          rx="6.6"
          ry="3.4"
          transform="rotate(22 49 23)"
        />
        <ellipse
          cx="48.6"
          cy="23.2"
          fill="#f0cfc0"
          rx="4"
          ry="1.7"
          transform="rotate(22 48.6 23.2)"
        />
      </g>
      <ellipse cx="32" cy="49" fill="#c19a6b" rx="13" ry="9.5" />
      <ellipse cx="32" cy="52" fill="#f1e2cc" rx="6" ry="6" />
      <circle cx="22.6" cy="46" fill="#fff8ec" r="1.5" />
      <circle cx="41.4" cy="45.4" fill="#fff8ec" r="1.5" />
      <circle cx="43" cy="51" fill="#fff8ec" r="1.2" />
      <circle cx="21" cy="51.4" fill="#fff8ec" r="1.2" />
      <ellipse cx="32" cy="28" fill="#c19a6b" rx="11" ry="10.5" />
      <ellipse cx="32" cy="34" fill="#f1e2cc" rx="6.6" ry="5" />
      <circle cx="29" cy="20.4" fill="#fff8ec" r="1" />
      <circle cx="34.6" cy="19.6" fill="#fff8ec" r="1" />
      <Eye r={2.5} x={25.5} y={27.5} />
      <Eye r={2.5} x={38.5} y={27.5} />
      <path
        d="M22.6 25.6 L21 24.4 M41.4 25.6 L43 24.4"
        fill="none"
        stroke={INK}
        strokeLinecap="round"
        strokeWidth="1"
      />
      <ellipse cx="32" cy="32.6" fill="#5d4a38" rx="2.1" ry="1.5" />
      <Smile stroke="#5d4a38" w={1.6} x={32} y={35.4} />
      <Blush x={23} y={32.4} />
      <Blush x={41} y={32.4} />
      {/* Daisy */}
      <g fill="#ffffff">
        <circle cx="44" cy="17.4" r="1.7" />
        <circle cx="47.2" cy="18.6" r="1.7" />
        <circle cx="46.8" cy="22" r="1.7" />
        <circle cx="43.4" cy="21.4" r="1.7" />
      </g>
      <circle cx="45.4" cy="19.8" fill="#f2c94c" r="1.5" />
      <ellipse cx="26" cy="58" fill="#8a6f55" rx="3" ry="1.9" />
      <ellipse cx="38" cy="58" fill="#8a6f55" rx="3" ry="1.9" />
    </>
  );
}

/** Round, unblinking and very well read, with a star for company. */
function Owl() {
  return (
    <>
      <Sparkle delay={-0.6} fill="#f6d77a" s={3} x={53} y={14} />
      <path d="M19 26 L18 13 L28 20 Z" fill="#6b5746" />
      <path d="M45 26 L46 13 L36 20 Z" fill="#6b5746" />
      <ellipse cx="32" cy="39" fill="#7d6754" rx="16" ry="18" />
      <path d="M17 36 Q12 46 19 54 Q22 46 21 37 Z" fill="#6b5746" />
      <path d="M47 36 Q52 46 45 54 Q42 46 43 37 Z" fill="#6b5746" />
      <ellipse cx="32" cy="46" fill="#b89c7e" rx="9.5" ry="9.5" />
      <path
        d="M26 42 Q27.5 44.4 29 42 M32 42 Q33.5 44.4 35 42 M29 47 Q30.5 49.4 32 47 M35 47 Q36.5 49.4 38 47 M26.4 51.6 Q28 54 29.4 51.6 M32.6 51.6 Q34 54 35.6 51.6"
        fill="none"
        stroke="#7d6754"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      {/* Heart-shaped face disc */}
      <path
        d="M32 39 Q20 40 19 31 Q19 23 26 23 Q30 23 32 26 Q34 23 38 23 Q45 23 45 31 Q44 40 32 39 Z"
        fill="#f3e5cf"
      />
      <g data-part="eye">
        <circle cx="26" cy="30.4" fill="#f2b632" r="5" />
        <circle cx="26" cy="30.4" fill={INK} r="3" />
        <circle cx="25" cy="29.2" fill="#ffffff" r="1.2" />
      </g>
      <g data-part="eye">
        <circle cx="38" cy="30.4" fill="#f2b632" r="5" />
        <circle cx="38" cy="30.4" fill={INK} r="3" />
        <circle cx="37" cy="29.2" fill="#ffffff" r="1.2" />
      </g>
      <path d="M30 33.6 L34 33.6 L32 37.6 Z" fill="#f2a541" />
      <path
        d="M27 56.4 V58.4 M29.4 56.4 V58.4 M34.6 56.4 V58.4 M37 56.4 V58.4"
        fill="none"
        stroke="#f2a541"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </>
  );
}

/** Broad, low and striped, with earth still on its claws and a find to show. */
function Badger() {
  return (
    <>
      <ellipse cx="32" cy="48" fill="#6b6f75" rx="17" ry="10.5" />
      <ellipse cx="32" cy="51" fill="#4a4d52" rx="8.5" ry="6.5" />
      <circle cx="19.6" cy="20.4" fill="#3a3c40" r="4" />
      <circle cx="44.4" cy="20.4" fill="#3a3c40" r="4" />
      <circle cx="19.6" cy="20.6" fill="#f4f4f2" r="1.8" />
      <circle cx="44.4" cy="20.6" fill="#f4f4f2" r="1.8" />
      <path
        d="M18 30 Q18 18 32 18 Q46 18 46 30 Q46 37 38 40 Q32 42.4 26 40 Q18 37 18 30 Z"
        fill="#f4f4f2"
      />
      <path
        d="M21.4 21 Q25 18.4 28.4 19 Q29 27 29.6 34.6 Q26.4 39 21.6 37 Q18.6 30 21.4 21 Z"
        fill="#3a3c40"
      />
      <path
        d="M42.6 21 Q39 18.4 35.6 19 Q35 27 34.4 34.6 Q37.6 39 42.4 37 Q45.4 30 42.6 21 Z"
        fill="#3a3c40"
      />
      <g data-part="eye">
        <circle cx="25" cy="29.4" fill="#17181a" r="2.4" />
        <circle cx="24.2" cy="28.5" fill="#ffffff" r="1" />
      </g>
      <g data-part="eye">
        <circle cx="39" cy="29.4" fill="#17181a" r="2.4" />
        <circle cx="38.2" cy="28.5" fill="#ffffff" r="1" />
      </g>
      <ellipse cx="32" cy="35.6" fill={INK} rx="2.6" ry="1.9" />
      <Smile w={1.8} x={32} y={38.4} />
      <Blush x={21} y={35.4} />
      <Blush x={43} y={35.4} />
      {/* A truffle it dug up */}
      <circle cx="32" cy="50" fill="#8a5a3c" r="3.6" />
      <circle cx="30.8" cy="48.8" fill="#b07d58" r="1" />
      <ellipse cx="26" cy="50.6" fill="#3a3c40" rx="3" ry="2.2" />
      <ellipse cx="38" cy="50.6" fill="#3a3c40" rx="3" ry="2.2" />
      <ellipse cx="23" cy="57.6" fill="#3a3c40" rx="5" ry="2.4" />
      <ellipse cx="41" cy="57.6" fill="#3a3c40" rx="5" ry="2.4" />
      <path
        d="M19.6 58.6 V60.4 M23 59 V60.8 M26.4 58.6 V60.4 M37.6 58.6 V60.4 M41 59 V60.8 M44.4 58.6 V60.4"
        fill="none"
        stroke="#e6e6e2"
        strokeLinecap="round"
        strokeWidth="1"
      />
    </>
  );
}

/** Upright on the bank, clutching a favourite shell. */
function Otter() {
  return (
    <>
      <path
        d="M41 55 Q57 57 57 43 Q56 36 51 38 Q52 46 40 50 Z"
        data-part="tail"
        fill="#6d4c33"
        style={pivot(41, 54)}
      />
      <ellipse cx="32" cy="46" fill="#7d5a3e" rx="12" ry="12.5" />
      <ellipse cx="32" cy="48.5" fill="#e3ccae" rx="7.5" ry="8.5" />
      <circle cx="23" cy="20.4" fill="#6d4c33" r="3" />
      <circle cx="41" cy="20.4" fill="#6d4c33" r="3" />
      <ellipse cx="32" cy="27" fill="#7d5a3e" rx="11.5" ry="10" />
      <ellipse cx="32" cy="31.4" fill="#e3ccae" rx="7.4" ry="5.4" />
      <Eye x={26} y={25.5} />
      <Eye x={38} y={25.5} />
      <ellipse cx="32" cy="29.6" fill="#3a2c21" rx="2.2" ry="1.5" />
      <path
        d="M32 31 V32.4 M32 32.4 Q30 34.4 28.4 32.6 M32 32.4 Q34 34.4 35.6 32.6"
        fill="none"
        stroke="#3a2c21"
        strokeLinecap="round"
        strokeWidth="1"
      />
      <path
        d="M25 31.4 L19 30.4 M25 33 L20 34.6 M39 31.4 L45 30.4 M39 33 L44 34.6"
        fill="none"
        stroke="#f1e2cc"
        strokeLinecap="round"
        strokeWidth="0.8"
      />
      <Blush x={22.6} y={30.4} />
      <Blush x={41.4} y={30.4} />
      {/* Scallop shell */}
      <path
        d="M26.4 42 Q32 35.6 37.6 42 Q36 47.6 32 48 Q28 47.6 26.4 42 Z"
        fill="#f7b7c4"
      />
      <path
        d="M32 47 V39.6 M32 47 L28.6 41 M32 47 L35.4 41"
        fill="none"
        stroke="#e28a9e"
        strokeLinecap="round"
        strokeWidth="0.9"
      />
      <ellipse cx="26" cy="44.6" fill="#6d4c33" rx="2.6" ry="2" />
      <ellipse cx="38" cy="44.6" fill="#6d4c33" rx="2.6" ry="2" />
      <ellipse cx="26" cy="58" fill="#6d4c33" rx="4.4" ry="2.1" />
      <ellipse cx="38" cy="58" fill="#6d4c33" rx="4.4" ry="2.1" />
    </>
  );
}

/** All ears and long legs, half a second from being somewhere else. */
function Hare() {
  return (
    <>
      <g data-part="ear" style={pivot(27, 24)}>
        <ellipse
          cx="24"
          cy="13"
          fill="#c9a876"
          rx="3.8"
          ry="12.5"
          transform="rotate(-10 24 13)"
        />
        <ellipse
          cx="24.2"
          cy="14.6"
          fill="#f0cfc0"
          rx="1.7"
          ry="8"
          transform="rotate(-10 24.2 14.6)"
        />
        <ellipse
          cx="22.4"
          cy="3.4"
          fill="#4a3a2c"
          rx="2.4"
          ry="2.6"
          transform="rotate(-10 22.4 3.4)"
        />
      </g>
      <g data-part="ear" style={pivot(37, 24, -0.9)}>
        <ellipse
          cx="40"
          cy="13"
          fill="#c9a876"
          rx="3.8"
          ry="12.5"
          transform="rotate(10 40 13)"
        />
        <ellipse
          cx="39.8"
          cy="14.6"
          fill="#f0cfc0"
          rx="1.7"
          ry="8"
          transform="rotate(10 39.8 14.6)"
        />
        <ellipse
          cx="41.6"
          cy="3.4"
          fill="#4a3a2c"
          rx="2.4"
          ry="2.6"
          transform="rotate(10 41.6 3.4)"
        />
      </g>
      <circle cx="43.6" cy="52" fill="#fff8ec" r="3.4" />
      <path d="M22 56 Q20 38 32 38 Q44 38 42 56 Z" fill="#b8905c" />
      <ellipse cx="32" cy="49" fill="#f1e2cc" rx="5.6" ry="7.5" />
      <path
        d="M41 44 Q45 50 41 56"
        fill="none"
        stroke="#8a6a4f"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <ellipse cx="32" cy="30.5" fill="#c9a876" rx="9.5" ry="9.5" />
      <ellipse cx="32" cy="35" fill="#f1e2cc" rx="5" ry="3.6" />
      <Eye r={2.6} x={26} y={29} />
      <Eye r={2.6} x={38} y={29} />
      <path d="M30.6 33 L33.4 33 L32 34.8 Z" fill="#8a6a4f" />
      <Smile stroke="#8a6a4f" w={1.5} x={32} y={35.6} />
      <Blush x={23.6} y={33.6} />
      <Blush x={40.4} y={33.6} />
      <ellipse cx="25" cy="58.4" fill="#a87f4e" rx="6.4" ry="2.1" />
      <ellipse cx="39" cy="58.4" fill="#a87f4e" rx="6.4" ry="2.1" />
    </>
  );
}

// ─── Fantastical creatures ────────────────────────────────────────────────────

/** A cat-shaped loaf of moss with a little herb garden down its spine. */
function Mosskit() {
  return (
    <>
      <g data-part="tail" style={pivot(15, 46)}>
        <path
          d="M16 49 Q3 44 6 29 Q7.6 23 12 26 Q10 37 19 42 Z"
          fill="#6a8f4e"
        />
        <ellipse
          cx="9"
          cy="22.6"
          fill="#a3d07c"
          rx="2"
          ry="3.6"
          transform="rotate(-24 9 22.6)"
        />
      </g>
      <ellipse cx="29" cy="47" fill="#7a9b5c" rx="17" ry="10" />
      {/* Herbs along the spine: mint, thyme in flower, a chive */}
      <g data-part="sway" style={pivot(18, 39)}>
        <path
          d="M18 40 V30"
          stroke="#4f7a36"
          strokeLinecap="round"
          strokeWidth="1.3"
        />
        <ellipse
          cx="15.6"
          cy="33"
          fill="#9fd07a"
          rx="2.6"
          ry="1.5"
          transform="rotate(30 15.6 33)"
        />
        <ellipse
          cx="20.4"
          cy="31"
          fill="#9fd07a"
          rx="2.6"
          ry="1.5"
          transform="rotate(-30 20.4 31)"
        />
        <ellipse cx="18" cy="28.6" fill="#b6e090" rx="1.6" ry="2.4" />
      </g>
      <g data-part="sway" style={pivot(25, 38, -1.2)}>
        <path
          d="M25 38 V27"
          stroke="#4f7a36"
          strokeLinecap="round"
          strokeWidth="1.3"
        />
        <circle cx="25" cy="25.6" fill="#f3a6cf" r="2.2" />
        <circle cx="22.8" cy="28.6" fill="#f3a6cf" r="1.5" />
        <circle cx="27.2" cy="29.4" fill="#f3a6cf" r="1.5" />
        <circle cx="25" cy="25.6" fill="#fff3bf" r="0.8" />
      </g>
      <g data-part="sway" style={pivot(31, 38, -2.2)}>
        <path
          d="M31 39 Q30 33 31.6 28 M32.6 39 Q34 34 33.6 30"
          fill="none"
          stroke="#6fae4c"
          strokeLinecap="round"
          strokeWidth="1.3"
        />
        <circle cx="31.6" cy="27" fill="#c9a0e8" r="1.9" />
      </g>
      <circle cx="20" cy="48" fill="#a3c585" r="3" />
      <circle cx="30" cy="52" fill="#a3c585" r="2.2" />
      <circle cx="13.6" cy="44" fill="#cfe3b4" r="1.6" />
      <g data-part="ear" style={pivot(38, 26)}>
        <path d="M35 28 L34 15 L44 22 Z" fill="#5e7d46" />
        <path d="M36.6 24 L36.2 18.6 L40.4 21.6 Z" fill="#a3c585" />
      </g>
      <g data-part="ear" style={pivot(52, 26, -1.5)}>
        <path d="M55 28 L56 15 L46 22 Z" fill="#5e7d46" />
        <path d="M53.4 24 L53.8 18.6 L49.6 21.6 Z" fill="#a3c585" />
      </g>
      <ellipse cx="45" cy="35" fill="#7a9b5c" rx="12" ry="10.5" />
      <circle cx="37.6" cy="29" fill="#a3c585" r="2" />
      <Eye r={2.5} x={40} y={34} />
      <Eye r={2.5} x={50} y={34} />
      <path d="M43.8 37.4 L46.2 37.4 L45 39 Z" fill="#f48fb1" />
      <path
        d="M45 39 Q43.6 41 42 39.8 M45 39 Q46.4 41 48 39.8"
        fill="none"
        stroke="#42572f"
        strokeLinecap="round"
        strokeWidth="1"
      />
      <path
        d="M38 38.6 L32.6 38 M38 40 L33 41.6 M52 38.6 L57.4 38 M52 40 L57 41.6"
        fill="none"
        stroke="#d5ecc0"
        strokeLinecap="round"
        strokeWidth="0.8"
      />
      <Blush x={37.4} y={38.6} />
      <Blush x={52.6} y={38.6} />
      <ellipse cx="20" cy="57" fill="#5e7d46" rx="4" ry="2.1" />
      <ellipse cx="34" cy="57.4" fill="#5e7d46" rx="4" ry="2.1" />
      <ellipse cx="43" cy="56.6" fill="#5e7d46" rx="4" ry="2.1" />
    </>
  );
}

const WISPS = [0, 45, 90, 135, 180, 225, 270, 315];

/** A dandelion clock with a face, adrift with its one seed. */
function Thistledown() {
  return (
    <>
      <Halo fill="#fff9e6" r={22} x={32} y={32} />
      <g data-part="spin" style={pivot(32, 32)}>
        {WISPS.map((a) => (
          <g key={a} transform={`rotate(${a} 32 32)`}>
            <path
              d="M32 32 V10"
              stroke="#f5f2e8"
              strokeLinecap="round"
              strokeWidth="1"
            />
            <path
              d="M32 10 L28.6 6.4 M32 10 V5 M32 10 L35.4 6.4"
              fill="none"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeWidth="1"
            />
          </g>
        ))}
      </g>
      <circle cx="32" cy="32" fill="#efe9db" r="11.5" />
      <circle cx="24.6" cy="27.6" fill="#f8f5ec" r="5.4" />
      <circle cx="39.4" cy="27.6" fill="#f8f5ec" r="5.4" />
      <circle cx="32" cy="24" fill="#f8f5ec" r="5.4" />
      <circle cx="23" cy="35.6" fill="#f8f5ec" r="4.6" />
      <circle cx="41" cy="35.6" fill="#f8f5ec" r="4.6" />
      <Eye fill="#6f6658" r={2.1} x={28} y={32} />
      <Eye fill="#6f6658" r={2.1} x={36} y={32} />
      <Smile stroke="#6f6658" w={1.8} x={32} y={35.6} />
      <Blush x={24.6} y={35.4} />
      <Blush x={39.4} y={35.4} />
      <g data-part="sway" style={pivot(32, 43)}>
        <path
          d="M32 43 V53"
          stroke="#c9bd9f"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
        <ellipse cx="32" cy="55.6" fill="#a89a7c" rx="2" ry="3" />
      </g>
      <Sparkle delay={-0.4} fill="#fff4c9" s={2.2} x={52} y={50} />
      <Sparkle delay={-1.8} fill="#fff4c9" s={1.8} x={11} y={47} />
    </>
  );
}

/** A dragon the size of a dragonfly, carrying its own lantern. */
function Glimmerwing() {
  return (
    <>
      <g data-part="glow">
        <circle cx="45" cy="52" fill="#fff3bf" opacity="0.3" r="10" />
        <circle cx="45" cy="52" fill="#ffe98a" opacity="0.55" r="6" />
      </g>
      {[false, true].map((flip) => {
        const wings = (
          <>
            <g data-part="wing">
              <ellipse
                cx="17"
                cy="25"
                fill="#b5eef0"
                opacity="0.8"
                rx="13.5"
                ry="5.6"
                transform="rotate(18 17 25)"
              />
              <path
                d="M29 29 Q18 24 6 22"
                fill="none"
                opacity="0.9"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeWidth="0.9"
              />
            </g>
            <g data-part="wing" style={{ animationDelay: "-0.07s" }}>
              <ellipse
                cx="19"
                cy="37"
                fill="#d3f5ec"
                opacity="0.75"
                rx="10.5"
                ry="4.6"
                transform="rotate(-16 19 37)"
              />
              <path
                d="M29 34 Q20 37 10 40"
                fill="none"
                opacity="0.9"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeWidth="0.9"
              />
            </g>
          </>
        );
        return flip ? <Mirror key="r">{wings}</Mirror> : <g key="l">{wings}</g>;
      })}
      {/* Long tail curling round to the lantern at its tip */}
      <path
        d="M32 30 Q29 45 36 51 Q40 54 45 52"
        fill="none"
        stroke="#3f9a9e"
        strokeLinecap="round"
        strokeWidth="6.4"
      />
      <path
        d="M29.6 36 H34.4 M30 41 H34.6 M31.6 46 L35.6 44"
        fill="none"
        stroke="#8fe0d8"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <circle cx="45" cy="52" fill="#fff6c4" r="3.6" />
      <path d="M25.6 16 L22 7 L29.6 12.6 Z" fill="#ffe9a8" />
      <path d="M38.4 16 L42 7 L34.4 12.6 Z" fill="#ffe9a8" />
      <path d="M22 22 L16.6 19.6 L21.6 26 Z" fill="#3f9a9e" />
      <path d="M42 22 L47.4 19.6 L42.4 26 Z" fill="#3f9a9e" />
      <ellipse cx="32" cy="22" fill="#4fb3b0" rx="10" ry="9" />
      <ellipse cx="32" cy="27" fill="#8fe0d8" rx="6" ry="4.2" />
      <circle cx="30" cy="26.4" fill="#2f7a7e" r="0.7" />
      <circle cx="34" cy="26.4" fill="#2f7a7e" r="0.7" />
      <Eye r={2.5} x={27} y={21} />
      <Eye r={2.5} x={37} y={21} />
      <Smile stroke="#2f7a7e" w={1.6} x={32} y={28.4} />
      <Blush x={23.6} y={25} />
      <Blush x={40.4} y={25} />
      <Sparkle delay={-1} fill="#fff6c4" s={2} x={55} y={44} />
    </>
  );
}

/** A cloud that is also a sheep, and mostly asleep. */
function Puffloaf() {
  return (
    <>
      <g
        data-part="zzz"
        fill="none"
        stroke="#8fa3c8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.3"
      >
        <path d="M49 17 H53.6 L49 22.4 H53.6" />
        <path d="M55.6 8.6 H58.8 L55.6 12.4 H58.8" />
      </g>
      {/* Underside in shadow, like any cloud */}
      <g fill="#d5ddf0">
        <circle cx="18" cy="43" r="9" />
        <circle cx="46" cy="43" r="9" />
        <ellipse cx="32" cy="46" rx="15" ry="9" />
      </g>
      <g fill="#fbf8f2">
        <circle cx="18" cy="40" r="9" />
        <circle cx="46" cy="40" r="9" />
        <circle cx="23" cy="30" r="9" />
        <circle cx="41" cy="30" r="9" />
        <circle cx="32" cy="26" r="9" />
        <ellipse cx="32" cy="40" rx="15" ry="10" />
      </g>
      <ellipse
        cx="20"
        cy="38.6"
        fill="#e8d9c6"
        rx="4.4"
        ry="2.3"
        transform="rotate(24 20 38.6)"
      />
      <ellipse
        cx="44"
        cy="38.6"
        fill="#e8d9c6"
        rx="4.4"
        ry="2.3"
        transform="rotate(-24 44 38.6)"
      />
      <ellipse cx="32" cy="41" fill="#e8d9c6" rx="9.5" ry="8" />
      <g fill="#fbf8f2">
        <circle cx="27.6" cy="33.6" r="4" />
        <circle cx="36.4" cy="33.6" r="4" />
        <circle cx="32" cy="32" r="4.4" />
      </g>
      <ClosedEye x={27.4} y={40.4} />
      <ClosedEye x={36.6} y={40.4} />
      <path
        d="M30.8 43.6 L32 45 L33.2 43.6 M32 45 V46.2"
        fill="none"
        stroke="#c98a8a"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.1"
      />
      <Blush x={25} y={44.4} />
      <Blush x={39} y={44.4} />
      <rect
        fill="#b9a58c"
        height="4.6"
        rx="1.4"
        width="3.6"
        x="24.6"
        y="52.4"
      />
      <rect
        fill="#b9a58c"
        height="4.6"
        rx="1.4"
        width="3.6"
        x="35.8"
        y="52.4"
      />
    </>
  );
}

/** A bead of morning dew with leaf ears, bright enough to throw a glint. */
function Dewsprite() {
  return (
    <>
      <Halo fill="#d8f3ff" r={23} x={32} y={37} />
      <g data-part="ear" style={pivot(24, 28)}>
        <path d="M24 30 Q11 25 10 12 Q22 14 28 25 Z" fill="#8fdcc0" />
        <path
          d="M25 27.6 Q18 22 13 15"
          fill="none"
          stroke="#5fb89a"
          strokeLinecap="round"
          strokeWidth="1"
        />
      </g>
      <g data-part="ear" style={pivot(40, 28, -1.1)}>
        <path d="M40 30 Q53 25 54 12 Q42 14 36 25 Z" fill="#8fdcc0" />
        <path
          d="M39 27.6 Q46 22 51 15"
          fill="none"
          stroke="#5fb89a"
          strokeLinecap="round"
          strokeWidth="1"
        />
      </g>
      <path
        d="M32 9 Q47 27 47 39 A15 15 0 1 1 17 39 Q17 27 32 9 Z"
        fill="#86cdf0"
      />
      <path
        d="M32 24 Q42 34 42 41 A10 10 0 1 1 22 41 Q22 34 32 24 Z"
        fill="#c4ecfb"
        opacity="0.75"
      />
      <path
        d="M23.6 35 Q24 26 30 18.6"
        fill="none"
        opacity="0.85"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
      <Eye fill="#234f6b" r={2.6} x={26.6} y={40} />
      <Eye fill="#234f6b" r={2.6} x={37.4} y={40} />
      <Smile stroke="#234f6b" w={2} x={32} y={44} />
      <Blush x={22.6} y={44} />
      <Blush x={41.4} y={44} />
      <circle cx="53" cy="36" data-part="drip" fill="#a8dcf5" r="2.2" />
      <circle
        cx="10"
        cy="40"
        data-part="drip"
        fill="#a8dcf5"
        r="1.6"
        style={{ animationDelay: "-1.6s" }}
      />
      <Sparkle delay={0} s={3} x={51} y={47} />
      <Sparkle delay={-1.3} s={2.2} x={13} y={52} />
      <Sparkle delay={-2.1} s={1.8} x={32} y={5} />
    </>
  );
}

/** A fluffy moth with wings like banked coals, shedding the odd ember. */
function Emberveil() {
  const wings = (
    <>
      <g data-part="wing">
        <path d="M30 31 Q24 9 9 8 Q1 20 8 31 Q18 39 30 35 Z" fill="#d9442a" />
        <path
          d="M29 31 Q23 15 12 13 Q7 21 12 29 Q20 34 29 33 Z"
          fill="#ff8a3d"
        />
        <path
          d="M28 31 Q23 21 16 19 Q14 24 17 28 Q22 31 28 32 Z"
          fill="#ffd166"
        />
        <circle cx="13" cy="20" fill="#fff3bf" r="3" />
        <circle cx="13" cy="20" fill="#d9442a" r="1.4" />
      </g>
      <g data-part="wing" style={{ animationDelay: "-0.1s" }}>
        <path
          d="M30 37 Q15 36 9 46 Q9 50 12 50 Q13 55 17 54 Q19 58 23 55 Q30 49 31 41 Z"
          fill="#ff8a3d"
        />
        <path
          d="M29 39 Q19 39 14 46 Q17 52 22 51 Q28 46 29 41 Z"
          fill="#ffd166"
        />
      </g>
    </>
  );
  return (
    <>
      <Halo fill="#ffb74d" r={29} x={32} y={33} />
      <g>{wings}</g>
      <Mirror>{wings}</Mirror>
      <ellipse cx="32" cy="42" fill="#8a3414" rx="5.4" ry="11" />
      <path
        d="M27.6 40 H36.4 M27.4 44.6 H36.6 M28.4 49 H35.6"
        fill="none"
        stroke="#ffb74d"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      {/* Feathered antennae */}
      <path
        d="M29.6 18 Q25 11 20 9 M26.6 13.6 L24 15.6 M26.6 13.6 L27 10.4 M23.4 10.8 L21 13 M23.4 10.8 L23.6 7.8 M34.4 18 Q39 11 44 9 M37.4 13.6 L40 15.6 M37.4 13.6 L37 10.4 M40.6 10.8 L43 13 M40.6 10.8 L40.4 7.8"
        fill="none"
        stroke="#ffb74d"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      {/* Ruff */}
      <g fill="#fff0d4">
        <circle cx="26.6" cy="31" r="4.4" />
        <circle cx="37.4" cy="31" r="4.4" />
        <circle cx="32" cy="32.6" r="4.8" />
      </g>
      <circle cx="32" cy="24" fill="#c4521f" r="7.4" />
      <Eye r={2.4} x={28.6} y={23.6} />
      <Eye r={2.4} x={35.4} y={23.6} />
      <Smile stroke="#5a1e0a" w={1.6} x={32} y={26.8} />
      <Blush fill="#ffb199" x={25.6} y={27} />
      <Blush fill="#ffb199" x={38.4} y={27} />
      <circle cx="50" cy="44" data-part="ember" fill="#ffd166" r="1.3" />
      <circle
        cx="13"
        cy="42"
        data-part="ember"
        fill="#ffb74d"
        r="1.1"
        style={{ animationDelay: "-1.2s" }}
      />
      <circle
        cx="42"
        cy="56"
        data-part="ember"
        fill="#fff3bf"
        r="1"
        style={{ animationDelay: "-2.1s" }}
      />
    </>
  );
}

/** An old stump that got up and walked, crowned in bramble. */
function Thornwhisper() {
  return (
    <>
      <path
        d="M21 51 Q15 57 8 58 M27 53 Q25 59 20 61 M37 53 Q39 59 44 61 M43 51 Q49 57 56 58"
        fill="none"
        stroke="#5a4030"
        strokeLinecap="round"
        strokeWidth="3.6"
      />
      <g data-part="ear" style={pivot(16, 33)}>
        <path d="M16 36 L4 27 L18 27 Z" fill="#5c8a3a" />
      </g>
      <g data-part="ear" style={pivot(48, 33, -1.4)}>
        <path d="M48 36 L60 27 L46 27 Z" fill="#5c8a3a" />
      </g>
      <path
        d="M13 48 Q11 25 32 24 Q53 25 51 48 Q51 56 32 56 Q13 56 13 48 Z"
        fill="#7a5a40"
      />
      <path
        d="M19 50 Q20 46 18.6 42 M45 50 Q44 46 45.4 42 M30 53 Q31 51 30.4 49"
        fill="none"
        stroke="#5a4030"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      {/* Mossy cap */}
      <path
        d="M14 38 Q14 22 32 21 Q50 22 50 38 Q45 32 39 35.6 Q32 31 25 35.6 Q19 32 14 38 Z"
        fill="#5c8a3a"
      />
      <circle cx="22" cy="28" fill="#8cc45a" r="1.8" />
      <circle cx="41" cy="27" fill="#8cc45a" r="1.5" />
      <circle cx="32" cy="25.6" fill="#8cc45a" r="1.2" />
      {/* Bramble crown: thorns, leaves, ripe berries */}
      <path
        d="M17 22 Q32 10 47 22"
        fill="none"
        stroke="#4a3324"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <path
        d="M20 19.6 L18.6 14.6 L23 17.6 Z M27 15.6 L27 10.4 L30.4 14.6 Z M37 15.6 L37 10.4 L33.6 14.6 Z M44 19.6 L45.4 14.6 L41 17.6 Z"
        fill="#4a3324"
      />
      <ellipse
        cx="13.6"
        cy="20"
        fill="#6aab3a"
        rx="3.6"
        ry="2"
        transform="rotate(-30 13.6 20)"
      />
      <ellipse
        cx="50.4"
        cy="20"
        fill="#6aab3a"
        rx="3.6"
        ry="2"
        transform="rotate(30 50.4 20)"
      />
      <circle cx="32" cy="13.6" fill="#d6336c" r="2.6" />
      <circle cx="24" cy="17" fill="#c2255c" r="2.1" />
      <circle cx="40" cy="17" fill="#c2255c" r="2.1" />
      <circle cx="31.2" cy="12.8" fill="#ffa8c4" r="0.8" />
      <circle
        cx="25"
        cy="42"
        data-part="glow"
        fill="#c8f59a"
        opacity="0.55"
        r="4.4"
      />
      <circle
        cx="39"
        cy="42"
        data-part="glow"
        fill="#c8f59a"
        opacity="0.55"
        r="4.4"
      />
      <Eye r={2.6} x={25} y={42} />
      <Eye r={2.6} x={39} y={42} />
      <Smile stroke="#3a281c" w={2} x={32} y={46.6} />
      <Blush x={20.6} y={46.4} />
      <Blush x={43.4} y={46.4} />
    </>
  );
}

/** Wings of cut crystal on a creature that never hurries. */
function Mirewing() {
  const wings = (
    <>
      <g
        data-part="wing"
        stroke="#ffffff"
        strokeLinejoin="round"
        strokeWidth="0.6"
      >
        <path d="M30 31 L22 9 L14 20 Z" fill="#e6f7ff" />
        <path d="M22 9 L7 7 L14 20 Z" fill="#a9d4f7" />
        <path d="M7 7 L3 22 L14 20 Z" fill="#c9bff2" />
        <path d="M30 31 L14 20 L13 34 Z" fill="#cbe9ff" />
        <path d="M14 20 L3 22 L13 34 Z" fill="#f3cfe8" />
      </g>
      <g
        data-part="wing"
        stroke="#ffffff"
        strokeLinejoin="round"
        strokeWidth="0.6"
        style={{ animationDelay: "-0.3s" }}
      >
        <path d="M30 37 L13 38 L20 47 Z" fill="#f3cfe8" />
        <path d="M13 38 L7 51 L20 47 Z" fill="#cbe9ff" />
        <path d="M20 47 L7 51 L18 59 Z" fill="#a9d4f7" />
        <path d="M30 37 L20 47 L28 49 Z" fill="#ddd3f7" />
        <path d="M20 47 L18 59 L28 49 Z" fill="#c8f0ee" />
      </g>
    </>
  );
  return (
    <>
      <Halo fill="#e3f2fd" r={29} x={32} y={33} />
      <g>{wings}</g>
      <Mirror>{wings}</Mirror>
      <path
        d="M30 21 Q27 14 22.6 13 M34 21 Q37 14 41.4 13"
        fill="none"
        stroke="#5b8fd0"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path d="M22.6 10.4 L24.6 13 L22.6 15.6 L20.6 13 Z" fill="#f3cfe8" />
      <path d="M41.4 10.4 L43.4 13 L41.4 15.6 L39.4 13 Z" fill="#f3cfe8" />
      <ellipse cx="32" cy="40" fill="#5b8fd0" rx="3.6" ry="10.5" />
      <path
        d="M29.4 38 H34.6 M29.2 42.6 H34.8 M29.8 47 H34.2"
        fill="none"
        stroke="#a9d4f7"
        strokeLinecap="round"
        strokeWidth="1.1"
      />
      <circle cx="32" cy="26" fill="#6fa5e0" r="6.8" />
      <Eye fill="#1f3f73" r={2.3} x={29} y={25.6} />
      <Eye fill="#1f3f73" r={2.3} x={35} y={25.6} />
      <Smile stroke="#1f3f73" w={1.4} x={32} y={28.6} />
      <Blush x={26.4} y={28.6} />
      <Blush x={37.6} y={28.6} />
      <Sparkle delay={0} s={3} x={8} y={30} />
      <Sparkle delay={-0.9} s={2.4} x={55} y={12} />
      <Sparkle delay={-1.7} s={2} x={52} y={56} />
      <Sparkle delay={-2.4} fill="#f3cfe8" s={1.8} x={15} y={4} />
    </>
  );
}

const FRONDS = [
  { angle: -66, length: 21, fill: "#52b788" },
  { angle: -34, length: 25, fill: "#74c69d" },
  { angle: 0, length: 27, fill: "#52b788" },
  { angle: 34, length: 25, fill: "#74c69d" },
  { angle: 66, length: 21, fill: "#52b788" },
];

/** A fern frond rising from (32, 30): a stem with leaflets shrinking to the tip. */
function Frond({
  angle,
  length,
  fill,
  delay,
}: {
  angle: number;
  length: number;
  fill: string;
  delay: number;
}) {
  const leaflets = [0.25, 0.42, 0.59, 0.76, 0.93];
  return (
    <g transform={`rotate(${angle} 32 30)`}>
      <g data-part="sway" style={pivot(32, 30, delay)}>
        <path
          d={`M32 30 V${30 - length}`}
          stroke="#2d6a4f"
          strokeLinecap="round"
          strokeWidth="1.4"
        />
        {leaflets.map((t) => {
          const y = 30 - length * t;
          const size = 4.6 * (1.15 - t);
          return (
            <g key={t}>
              <ellipse
                cx={32 - size * 0.8}
                cy={y - 0.6}
                fill={fill}
                rx={size}
                ry={size * 0.36}
                transform={`rotate(28 ${32 - size * 0.8} ${y - 0.6})`}
              />
              <ellipse
                cx={32 + size * 0.8}
                cy={y - 0.6}
                fill={fill}
                rx={size}
                ry={size * 0.36}
                transform={`rotate(-28 ${32 + size * 0.8} ${y - 0.6})`}
              />
            </g>
          );
        })}
      </g>
    </g>
  );
}

/** The oldest thing in the forest: a mossy hill of a spirit, crowned in fern,
 * eyes closed, flowers opening wherever she rests. */
function Fernmother() {
  return (
    <>
      <Halo fill="#b7f5c8" r={30} x={32} y={34} />
      {FRONDS.map((f, i) => (
        <Frond key={f.angle} {...f} delay={-i * 0.9} />
      ))}
      <path
        d="M12 56 Q5 57 3 61 M52 56 Q59 57 61 61 M23 58 Q21 61 16 62 M41 58 Q43 61 48 62"
        fill="none"
        stroke="#2d6a4f"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path d="M9 57 Q7 30 32 27 Q57 30 55 57 Q32 61 9 57 Z" fill="#3f8a63" />
      <ellipse cx="32" cy="49" fill="#58a67c" opacity="0.7" rx="13" ry="8.5" />
      <circle cx="17" cy="41" fill="#74c69d" opacity="0.8" r="2.6" />
      <circle cx="46.6" cy="38.6" fill="#74c69d" opacity="0.8" r="2" />
      <circle cx="40" cy="32.6" fill="#74c69d" opacity="0.8" r="1.5" />
      <ClosedEye stroke="#eafff0" x={25} y={42.4} />
      <ClosedEye stroke="#eafff0" x={39} y={42.4} />
      <Smile stroke="#eafff0" w={2.2} x={32} y={47} />
      <Blush x={20.6} y={47} />
      <Blush x={43.4} y={47} />
      {/* Flowers and a toadstool that have taken root on her */}
      <g fill="#ffffff">
        <circle cx="14.4" cy="49.6" r="1.5" />
        <circle cx="17.6" cy="49.6" r="1.5" />
        <circle cx="16" cy="48" r="1.5" />
        <circle cx="16" cy="51.2" r="1.5" />
      </g>
      <circle cx="16" cy="49.6" fill="#f2c94c" r="1.1" />
      <g fill="#f7b7d7">
        <circle cx="47.4" cy="51" r="1.4" />
        <circle cx="50.4" cy="51" r="1.4" />
        <circle cx="48.9" cy="49.5" r="1.4" />
        <circle cx="48.9" cy="52.5" r="1.4" />
      </g>
      <circle cx="48.9" cy="51" fill="#fff3bf" r="1" />
      <rect fill="#f4ecdc" height="3" rx="0.6" width="1.6" x="31.2" y="53.4" />
      <path d="M28.6 53.6 Q32 49 35.4 53.6 Z" fill="#e0403a" />
      <circle cx="31" cy="52.4" fill="#ffffff" r="0.6" />
      <Sparkle delay={-0.3} fill="#eafff0" s={2.4} x={7} y={22} />
      <Sparkle delay={-1.6} fill="#eafff0" s={2} x={57} y={26} />
    </>
  );
}

const CREATURES: Record<SpeciesId, () => React.JSX.Element> = {
  robin: Robin,
  rabbit: Rabbit,
  squirrel: Squirrel,
  hedgehog: Hedgehog,
  mouse: Mouse,
  wren: Wren,
  mole: Mole,
  fox: Fox,
  deer: Deer,
  owl: Owl,
  badger: Badger,
  mosskit: Mosskit,
  otter: Otter,
  hare: Hare,
  thistledown: Thistledown,
  glimmerwing: Glimmerwing,
  puffloaf: Puffloaf,
  dewsprite: Dewsprite,
  emberveil: Emberveil,
  thornwhisper: Thornwhisper,
  mirewing: Mirewing,
  fernmother: Fernmother,
};

/**
 * How fast each winged species beats its wings, in seconds per beat: a
 * dragonfly's blur, a moth's flutter, and a butterfly that barely stirs.
 */
const WINGBEAT: Partial<Record<SpeciesId, number>> = {
  glimmerwing: 0.22,
  emberveil: 0.7,
  mirewing: 3.4,
};

export interface CreatureSVGProps {
  speciesId: SpeciesId;
  /** Rendered width/height in px (square). */
  size?: number;
  /** Greyscale silhouette for not-yet-collected entries. */
  silhouette?: boolean;
}

export function CreatureSVG({
  speciesId,
  size = 64,
  silhouette = false,
}: CreatureSVGProps) {
  const Creature = CREATURES[speciesId];
  // Each species blinks on its own beat, so a glade full of them never
  // blinks in unison.
  const blinkOffset = -(Object.keys(CREATURES).indexOf(speciesId) * 0.83);
  return (
    <Svg
      aria-hidden="true"
      data-silhouette={silhouette || undefined}
      height={size}
      style={
        {
          "--blink-delay": `${blinkOffset.toFixed(2)}s`,
          "--wingbeat": `${WINGBEAT[speciesId] ?? 1}s`,
        } as CSSProperties
      }
      viewBox="0 0 64 64"
      width={size}
    >
      <Creature />
    </Svg>
  );
}

// ─── Living details ───────────────────────────────────────────────────────────

const blink = keyframes`
  0%, 93%, 100% { transform: scaleY(1); }
  96.5%         { transform: scaleY(0.1); }
`;

const flutter = keyframes`
  0%, 100% { transform: scaleX(1); }
  50%      { transform: scaleX(0.72); }
`;

const wag = keyframes`
  0%, 100% { transform: rotate(-4deg); }
  50%      { transform: rotate(5deg); }
`;

const earTwitch = keyframes`
  0%, 84%, 92%, 100% { transform: rotate(0deg); }
  88%                { transform: rotate(-7deg); }
`;

const sway = keyframes`
  0%, 100% { transform: rotate(-5deg); }
  50%      { transform: rotate(5deg); }
`;

/* Swells rather than fades, so each glow keeps the opacity it was drawn at. */
const glowPulse = keyframes`
  0%, 100% { transform: scale(0.86); }
  50%      { transform: scale(1.08); }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
  50%      { opacity: 1; transform: scale(1) rotate(45deg); }
`;

const floatAway = keyframes`
  0%   { opacity: 0; transform: translate(0, 3px); }
  25%  { opacity: 1; }
  70%  { opacity: 1; }
  100% { opacity: 0; transform: translate(2px, -6px); }
`;

const drip = keyframes`
  0%, 100% { transform: translateY(-2px); }
  50%      { transform: translateY(2px); }
`;

const turn = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const Svg = styled.svg`
  overflow: visible;

  &[data-silhouette] {
    filter: grayscale(1) brightness(0.35);
    opacity: 0.5;
  }

  /* Parts that pivot about their own box. */
  & [data-part="eye"],
  & [data-part="sparkle"],
  & [data-part="glow"],
  & [data-part="wing"] {
    transform-box: fill-box;
    transform-origin: center;
  }

  & [data-part="eye"] {
    animation: ${blink} 5.2s var(--blink-delay) infinite;
  }

  /* Drawn on the creature's left and mirrored for the right, so the body is
     always on the wing's own right-hand side. */
  & [data-part="wing"] {
    transform-origin: 100% 60%;
    animation: ${flutter} var(--wingbeat) ease-in-out infinite;
  }

  & [data-part="tail"] {
    animation: ${wag} 2.6s ease-in-out infinite;
  }

  & [data-part="ear"] {
    animation: ${earTwitch} 4.4s ease-in-out infinite;
  }

  & [data-part="sway"] {
    animation: ${sway} 3.8s ease-in-out infinite;
  }

  & [data-part="glow"] {
    animation: ${glowPulse} 3.2s ease-in-out infinite;
  }

  & [data-part="sparkle"] {
    animation: ${twinkle} 2.8s ease-in-out infinite;
  }

  & [data-part="note"],
  & [data-part="zzz"],
  & [data-part="ember"] {
    animation: ${floatAway} 2.8s ease-in-out infinite;
  }

  & [data-part="drip"] {
    animation: ${drip} 3.2s ease-in-out infinite;
  }

  & [data-part="spin"] {
    animation: ${turn} 40s linear infinite;
  }

  /* A silhouette is a creature not met yet: it holds still. */
  &[data-silhouette] [data-part] {
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    & [data-part] {
      animation: none;
    }
  }
`;
