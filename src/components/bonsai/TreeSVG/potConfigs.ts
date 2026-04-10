export interface PotConfig {
  rimRx: number;
  rimRy: number;
  rimColor: string;
  bodyTopRx: number;
  bodyBotRx: number;
  bodyColor: string;
  shadowColor: string;
  botColor: string;
  height: number;
  glaze?: boolean;
}

export const POT_CONFIGS: Record<string, PotConfig> = {
  "simple-clay": {
    // Classic terracotta — clear flange rim wider than body opening
    rimRx: 26,
    rimRy: 4,
    rimColor: "#9a4828",
    bodyTopRx: 22,
    bodyBotRx: 16,
    bodyColor: "#c1704a",
    shadowColor: "rgba(0,0,0,0.15)",
    botColor: "#8a3818",
    height: 17,
  },
  "glazed-ceramic": {
    // Elegant jade glaze — wide flange rim, slight taper
    rimRx: 27,
    rimRy: 4,
    rimColor: "#4a7a6a",
    bodyTopRx: 22,
    bodyBotRx: 17,
    bodyColor: "#6a9a88",
    shadowColor: "rgba(0,0,0,0.12)",
    botColor: "#3a6858",
    height: 20,
    glaze: true,
  },
  "lacquered-wood": {
    // Dark lacquer — flush flat rim, nearly rectangular
    rimRx: 24,
    rimRy: 2.5,
    rimColor: "#2a1208",
    bodyTopRx: 22,
    bodyBotRx: 19,
    bodyColor: "#3a1a0a",
    shadowColor: "rgba(0,0,0,0.28)",
    botColor: "#1a0806",
    height: 17,
    glaze: true,
  },
  "stone-basin": {
    // Wide shallow basin — very wide rim relative to depth
    rimRx: 28,
    rimRy: 4,
    rimColor: "#6a6a62",
    bodyTopRx: 26,
    bodyBotRx: 22,
    bodyColor: "#8a8a80",
    shadowColor: "rgba(0,0,0,0.12)",
    botColor: "#5a5a52",
    height: 9,
  },
};
