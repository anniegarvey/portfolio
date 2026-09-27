import { FlapAcross, vars, Wander } from "./motion";

interface ButterflyProps {
  x: number;
  y: number;
  scale?: number;
  /** Upper and lower wing colours. */
  wing: string;
  spot: string;
  /** Three waypoints, relative to where it starts, that it loops through. */
  path: [number, number, number, number, number, number];
  period: number;
  offset?: number;
}

/**
 * A butterfly seen from above, drawn about its body in scene units (roughly
 * 12 across at scale 1) and wandering a loop around where it is placed.
 */
export function Butterfly({
  x,
  y,
  scale = 1,
  wing,
  spot,
  path: [w1x, w1y, w2x, w2y, w3x, w3y],
  period,
  offset = 0,
}: ButterflyProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Wander
        style={vars({
          "--w1x": `${w1x}px`,
          "--w1y": `${w1y}px`,
          "--w2x": `${w2x}px`,
          "--w2y": `${w2y}px`,
          "--w3x": `${w3x}px`,
          "--w3y": `${w3y}px`,
          "--wander-period": `${period}s`,
          "--wander-offset": `${offset}s`,
        })}
      >
        <FlapAcross
          style={vars({
            "--flap-period": `${0.34 + (Math.abs(offset) % 3) * 0.05}s`,
          })}
        >
          <ellipse
            cx={-2.8}
            cy={-1.3}
            rx={2.9}
            ry={2.1}
            style={{ fill: wing }}
            transform="rotate(-28 -2.8 -1.3)"
          />
          <ellipse
            cx={2.8}
            cy={-1.3}
            rx={2.9}
            ry={2.1}
            style={{ fill: wing }}
            transform="rotate(28 2.8 -1.3)"
          />
          <ellipse
            cx={-1.9}
            cy={1.7}
            rx={1.8}
            ry={1.5}
            style={{ fill: wing }}
          />
          <ellipse cx={1.9} cy={1.7} rx={1.8} ry={1.5} style={{ fill: wing }} />
          <circle cx={-3.2} cy={-1.6} r={0.8} style={{ fill: spot }} />
          <circle cx={3.2} cy={-1.6} r={0.8} style={{ fill: spot }} />
        </FlapAcross>
        <ellipse
          cx={0}
          cy={0}
          rx={0.45}
          ry={2.4}
          style={{ fill: "light-dark(#3a2a20, #1a1410)" }}
        />
        <path
          d="M-0.2 -2.3 Q-1 -3.8 -1.6 -4.2 M0.2 -2.3 Q1 -3.8 1.6 -4.2"
          fill="none"
          strokeLinecap="round"
          strokeWidth={0.3}
          style={{ stroke: "light-dark(#3a2a20, #1a1410)" }}
        />
      </Wander>
    </g>
  );
}
