import type { SpeciesId } from "@/lib/glade/schema";

// Simple flat-shape creatures on a shared 64×64 viewBox, in a cohesive
// palette. Fantastical species get a soft glow accent.

function Robin() {
  return (
    <>
      <ellipse cx="32" cy="40" fill="#8d6e63" rx="14" ry="12" />
      <circle cx="32" cy="26" fill="#8d6e63" r="9" />
      <ellipse cx="32" cy="42" fill="#e07a5f" rx="8" ry="8" />
      <circle cx="29" cy="24" fill="#2d2a26" r="1.5" />
      <circle cx="35" cy="24" fill="#2d2a26" r="1.5" />
      <polygon fill="#f2a541" points="32,27 30,30 34,30" />
      <path d="M20 40 Q14 44 16 50 Q22 50 24 46 Z" fill="#6d4c41" />
      <ellipse cx="28" cy="54" fill="#6d4c41" rx="2" ry="2" />
      <ellipse cx="36" cy="54" fill="#6d4c41" rx="2" ry="2" />
    </>
  );
}

function Rabbit() {
  return (
    <>
      <ellipse cx="22" cy="20" fill="#bcaaa4" rx="4" ry="12" />
      <ellipse cx="34" cy="18" fill="#bcaaa4" rx="4" ry="12" />
      <ellipse cx="22" cy="20" fill="#f8bbd0" rx="2" ry="8" />
      <ellipse cx="34" cy="18" fill="#f8bbd0" rx="2" ry="8" />
      <ellipse cx="30" cy="44" fill="#d7ccc8" rx="15" ry="13" />
      <circle cx="28" cy="32" fill="#d7ccc8" r="10" />
      <circle cx="25" cy="30" fill="#2d2a26" r="1.5" />
      <circle cx="32" cy="30" fill="#2d2a26" r="1.5" />
      <ellipse cx="28" cy="35" fill="#f8bbd0" rx="2" ry="1.5" />
      <circle cx="44" cy="48" fill="#ffffff" r="5" />
    </>
  );
}

function Squirrel() {
  return (
    <>
      <path
        d="M44 16 Q56 20 52 36 Q50 46 42 48 Q50 36 44 28 Z"
        fill="#a1593b"
      />
      <ellipse cx="30" cy="44" fill="#bf6b48" rx="13" ry="12" />
      <circle cx="28" cy="28" fill="#bf6b48" r="9" />
      <ellipse cx="22" cy="20" fill="#a1593b" rx="3" ry="4" />
      <ellipse cx="34" cy="20" fill="#a1593b" rx="3" ry="4" />
      <circle cx="25" cy="27" fill="#2d2a26" r="1.5" />
      <circle cx="31" cy="27" fill="#2d2a26" r="1.5" />
      <ellipse cx="28" cy="31" fill="#5d3a2a" rx="1.5" ry="1" />
      <ellipse cx="30" cy="48" fill="#e8c9a0" rx="6" ry="7" />
    </>
  );
}

function Hedgehog() {
  return (
    <>
      <path
        d="M16 46 Q12 28 30 22 Q50 18 52 40 Q53 48 48 50 Z"
        fill="#6d5444"
      />
      <path
        d="M22 26 L20 18 M30 23 L30 14 M38 23 L40 15 M45 27 L50 20"
        stroke="#4e3b2e"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <ellipse cx="22" cy="46" fill="#d7b89c" rx="12" ry="8" />
      <circle cx="14" cy="44" fill="#2d2a26" r="1.5" />
      <circle cx="10" cy="47" fill="#3a2c21" r="2" />
      <ellipse cx="24" cy="53" fill="#b89878" rx="2" ry="1.5" />
      <ellipse cx="34" cy="53" fill="#b89878" rx="2" ry="1.5" />
    </>
  );
}

function Fox() {
  return (
    <>
      <path d="M18 18 L24 28 L14 28 Z" fill="#d96c3a" />
      <path d="M46 18 L50 28 L40 28 Z" fill="#d96c3a" />
      <ellipse cx="32" cy="46" fill="#d96c3a" rx="15" ry="11" />
      <circle cx="32" cy="30" fill="#d96c3a" r="11" />
      <path d="M32 34 Q26 40 32 41 Q38 40 32 34" fill="#ffffff" />
      <circle cx="27" cy="28" fill="#2d2a26" r="1.5" />
      <circle cx="37" cy="28" fill="#2d2a26" r="1.5" />
      <ellipse cx="32" cy="35" fill="#2d2a26" rx="1.5" ry="1" />
      <path d="M46 48 Q58 46 56 36 Q50 38 46 42 Z" fill="#b3552c" />
      <circle cx="55" cy="38" fill="#ffffff" r="3" />
    </>
  );
}

