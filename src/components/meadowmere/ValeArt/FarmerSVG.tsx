import { keyframes, styled } from "next-yak";
import type { Facing } from "@/lib/meadowmere/movement";

/**
 * The farmer, in the flat-shape idiom the Glade's creatures use: solid fills,
 * no strokes to speak of, a fixed viewBox. Drawn a little taller than a tile so
 * the hat rises above whatever the farmer is standing in front of.
 */

const SKIN = "#e8c9a0";
const SKIN_SHADE = "#d4ab7f";
const HAT = "#e5c165";
const HAT_BRIM = "#cfa441";
const HAT_BAND = "#a9713c";
const TUNIC = "#6f9a63";
const TUNIC_SHADE = "#5c8152";
const TROUSERS = "#5d6f8f";
const BOOT = "#6d4c41";
const HAIR = "#7a5333";
const INK = "#2d2a26";

/** Legs and boots — identical from every angle, so drawn once. */
function Legs() {
  return (
    <>
      <rect fill={TROUSERS} height="9" rx="2.4" width="6" x="9.5" y="23" />
      <rect fill={TROUSERS} height="9" rx="2.4" width="6" x="16.5" y="23" />
      <ellipse cx="12.5" cy="33" fill={BOOT} rx="4" ry="2.6" />
      <ellipse cx="19.5" cy="33" fill={BOOT} rx="4" ry="2.6" />
    </>
  );
}

function FacingDown() {
  return (
    <>
      <Legs />
      <ellipse cx="6.8" cy="19" fill={TUNIC_SHADE} rx="2.6" ry="5.2" />
      <ellipse cx="25.2" cy="19" fill={TUNIC_SHADE} rx="2.6" ry="5.2" />
      <circle cx="6.8" cy="24" fill={SKIN} r="2.3" />
      <circle cx="25.2" cy="24" fill={SKIN} r="2.3" />
      <rect fill={TUNIC} height="14" rx="3.4" width="17" x="7.5" y="12" />
      <rect fill={TUNIC_SHADE} height="2.4" width="17" x="7.5" y="22" />
      <circle cx="16" cy="10" fill={SKIN} r="6.4" />
      <path d="M9.6 10 Q16 4 22.4 10 Z" fill={HAIR} />
      <ellipse cx="16" cy="7.4" fill={HAT_BRIM} rx="11" ry="3.2" />
      <path d="M9.8 7 Q10.8 1.4 16 1.4 Q21.2 1.4 22.2 7 Z" fill={HAT} />
      <path
        d="M9.9 6.6 Q16 5.4 22.1 6.6 L22.2 7.6 Q16 6.4 9.8 7.6 Z"
        fill={HAT_BAND}
      />
      <circle cx="13.2" cy="11.4" fill={INK} r="1.15" />
      <circle cx="18.8" cy="11.4" fill={INK} r="1.15" />
      <ellipse cx="16" cy="13.6" fill={SKIN_SHADE} rx="1.4" ry="0.8" />
    </>
  );
}

function FacingUp() {
  return (
    <>
      <Legs />
      <ellipse cx="6.8" cy="19" fill={TUNIC_SHADE} rx="2.6" ry="5.2" />
      <ellipse cx="25.2" cy="19" fill={TUNIC_SHADE} rx="2.6" ry="5.2" />
      <circle cx="6.8" cy="24" fill={SKIN} r="2.3" />
      <circle cx="25.2" cy="24" fill={SKIN} r="2.3" />
      <rect fill={TUNIC} height="14" rx="3.4" width="17" x="7.5" y="12" />
      <rect fill={TUNIC_SHADE} height="2.4" width="17" x="7.5" y="22" />
      <circle cx="16" cy="10" fill={SKIN} r="6.4" />
      {/* Back of the head: hair fills what the face would show. */}
      <path
        d="M9.7 9.4 Q16 3.6 22.3 9.4 Q22.3 15 16 15.4 Q9.7 15 9.7 9.4 Z"
        fill={HAIR}
      />
      <ellipse cx="16" cy="7.4" fill={HAT_BRIM} rx="11" ry="3.2" />
      <path d="M9.8 7 Q10.8 1.4 16 1.4 Q21.2 1.4 22.2 7 Z" fill={HAT} />
      <path
        d="M9.9 6.6 Q16 5.4 22.1 6.6 L22.2 7.6 Q16 6.4 9.8 7.6 Z"
        fill={HAT_BAND}
      />
    </>
  );
}

/** Drawn facing right; the left-facing pose is this one mirrored. */
function FacingRight() {
  return (
    <>
      <Legs />
      <rect fill={TUNIC} height="14" rx="3.4" width="14" x="9" y="12" />
      <rect fill={TUNIC_SHADE} height="2.4" width="14" x="9" y="22" />
      {/* Leading arm, reaching towards whatever is being worked on. */}
      <ellipse cx="21.5" cy="20" fill={TUNIC} rx="2.6" ry="5" />
      <circle cx="22.4" cy="24.4" fill={SKIN} r="2.3" />
      <circle cx="16" cy="10" fill={SKIN} r="6.4" />
      <path
        d="M9.6 10.6 Q10.4 4.4 15.6 4.2 Q13.4 7.6 12.4 12.8 Z"
        fill={HAIR}
      />
      <ellipse cx="16.6" cy="7.4" fill={HAT_BRIM} rx="10.4" ry="3.1" />
      <path d="M10.6 7 Q11.6 1.4 16.6 1.4 Q21.6 1.4 22.6 7 Z" fill={HAT} />
      <path
        d="M10.7 6.6 Q16.6 5.4 22.5 6.6 L22.6 7.6 Q16.6 6.4 10.6 7.6 Z"
        fill={HAT_BAND}
      />
      <circle cx="19.4" cy="11.2" fill={INK} r="1.15" />
      <path d="M21.8 10.6 L23.6 12 L21.8 12.8 Z" fill={SKIN_SHADE} />
    </>
  );
}

const POSES: Record<Facing, () => React.JSX.Element> = {
  down: FacingDown,
  up: FacingUp,
  left: FacingRight,
  right: FacingRight,
};

export interface FarmerSVGProps {
  facing: Facing;
  /** Bobs the farmer up and down while a walk is in progress. */
  walking: boolean;
}

/** Drawn 32 wide and 36 tall: one tile across, with the hat above the tile. */
const FARMER_WIDTH = 32;
const FARMER_HEIGHT = 36;

export function FarmerSVG({ facing, walking }: FarmerSVGProps) {
  const Pose = POSES[facing];
  return (
    <Sprite
      focusable="false"
      height={FARMER_HEIGHT}
      role="presentation"
      viewBox="0 0 32 36"
      width={FARMER_WIDTH}
    >
      <ellipse cx="16" cy="33.6" fill="rgb(0 0 0 / 0.18)" rx="8" ry="2.4" />
      <Body $facing={facing} $walking={walking}>
        <Pose />
      </Body>
    </Sprite>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const bob = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1.6px); }
`;

const Sprite = styled.svg`
  overflow: visible;
`;

const Body = styled.g<{ $facing: Facing; $walking: boolean }>`
  transform-box: fill-box;
  transform-origin: center bottom;
  scale: ${({ $facing }) => ($facing === "left" ? "-1 1" : "1 1")};
  animation: ${({ $walking }) => ($walking ? bob : "none")} 320ms ease-in-out
    infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
