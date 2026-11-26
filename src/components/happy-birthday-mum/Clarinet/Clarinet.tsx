/** A clarinet icon in the same 24px, currentColor style as lucide's icons. */
export function Clarinet({ size = 24 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="M2.5 2.5 4 4" strokeWidth="1.5" />
      <path d="M4.5 4.5 15.5 15.5" strokeWidth="3.4" />
      <path
        d="M15 17 17 15 21 19 19 21Z"
        fill="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="8"
        cy="8"
        fill="var(--card-bg, white)"
        r="0.9"
        strokeWidth="0"
      />
      <circle
        cx="10.5"
        cy="10.5"
        fill="var(--card-bg, white)"
        r="0.9"
        strokeWidth="0"
      />
      <circle
        cx="13"
        cy="13"
        fill="var(--card-bg, white)"
        r="0.9"
        strokeWidth="0"
      />
    </svg>
  );
}
