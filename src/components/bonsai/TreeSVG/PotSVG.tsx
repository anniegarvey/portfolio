import { POT_CONFIGS } from "./potConfigs";

// ─── Pot SVG ──────────────────────────────────────────────────────────────────

/** Pot body only — drawn behind the soil so soil appears to sit inside. */
export function PotBodySVG({
  cx,
  rimY,
  potStyle,
  scale,
}: {
  cx: number;
  rimY: number;
  potStyle: string;
  scale: number;
}) {
  const cfg = POT_CONFIGS[potStyle] ?? POT_CONFIGS["simple-clay"];
  const bodyTopRx = Math.round(cfg.bodyTopRx * scale);
  const bodyBotRx = Math.round(cfg.bodyBotRx * scale);
  const height = Math.round(cfg.height * scale);
  const botY = rimY + height;
  const midY = rimY + height / 2;

  return (
    <g>
      <path
        d={`M ${cx - bodyTopRx},${rimY} C ${cx - bodyTopRx},${midY} ${cx - bodyBotRx},${botY - 2} ${cx - bodyBotRx},${botY} L ${cx + bodyBotRx},${botY} C ${cx + bodyBotRx},${botY - 2} ${cx + bodyTopRx},${midY} ${cx + bodyTopRx},${rimY} Z`}
        fill={cfg.bodyColor}
      />
      {/* Left-side shadow */}
      <path
        d={`M ${cx - bodyTopRx},${rimY} C ${cx - bodyTopRx},${midY} ${cx - bodyBotRx},${botY - 2} ${cx - bodyBotRx},${botY} L ${cx - bodyBotRx + 7},${botY} C ${cx - bodyTopRx + 8},${midY} ${cx - bodyTopRx + 7},${rimY + 2} ${cx - bodyTopRx + 5},${rimY} Z`}
        fill={cfg.shadowColor}
      />
      {cfg.glaze && (
        <ellipse
          cx={cx - 7}
          cy={rimY + 7}
          fill="rgba(255,255,255,0.18)"
          rx={3}
          ry={Math.round(8 * scale)}
          transform={`rotate(-20 ${cx - 7} ${rimY + 7})`}
        />
      )}
      <ellipse cx={cx} cy={botY} fill={cfg.botColor} rx={bodyBotRx} ry={2.5} />
    </g>
  );
}

/**
 * Pot rim only — drawn before the soil so the soil layer covers the inner rim
 * and the outer rim collar remains visible as a lip around the soil surface.
 */
export function PotRimSVG({
  cx,
  rimY,
  potStyle,
  scale,
}: {
  cx: number;
  rimY: number;
  potStyle: string;
  scale: number;
}) {
  const cfg = POT_CONFIGS[potStyle] ?? POT_CONFIGS["simple-clay"];
  return (
    <ellipse
      cx={cx}
      cy={rimY}
      fill={cfg.rimColor}
      rx={Math.round(cfg.rimRx * scale)}
      ry={Math.round(cfg.rimRy * scale)}
    />
  );
}
