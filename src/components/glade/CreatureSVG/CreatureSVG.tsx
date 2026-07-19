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
      {/* Spines rising from the top of the body */}
      <path
        d="M30 33 L26 22 M36 30 L34 19 M42 30 L42 19 M48 32 L52 21"
        fill="none"
        stroke="#4e3b2e"
        strokeLinecap="round"
        strokeWidth="3"
      />
      {/* Round spiny body */}
      <ellipse cx="39" cy="43" fill="#6d5444" rx="16" ry="11" />
      {/* Pale belly */}
      <ellipse cx="39" cy="49" fill="#d7b89c" rx="10" ry="6" />
      {/* Head — directly left of body, same height */}
      <circle cx="20" cy="43" fill="#c9a882" r="10" />
      {/* Snout */}
      <ellipse cx="11" cy="47" fill="#d7b89c" rx="4.5" ry="3.5" />
      {/* Eye */}
      <circle cx="15" cy="40" fill="#2d2a26" r="2" />
      {/* Nose */}
      <circle cx="8" cy="48" fill="#3a2c21" r="2" />
      {/* Feet */}
      <ellipse cx="28" cy="53" fill="#b89878" rx="3" ry="2" />
      <ellipse cx="40" cy="54" fill="#b89878" rx="3" ry="2" />
      <ellipse cx="52" cy="52" fill="#b89878" rx="3" ry="2" />
    </>
  );
}

function Mouse() {
  return (
    <>
      {/* Ears — big rounds with pink inners */}
      <circle cx="24" cy="26" fill="#9e9089" r="6" />
      <circle cx="38" cy="26" fill="#9e9089" r="6" />
      <circle cx="24" cy="26" fill="#f8bbd0" r="3" />
      <circle cx="38" cy="26" fill="#f8bbd0" r="3" />
      {/* Body and head */}
      <ellipse cx="31" cy="46" fill="#b0a49c" rx="12" ry="9" />
      <circle cx="31" cy="34" fill="#b0a49c" r="8" />
      {/* Face */}
      <circle cx="28" cy="33" fill="#2d2a26" r="1.5" />
      <circle cx="34" cy="33" fill="#2d2a26" r="1.5" />
      <circle cx="31" cy="37" fill="#f8bbd0" r="1.5" />
      {/* Whiskers */}
      <path
        d="M27 37 L21 36 M27 38 L22 40 M35 37 L41 36 M35 38 L40 40"
        fill="none"
        stroke="#8a7f78"
        strokeLinecap="round"
        strokeWidth="1"
      />
      {/* Tail */}
      <path
        d="M43 48 Q52 46 54 38"
        fill="none"
        stroke="#9e9089"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      {/* Feet */}
      <ellipse cx="26" cy="54" fill="#8a7f78" rx="2.5" ry="2" />
      <ellipse cx="36" cy="54" fill="#8a7f78" rx="2.5" ry="2" />
    </>
  );
}

function Wren() {
  return (
    <>
      {/* Cocked-up tail */}
      <path d="M44 38 L56 26 L50 40 Z" fill="#8a6a4f" />
      {/* Body */}
      <ellipse cx="32" cy="42" fill="#a8845f" rx="13" ry="11" />
      {/* Pale breast */}
      <ellipse cx="28" cy="46" fill="#e8d3b8" rx="8" ry="7" />
      {/* Head */}
      <circle cx="26" cy="28" fill="#a8845f" r="8" />
      {/* Eye stripe */}
      <path
        d="M20 26 Q26 24 32 26"
        fill="none"
        stroke="#e8d3b8"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      {/* Eyes */}
      <circle cx="23" cy="27" fill="#2d2a26" r="1.5" />
      <circle cx="29" cy="27" fill="#2d2a26" r="1.5" />
      {/* Beak */}
      <polygon fill="#6d5444" points="26,30 23,34 29,33" />
      {/* Wing barring */}
      <path
        d="M36 38 Q39 40 37 44 M40 37 Q43 39 41 43"
        fill="none"
        stroke="#8a6a4f"
        strokeWidth="1.5"
      />
      {/* Feet */}
      <ellipse cx="28" cy="53" fill="#6d5444" rx="2" ry="2" />
      <ellipse cx="35" cy="53" fill="#6d5444" rx="2" ry="2" />
    </>
  );
}