function Deer() {
  return (
    <>
      <path
        d="M24 14 Q22 8 18 8 M24 14 Q26 8 29 6 M40 14 Q38 8 35 6 M40 14 Q42 8 46 8"
        fill="none"
        stroke="#8a6f55"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <ellipse cx="32" cy="46" fill="#c19a6b" rx="14" ry="11" />
      <circle cx="32" cy="26" fill="#c19a6b" r="10" />
      <ellipse cx="20" cy="22" fill="#a8845a" rx="4" ry="2.5" />
      <ellipse cx="44" cy="22" fill="#a8845a" rx="4" ry="2.5" />
      <circle cx="28" cy="24" fill="#2d2a26" r="1.5" />
      <circle cx="36" cy="24" fill="#2d2a26" r="1.5" />
      <ellipse cx="32" cy="30" fill="#5d4a38" rx="2" ry="1.5" />
      <circle cx="26" cy="42" fill="#ffffff" r="1.5" />
      <circle cx="34" cy="46" fill="#ffffff" r="1.5" />
      <circle cx="40" cy="41" fill="#ffffff" r="1.5" />
    </>
  );
}

function Owl() {
  return (
    <>
      <ellipse cx="32" cy="38" fill="#7d6754" rx="15" ry="17" />
      <path d="M20 24 L24 18 L28 24 M36 24 L40 18 L44 24" fill="#7d6754" />
      <circle cx="26" cy="30" fill="#f3e5cf" r="6" />
      <circle cx="38" cy="30" fill="#f3e5cf" r="6" />
      <circle cx="26" cy="30" fill="#2d2a26" r="2.5" />
      <circle cx="38" cy="30" fill="#2d2a26" r="2.5" />
      <polygon fill="#f2a541" points="32,33 29,38 35,38" />
      <ellipse cx="32" cy="46" fill="#9c8268" rx="8" ry="8" />
      <path
        d="M26 42 Q28 44 26 46 M32 44 Q34 46 32 48 M38 42 Q40 44 38 46"
        fill="none"
        stroke="#7d6754"
        strokeWidth="1.5"
      />
    </>
  );
}

function Badger() {
  return (
    <>
      <ellipse cx="34" cy="46" fill="#5f6368" rx="16" ry="11" />
      <ellipse cx="20" cy="38" fill="#eceff1" rx="10" ry="9" />
      <path d="M14 32 Q12 36 13 42 L19 46 Q21 38 20 31 Z" fill="#37393c" />
      <path d="M26 32 Q28 36 27 42 L21 46 Q19 38 20 31 Z" fill="#eceff1" />
      <path
        d="M22 31 Q24 36 23 43"
        fill="none"
        stroke="#37393c"
        strokeWidth="3"
      />
      <circle cx="17" cy="38" fill="#2d2a26" r="1.5" />
      <circle cx="24" cy="38" fill="#2d2a26" r="1.5" />
      <ellipse cx="20" cy="44" fill="#2d2a26" rx="2" ry="1.5" />
      <ellipse cx="14" cy="30" fill="#37393c" rx="2.5" ry="3" />
      <ellipse cx="26" cy="30" fill="#37393c" rx="2.5" ry="3" />
    </>
  );
}

function Mosskit() {
  return (
    <>
      <ellipse cx="32" cy="44" fill="#7a9b5c" rx="14" ry="11" />
      <circle cx="32" cy="28" fill="#7a9b5c" r="10" />
      <path d="M24 22 L22 14 L29 19 Z" fill="#5e7d46" />
      <path d="M40 22 L42 14 L35 19 Z" fill="#5e7d46" />
      <circle cx="28" cy="26" fill="#2d2a26" r="1.5" />
      <circle cx="36" cy="26" fill="#2d2a26" r="1.5" />
      <path d="M32 30 L30 32 L34 32 Z" fill="#42572f" />
      <circle cx="26" cy="38" fill="#a3c585" r="3" />
      <circle cx="36" cy="48" fill="#a3c585" r="2.5" />
      <circle cx="40" cy="38" fill="#cfe3b4" r="2" />
      <path
        d="M30 18 Q31 14 34 14 M38 20 Q40 16 43 17"
        fill="none"
        stroke="#a3c585"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  );
}

