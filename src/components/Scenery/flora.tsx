import { ld } from "./motion";

// Small pieces of scenery more than one scene paints. Each is drawn about its
// own anchor (a flower's foot, a cloud's middle) in scene units.

const STEM = ld("#3e7a28", "#1e3a18");

interface FlowerProps {
  /** Where the stem meets the ground, along the clump. */
  x: number;
  /** Stem height. */
  h: number;
  color: string;
}

export function Tulip({ x, h, color }: FlowerProps) {
  const top = -h;
  return (
    <g>
      <line
        strokeLinecap="round"
        strokeWidth={0.9}
        style={{ stroke: STEM }}
        x1={x}
        x2={x}
        y1={0}
        y2={top}
      />
      <path
        d={`M${x} -1 Q${x - 4} ${-h * 0.4} ${x - 1} ${-h * 0.6} Q${x - 1} ${-h * 0.3} ${x} -1 Z`}
        style={{ fill: STEM }}
      />
      <path
        d={`M${x - 2.2} ${top} Q${x - 2.6} ${top - 4} ${x - 1.1} ${top - 4.6} L${x} ${top - 3} L${x + 1.1} ${top - 4.6} Q${x + 2.6} ${top - 4} ${x + 2.2} ${top} Q${x} ${top + 1.6} ${x - 2.2} ${top} Z`}
        style={{ fill: color }}
      />
    </g>
  );
}

export function Daisy({ x, h, color }: FlowerProps) {
  const top = -h;
  return (
    <g>
      <line
        strokeLinecap="round"
        strokeWidth={0.8}
        style={{ stroke: STEM }}
        x1={x}
        x2={x}
        y1={0}
        y2={top}
      />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse
          cx={x}
          cy={top - 1.8}
          key={a}
          rx={0.9}
          ry={1.8}
          style={{ fill: color }}
          transform={`rotate(${a} ${x} ${top})`}
        />
      ))}
      <circle
        cx={x}
        cy={top}
        r={1.1}
        style={{ fill: ld("#f0b020", "#a07a20") }}
      />
    </g>
  );
}

export function Lavender({ x, h, color }: FlowerProps) {
  const top = -h;
  return (
    <g>
      <line
        strokeLinecap="round"
        strokeWidth={0.7}
        style={{ stroke: STEM }}
        x1={x}
        x2={x}
        y1={0}
        y2={top + 1}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          cx={x + (i % 2 === 0 ? -0.4 : 0.4)}
          cy={top + i * 1.5}
          key={i}
          rx={0.9 - i * 0.05}
          ry={1}
          style={{ fill: color }}
        />
      ))}
    </g>
  );
}

interface CloudProps {
  x: number;
  y: number;
  scale: number;
  tint: string;
  /** The flatter, shadowed underside. */
  shade: string;
}

export function Cloud({ x, y, scale, tint, shade }: CloudProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M-26 5 Q-30 -3 -19 -4 Q-18 -13 -7 -11 Q-2 -20 9 -14 Q19 -16 20 -6 Q29 -5 27 5 Z"
        style={{ fill: tint }}
      />
      <path
        d="M-26 5 Q-22 1 -12 2 Q0 -1 12 2 Q22 0 27 5 Z"
        style={{ fill: shade }}
      />
    </g>
  );
}