function Mole() {
  return (
    <>
      {/* Velvet body — low and rounded */}
      <ellipse cx="34" cy="44" fill="#4a4038" rx="17" ry="12" />
      {/* Head merging into body */}
      <circle cx="19" cy="42" fill="#4a4038" r="9" />
      {/* Pink snout */}
      <ellipse cx="10" cy="45" fill="#e8a5a0" rx="4" ry="3" />
      {/* Tiny eyes — nearly hidden */}
      <circle cx="15" cy="39" fill="#2d2a26" r="1" />
      <circle cx="21" cy="38" fill="#2d2a26" r="1" />
      {/* Big digging paws */}
      <ellipse
        cx="24"
        cy="53"
        fill="#e8a5a0"
        rx="5"
        ry="3.5"
        transform="rotate(-20 24 53)"
      />
      <ellipse
        cx="40"
        cy="54"
        fill="#e8a5a0"
        rx="5"
        ry="3.5"
        transform="rotate(15 40 54)"
      />
      {/* Claw lines */}
      <path
        d="M21 51 L19 55 M24 52 L23 56 M38 52 L37 56 M42 52 L42 56"
        fill="none"
        stroke="#c98882"
        strokeLinecap="round"
        strokeWidth="1"
      />
      {/* Earth mound behind */}
      <path d="M42 52 Q48 44 54 52 Z" fill="#6d5444" />
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

function Otter() {
  return (
    <>
      {/* Thick tail curling round */}
      <path d="M44 50 Q56 48 54 38 Q48 42 44 46 Z" fill="#6d4c33" />
      {/* Sleek upright body */}
      <ellipse cx="32" cy="44" fill="#7d5a3e" rx="12" ry="13" />
      {/* Pale belly */}
      <ellipse cx="32" cy="47" fill="#d9c1a3" rx="7" ry="8" />
      {/* Head */}
      <circle cx="32" cy="26" fill="#7d5a3e" r="9" />
      {/* Small round ears */}
      <circle cx="25" cy="20" fill="#6d4c33" r="2.5" />
      <circle cx="39" cy="20" fill="#6d4c33" r="2.5" />
      {/* Pale muzzle */}
      <ellipse cx="32" cy="30" fill="#d9c1a3" rx="5" ry="4" />
      {/* Face */}
      <circle cx="28" cy="24" fill="#2d2a26" r="1.5" />
      <circle cx="36" cy="24" fill="#2d2a26" r="1.5" />
      <ellipse cx="32" cy="29" fill="#3a2c21" rx="1.5" ry="1" />
      {/* Whiskers */}
      <path
        d="M28 30 L22 29 M36 30 L42 29"
        fill="none"
        stroke="#d9c1a3"
        strokeLinecap="round"
        strokeWidth="1"
      />
      {/* Paws resting on belly */}
      <ellipse cx="27" cy="40" fill="#6d4c33" rx="3" ry="2" />
      <ellipse cx="37" cy="40" fill="#6d4c33" rx="3" ry="2" />
    </>
  );
}

function Hare() {
  return (
    <>
      {/* Very long ears */}
      <ellipse
        cx="24"
        cy="14"
        fill="#c9a876"
        rx="3.5"
        ry="11"
        transform="rotate(-8 24 14)"
      />
      <ellipse
        cx="36"
        cy="13"
        fill="#c9a876"
        rx="3.5"
        ry="11"
        transform="rotate(8 36 13)"
      />
      <ellipse
        cx="24"
        cy="14"
        fill="#8a6a4f"
        rx="1.5"
        ry="7"
        transform="rotate(-8 24 14)"
      />
      <ellipse
        cx="36"
        cy="13"
        fill="#8a6a4f"
        rx="1.5"
        ry="7"
        transform="rotate(8 36 13)"
      />
      {/* Lean upright body */}
      <ellipse cx="31" cy="46" fill="#b8905c" rx="11" ry="12" />
      {/* Pale chest */}
      <ellipse cx="29" cy="49" fill="#e8d3b8" rx="6" ry="7" />
      {/* Head — narrower than rabbit's */}
      <ellipse cx="30" cy="30" fill="#c9a876" rx="7" ry="8" />
      {/* Alert eyes set to the sides */}
      <circle cx="26" cy="28" fill="#2d2a26" r="2" />
      <circle cx="34" cy="28" fill="#2d2a26" r="2" />
      {/* Nose */}
      <ellipse cx="30" cy="34" fill="#8a6a4f" rx="1.5" ry="1" />
      {/* Strong haunch line */}
      <path
        d="M38 42 Q42 48 38 54"
        fill="none"
        stroke="#8a6a4f"
        strokeWidth="1.5"
      />
      {/* Long feet */}
      <ellipse cx="26" cy="57" fill="#a87f4e" rx="5" ry="2" />
      <ellipse cx="38" cy="57" fill="#a87f4e" rx="5" ry="2" />
    </>
  );
}

function Thistledown() {
  return (
    <>
      {/* Radiating seed-wisps */}
      <path
        d="M32 34 L32 10 M32 34 L14 18 M32 34 L50 18 M32 34 L10 34 M32 34 L54 34 M32 34 L16 48 M32 34 L48 48"
        fill="none"
        opacity="0.7"
        stroke="#e8e3d6"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      {/* Wisp tips */}
      <circle cx="32" cy="10" fill="#f5f2e8" r="2.5" />
      <circle cx="14" cy="18" fill="#f5f2e8" r="2" />
      <circle cx="50" cy="18" fill="#f5f2e8" r="2" />
      <circle cx="10" cy="34" fill="#f5f2e8" r="2" />
      <circle cx="54" cy="34" fill="#f5f2e8" r="2" />
      <circle cx="16" cy="48" fill="#f5f2e8" r="2" />
      <circle cx="48" cy="48" fill="#f5f2e8" r="2" />
      {/* Soft glow */}
      <circle cx="32" cy="36" fill="#fff9e6" opacity="0.5" r="13" />
      {/* Fluff body */}
      <circle cx="32" cy="36" fill="#efe9db" r="9" />
      <circle cx="26" cy="32" fill="#f5f2e8" r="5" />
      <circle cx="38" cy="32" fill="#f5f2e8" r="5" />
      <circle cx="32" cy="42" fill="#e3dccb" r="6" />
      {/* Gentle face */}
      <circle cx="29" cy="36" fill="#8a8272" r="1.5" />
      <circle cx="35" cy="36" fill="#8a8272" r="1.5" />
      <path
        d="M29 41 Q32 43 35 41"
        fill="none"
        stroke="#8a8272"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      {/* Dangling seed */}
      <path
        d="M32 48 L32 54"
        fill="none"
        stroke="#b8ab8f"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <ellipse cx="32" cy="56" fill="#a89a7c" rx="2" ry="2.5" />
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

function Emberveil() {
  return (
    <>
      {/* Upper wings — flame-shaped */}
      <path
        d="M32 30 Q20 22 14 10 Q24 18 32 24"
        fill="#ff7043"
        opacity="0.85"
      />
      <path
        d="M32 30 Q44 22 50 10 Q40 18 32 24"
        fill="#ff7043"
        opacity="0.85"
      />
      {/* Lower wings */}
      <path
        d="M32 36 Q20 42 10 52 Q22 44 32 38"
        fill="#ffb74d"
        opacity="0.75"
      />
      <path
        d="M32 36 Q44 42 54 52 Q42 44 32 38"
        fill="#ffb74d"
        opacity="0.75"
      />
      {/* Body */}
      <ellipse cx="32" cy="34" fill="#bf360c" rx="4" ry="12" />
      {/* Head */}
      <circle cx="32" cy="22" fill="#e64a19" r="5" />
      {/* Glowing eyes */}
      <circle cx="29" cy="21" fill="#ffe082" r="1.5" />
      <circle cx="35" cy="21" fill="#ffe082" r="1.5" />
      {/* Antennae */}
      <path
        d="M30 18 Q26 12 24 8"
        fill="none"
        stroke="#ff7043"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M34 18 Q38 12 40 8"
        fill="none"
        stroke="#ff7043"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="8" fill="#ff7043" r="2" />
      <circle cx="40" cy="8" fill="#ff7043" r="2" />
      {/* Ember glow highlights on wings */}
      <circle cx="18" cy="16" fill="#fff176" opacity="0.6" r="3" />
      <circle cx="46" cy="16" fill="#fff176" opacity="0.6" r="3" />
      {/* Tail glow */}
      <ellipse cx="32" cy="47" fill="#ff8a65" opacity="0.45" rx="3" ry="4" />
    </>
  );
}

function Thornwhisper() {
  return (
    <>
      {/* Main body — covered in vines */}
      <ellipse cx="34" cy="44" fill="#2e4a1a" rx="16" ry="12" />
      {/* Head */}
      <circle cx="22" cy="38" fill="#2e4a1a" r="10" />
      {/* Ears — pointed, leaf-like */}
      <path d="M16 30 L12 20 L22 28 Z" fill="#1a2e0f" />
      <path d="M28 30 L32 20 L24 28 Z" fill="#1a2e0f" />
      {/* Vine tendrils growing from back */}
      <path
        d="M38 32 Q44 24 46 16"
        fill="none"
        stroke="#4a7c2a"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M42 36 Q50 30 54 22"
        fill="none"
        stroke="#5a8c3a"
        strokeLinecap="round"
        strokeWidth="2"
      />
      {/* Leaf clusters */}
      <ellipse
        cx="46"
        cy="15"
        fill="#6aab3a"
        rx="4"
        ry="2.5"
        transform="rotate(-30 46 15)"
      />
      <ellipse
        cx="54"
        cy="21"
        fill="#5a9a2a"
        rx="3.5"
        ry="2"
        transform="rotate(-20 54 21)"
      />
      {/* Face */}
      <circle cx="18" cy="36" fill="#2d2a26" r="1.8" />
      <circle cx="26" cy="36" fill="#2d2a26" r="1.8" />
      <ellipse cx="22" cy="41" fill="#3a5a20" rx="2.5" ry="1.5" />
      {/* Moss patches */}
      <circle cx="34" cy="40" fill="#7dc44a" opacity="0.6" r="2.5" />
      <circle cx="42" cy="46" fill="#8acc5a" opacity="0.5" r="2" />
      {/* Vine-tail */}
      <path d="M50 44 Q58 40 56 34 Q52 36 50 40" fill="#3d6020" />
      {/* Paws */}
      <ellipse cx="22" cy="54" fill="#243d14" rx="4" ry="2.5" />
      <ellipse cx="36" cy="54" fill="#243d14" rx="4" ry="2.5" />
    </>
  );
}

function Mirewing() {
  return (
    <>
      {/* Crystal upper wings */}
      <path d="M32 32 Q18 18 8 14 Q16 28 28 34" fill="#b3e5fc" opacity="0.7" />
      <path d="M32 32 Q46 18 56 14 Q48 28 36 34" fill="#b3e5fc" opacity="0.7" />
      {/* Crystal lower wings */}
      <path d="M32 38 Q18 46 10 58 Q22 48 30 40" fill="#e3f2fd" opacity="0.6" />
      <path d="M32 38 Q46 46 54 58 Q42 48 34 40" fill="#e3f2fd" opacity="0.6" />
      {/* Prismatic highlight veins */}
      <path
        d="M32 32 Q20 22 14 14"
        fill="none"
        opacity="0.7"
        stroke="#ffffff"
        strokeWidth="1.5"
      />
      <path
        d="M32 32 Q44 22 50 14"
        fill="none"
        opacity="0.7"
        stroke="#e1bee7"
        strokeWidth="1.5"
      />
      {/* Body */}
      <ellipse cx="32" cy="36" fill="#4fc3f7" rx="4" ry="10" />
      {/* Head */}
      <circle cx="32" cy="26" fill="#29b6f6" r="5" />
      {/* Facets — crystal reflections */}
      <circle cx="16" cy="20" fill="#ffffff" opacity="0.8" r="2.5" />
      <circle cx="48" cy="20" fill="#ffffff" opacity="0.8" r="2.5" />
      <circle cx="14" cy="50" fill="#e1f5fe" opacity="0.6" r="2" />
      <circle cx="50" cy="50" fill="#e1f5fe" opacity="0.6" r="2" />
      {/* Eyes */}
      <circle cx="29" cy="25" fill="#0288d1" r="1.5" />
      <circle cx="35" cy="25" fill="#0288d1" r="1.5" />
      {/* Antennae */}
      <path
        d="M30 22 Q26 16 24 12"
        fill="none"
        stroke="#4fc3f7"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M34 22 Q38 16 40 12"
        fill="none"
        stroke="#4fc3f7"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="12" fill="#b3e5fc" r="2" />
      <circle cx="40" cy="12" fill="#b3e5fc" r="2" />
    </>
  );
}

function Fernmother() {
  return (
    <>
      {/* Ancient mossy body */}
      <ellipse cx="34" cy="46" fill="#1b4332" rx="18" ry="13" />
      {/* Head — bark-like */}
      <circle cx="22" cy="36" fill="#1b4332" r="12" />
      {/* Great fern fronds */}
      <path
        d="M42 32 Q48 20 44 10 M44 10 Q50 18 46 26"
        fill="none"
        stroke="#2d6a4f"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M44 36 Q52 24 50 12 M50 12 Q56 22 52 32"
        fill="none"
        stroke="#40916c"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path
        d="M46 40 Q56 32 56 20"
        fill="none"
        stroke="#52b788"
        strokeLinecap="round"
        strokeWidth="2"
      />
      {/* Fern leaf clusters */}
      <ellipse
        cx="44"
        cy="9"
        fill="#52b788"
        rx="5"
        ry="2.5"
        transform="rotate(-15 44 9)"
      />
      <ellipse
        cx="50"
        cy="11"
        fill="#40916c"
        rx="5"
        ry="2.5"
        transform="rotate(20 50 11)"
      />
      <ellipse
        cx="56"
        cy="20"
        fill="#74c69d"
        rx="4"
        ry="2"
        transform="rotate(45 56 20)"
      />
      {/* Ancient bark eyes */}
      <circle cx="16" cy="34" fill="#2d2a26" r="2.5" />
      <circle cx="26" cy="34" fill="#2d2a26" r="2.5" />
      {/* Heavy brow */}
      <path
        d="M13 31 Q16 29 20 31"
        fill="none"
        stroke="#0d2818"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M23 31 Q26 29 30 31"
        fill="none"
        stroke="#0d2818"
        strokeLinecap="round"
        strokeWidth="2"
      />
      {/* Ancient mouth */}
      <path
        d="M17 40 Q21 43 25 40"
        fill="none"
        stroke="#0d2818"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      {/* Moss patches */}
      <circle cx="30" cy="46" fill="#74c69d" opacity="0.7" r="3.5" />
      <circle cx="40" cy="50" fill="#95d5b2" opacity="0.6" r="2.5" />
      <circle cx="22" cy="50" fill="#74c69d" opacity="0.5" r="2" />
      {/* Root feet */}
      <path
        d="M18 58 Q20 52 24 56"
        fill="none"
        stroke="#1b4332"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M30 59 Q32 53 36 58"
        fill="none"
        stroke="#1b4332"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M42 57 Q44 51 48 55"
        fill="none"
        stroke="#2d6a4f"
        strokeLinecap="round"
        strokeWidth="3"
      />
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