function Glimmerwing() {
  return (
    <>
      <ellipse
        cx="22"
        cy="28"
        fill="#9ad1d4"
        opacity="0.7"
        rx="12"
        ry="6"
        transform="rotate(-25 22 28)"
      />
      <ellipse
        cx="42"
        cy="28"
        fill="#9ad1d4"
        opacity="0.7"
        rx="12"
        ry="6"
        transform="rotate(25 42 28)"
      />
      <ellipse
        cx="24"
        cy="38"
        fill="#b5e2e5"
        opacity="0.6"
        rx="9"
        ry="5"
        transform="rotate(-35 24 38)"
      />
      <ellipse
        cx="40"
        cy="38"
        fill="#b5e2e5"
        opacity="0.6"
        rx="9"
        ry="5"
        transform="rotate(35 40 38)"
      />
      <ellipse cx="32" cy="40" fill="#4f8f93" rx="6" ry="14" />
      <circle cx="32" cy="24" fill="#5fa8ac" r="7" />
      <circle cx="29" cy="22" fill="#2d2a26" r="1.5" />
      <circle cx="35" cy="22" fill="#2d2a26" r="1.5" />
      <circle cx="32" cy="52" fill="#ffe066" r="3" />
      <circle cx="32" cy="52" fill="#fff3bf" opacity="0.6" r="6" />
    </>
  );
}

function Puffloaf() {
  return (
    <>
      <ellipse cx="33" cy="40" fill="#f5f0e8" rx="17" ry="13" />
      <circle cx="22" cy="32" fill="#f5f0e8" r="8" />
      <circle cx="34" cy="28" fill="#f5f0e8" r="9" />
      <circle cx="45" cy="33" fill="#f5f0e8" r="8" />
      <ellipse cx="20" cy="42" fill="#d8cfc0" rx="8" ry="7" />
      <circle cx="17" cy="40" fill="#2d2a26" r="1.5" />
      <circle cx="23" cy="40" fill="#2d2a26" r="1.5" />
      <ellipse cx="20" cy="45" fill="#c4b8a4" rx="2" ry="1.5" />
      <ellipse cx="28" cy="54" fill="#c4b8a4" rx="2" ry="2" />
      <ellipse cx="40" cy="54" fill="#c4b8a4" rx="2" ry="2" />
    </>
  );
}

function Dewsprite() {
  return (
    <>
      <path
        d="M32 10 Q44 26 44 38 A12 12 0 1 1 20 38 Q20 26 32 10"
        fill="#8fc7e8"
        opacity="0.9"
      />
      <path
        d="M32 18 Q40 28 40 38 A8 8 0 1 1 24 38 Q24 28 32 18"
        fill="#bde2f5"
        opacity="0.8"
      />
      <circle cx="28" cy="38" fill="#2d5a73" r="1.5" />
      <circle cx="36" cy="38" fill="#2d5a73" r="1.5" />
      <path
        d="M29 44 Q32 46 35 44"
        fill="none"
        stroke="#2d5a73"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="26" fill="#ffffff" opacity="0.7" r="2" />
      <circle cx="22" cy="22" fill="#bde2f5" opacity="0.8" r="2" />
      <circle cx="44" cy="20" fill="#bde2f5" opacity="0.6" r="1.5" />
      <circle cx="46" cy="30" fill="#bde2f5" opacity="0.7" r="1" />
    </>
  );
}

const CREATURES: Record<SpeciesId, () => React.JSX.Element> = {
  robin: Robin,
  rabbit: Rabbit,
  squirrel: Squirrel,
  hedgehog: Hedgehog,
  fox: Fox,
  deer: Deer,
  owl: Owl,
  badger: Badger,
  mosskit: Mosskit,
  glimmerwing: Glimmerwing,
  puffloaf: Puffloaf,
  dewsprite: Dewsprite,
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
  return (
    <svg
      aria-hidden="true"
      height={size}
      style={
        silhouette
          ? { filter: "grayscale(1) brightness(0.35)", opacity: 0.5 }
          : undefined
      }
      viewBox="0 0 64 64"
      width={size}
    >
      <Creature />
    </svg>
  );
}
