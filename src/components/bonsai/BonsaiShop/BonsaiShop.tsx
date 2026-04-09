"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { styled } from "next-yak";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { useBonsai } from "@/lib/bonsai/context";
import type {
  PotId,
  ShopCategory,
  ShopItem,
  ShopItemId,
  StandId,
} from "@/lib/bonsai/schema";
import { parsePotId, parseStandId, SHOP_CATALOG } from "@/lib/bonsai/schema";
import { usePoints } from "@/lib/points/context";

const CATEGORIES: { value: ShopCategory; label: string }[] = [
  { value: "species", label: "Seeds" },
  { value: "tool", label: "Tools" },
  { value: "fertiliser", label: "Fertiliser" },
  { value: "pot", label: "Pots" },
  { value: "stand", label: "Stands" },
];

// ─── Pot preview SVG ──────────────────────────────────────────────────────────

const POT_PREVIEW_CONFIGS: Record<
  string,
  {
    rimRx: number;
    rimRy: number;
    rimColor: string;
    bodyRx: number;
    botRx: number;
    bodyColor: string;
    shadowColor: string;
    botColor: string;
    height: number;
    glaze?: boolean;
  }
> = {
  "simple-clay": {
    rimRx: 21,
    rimRy: 3,
    rimColor: "#9a4828",
    bodyRx: 18,
    botRx: 13,
    bodyColor: "#c1704a",
    shadowColor: "rgba(0,0,0,0.15)",
    botColor: "#8a3818",
    height: 13,
  },
  "glazed-ceramic": {
    rimRx: 22,
    rimRy: 3,
    rimColor: "#4a7a6a",
    bodyRx: 18,
    botRx: 13,
    bodyColor: "#6a9a88",
    shadowColor: "rgba(0,0,0,0.12)",
    botColor: "#3a6858",
    height: 15,
    glaze: true,
  },
  "lacquered-wood": {
    rimRx: 19,
    rimRy: 2,
    rimColor: "#2a1208",
    bodyRx: 18,
    botRx: 15,
    bodyColor: "#3a1a0a",
    shadowColor: "rgba(0,0,0,0.28)",
    botColor: "#1a0806",
    height: 13,
  },
  "stone-basin": {
    rimRx: 23,
    rimRy: 3,
    rimColor: "#6a6a62",
    bodyRx: 21,
    botRx: 18,
    bodyColor: "#8a8a80",
    shadowColor: "rgba(0,0,0,0.12)",
    botColor: "#5a5a52",
    height: 7,
  },
};

const PREVIEW_SIZE_SCALE: Record<string, number> = {
  small: 1,
  medium: 1.25,
  large: 1.5,
};

function PotShopPreview({ potId }: { potId: string }) {
  const { size, style } = parsePotId(potId as PotId);
  const v = POT_PREVIEW_CONFIGS[style] ?? POT_PREVIEW_CONFIGS["simple-clay"];
  const scale = PREVIEW_SIZE_SCALE[size] ?? 1;

  const rimRx = Math.round(v.rimRx * scale);
  const rimRy = Math.round(v.rimRy * scale);
  const bodyRx = Math.round(v.bodyRx * scale);
  const botRx = Math.round(v.botRx * scale);
  const height = Math.round(v.height * scale);

  const svgW = rimRx * 2 + 10;
  const cx = svgW / 2;
  const rimY = rimRy + 2;
  const botY = rimY + height;
  const midY = rimY + height / 2;
  const soilY = rimY + rimRy + 1;
  const viewH = botY + 5;

  return (
    <svg
      aria-hidden="true"
      height={viewH}
      style={{ display: "block", margin: "0 auto" }}
      viewBox={`0 0 ${svgW} ${viewH}`}
      width={svgW}
    >
      <path
        d={`M ${cx - bodyRx},${rimY} C ${cx - bodyRx},${midY} ${cx - botRx},${botY - 2} ${cx - botRx},${botY} L ${cx + botRx},${botY} C ${cx + botRx},${botY - 2} ${cx + bodyRx},${midY} ${cx + bodyRx},${rimY} Z`}
        fill={v.bodyColor}
      />
      <path
        d={`M ${cx - bodyRx},${rimY} C ${cx - bodyRx},${midY} ${cx - botRx},${botY - 2} ${cx - botRx},${botY} L ${cx - botRx + 5},${botY} C ${cx - bodyRx + 6},${midY} ${cx - bodyRx + 5},${rimY + 1} ${cx - bodyRx + 4},${rimY} Z`}
        fill={v.shadowColor}
      />
      {v.glaze && (
        <ellipse
          cx={cx - 5}
          cy={rimY + 5}
          fill="rgba(255,255,255,0.18)"
          rx={2}
          ry={Math.round(6 * scale)}
          transform={`rotate(-20 ${cx - 5} ${rimY + 5})`}
        />
      )}
      <ellipse cx={cx} cy={botY} fill={v.botColor} rx={botRx} ry={2} />
      {/* Soil surface inside pot */}
      <ellipse
        cx={cx}
        cy={soilY}
        fill="#8a6030"
        rx={bodyRx - 1}
        ry={rimRy - 0.5}
      />
      {/* Rim drawn on top of soil */}
      <ellipse cx={cx} cy={rimY} fill={v.rimColor} rx={rimRx} ry={rimRy} />
    </svg>
  );
}

// ─── Stand preview SVG ────────────────────────────────────────────────────────

const STAND_PREVIEW_CONFIGS: Record<
  string,
  { color: string; topColor: string; height: number; rx: number }
> = {
  "bamboo-mat": { color: "#8a7840", topColor: "#b0986a", height: 3, rx: 18 },
  "wooden-stand": { color: "#7a5030", topColor: "#a07050", height: 9, rx: 17 },
  "carved-stone": { color: "#787870", topColor: "#9a9a90", height: 7, rx: 17 },
};

function StandShopPreview({ standId }: { standId: string }) {
  const { size, style } = parseStandId(standId as StandId);
  const v = STAND_PREVIEW_CONFIGS[style] ?? STAND_PREVIEW_CONFIGS["bamboo-mat"];
  const scale = PREVIEW_SIZE_SCALE[size] ?? 1;

  const rx = Math.round(v.rx * scale);
  const height = Math.round(v.height * scale);
  const svgW = rx * 2 + 10;
  const cx = svgW / 2;
  const topY = 4;
  const botY = topY + height;
  const viewH = botY + 5;

  if (style === "wooden-stand") {
    const platformH = Math.round(2 * scale);
    const legW = Math.round(4 * scale);
    const legH = height - platformH;
    return (
      <svg
        aria-hidden="true"
        height={viewH}
        style={{ display: "block", margin: "0 auto" }}
        viewBox={`0 0 ${svgW} ${viewH}`}
        width={svgW}
      >
        <rect
          fill={v.color}
          height={legH}
          rx={1}
          width={legW}
          x={cx - rx}
          y={topY + platformH}
        />
        <rect
          fill={v.color}
          height={legH}
          rx={1}
          width={legW}
          x={cx + rx - legW}
          y={topY + platformH}
        />
        <rect
          fill={v.color}
          height={platformH}
          width={rx * 2}
          x={cx - rx}
          y={topY}
        />
        <ellipse cx={cx} cy={topY} fill={v.topColor} rx={rx} ry={2} />
      </svg>
    );
  }

  if (style === "bamboo-mat") {
    return (
      <svg
        aria-hidden="true"
        height={viewH}
        style={{ display: "block", margin: "0 auto" }}
        viewBox={`0 0 ${svgW} ${viewH}`}
        width={svgW}
      >
        <rect
          fill={v.color}
          height={height}
          rx={1}
          width={rx * 2}
          x={cx - rx}
          y={topY}
        />
        <line
          stroke={v.topColor}
          strokeWidth={0.5}
          x1={cx - rx + 2}
          x2={cx + rx - 2}
          y1={topY + 1}
          y2={topY + 1}
        />
        <ellipse cx={cx} cy={topY} fill={v.topColor} rx={rx} ry={1.5} />
      </svg>
    );
  }

  // carved-stone
  return (
    <svg
      aria-hidden="true"
      height={viewH}
      style={{ display: "block", margin: "0 auto" }}
      viewBox={`0 0 ${svgW} ${viewH}`}
      width={svgW}
    >
      <rect
        fill={v.color}
        height={height}
        width={rx * 2}
        x={cx - rx}
        y={topY}
      />
      <ellipse cx={cx} cy={topY} fill={v.topColor} rx={rx} ry={2} />
      <ellipse cx={cx} cy={botY} fill="rgba(0,0,0,0.2)" rx={rx} ry={1.5} />
    </svg>
  );
}

// ─── Owned count hook ─────────────────────────────────────────────────────────

function useOwnedCount(itemId: ShopItemId, category: ShopCategory) {
  const { state } = useBonsai();
  const inv = state.inventory;
  switch (category) {
    case "species":
      return inv.ownedSpeciesIds.filter((id) => id === itemId).length;
    case "tool":
      return inv.ownedToolIds.filter((id) => id === itemId).length;
    case "fertiliser":
      return inv.ownedFertiliserIds.filter((id) => id === itemId).length;
    case "pot":
      return inv.ownedPotIds.filter((id) => id === itemId).length;
    case "stand":
      return inv.ownedStandIds.filter((id) => id === itemId).length;
  }
}

function ShopCard({ item, focused }: { item: ShopItem; focused?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focused]);
  const { buyItem, state } = useBonsai();
  const { points } = usePoints();
  const [feedback, setFeedback] = useState<"insufficient" | null>(null);
  const ownedCount = useOwnedCount(item.id, item.category);

  const plantedCount =
    item.category === "species"
      ? state.trees.filter((t) => t.speciesId === item.id).length
      : 0;
  const totalOwned = ownedCount + plantedCount;
  const canAfford = points >= item.cost;

  const handleBuy = () => {
    const success = buyItem(item.id);
    if (!success) {
      setFeedback("insufficient");
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  return (
    <Card data-focused={focused || undefined} ref={cardRef}>
      <CardHeader>
        <ItemName>{item.label}</ItemName>
        <Cost>
          <CoinDot />
          {item.cost}
        </Cost>
      </CardHeader>
      {item.category === "pot" && <PotShopPreview potId={item.id} />}
      {item.category === "stand" && <StandShopPreview standId={item.id} />}
      <ItemDescription>{item.description}</ItemDescription>
      <CardFooter>
        {totalOwned > 0 && <OwnedBadge>Owned: {totalOwned}</OwnedBadge>}
        <Button
          disabled={!canAfford}
          intent="primary"
          onClick={handleBuy}
          size="sm"
          variant="outline"
        >
          Buy
        </Button>
      </CardFooter>
      {feedback === "insufficient" && (
        <FeedbackMsg aria-live="polite">Not enough points</FeedbackMsg>
      )}
    </Card>
  );
}

export function BonsaiShop({ focusItemId }: { focusItemId?: string }) {
  const items = SHOP_CATALOG;
  const focusedCategory =
    focusItemId != null
      ? (items.find((i) => i.id === focusItemId)?.category ?? "species")
      : null;
  const [activeCategory, setActiveCategory] = useState<ShopCategory>("species");

  useEffect(() => {
    if (focusedCategory != null) {
      setActiveCategory(focusedCategory);
    }
  }, [focusedCategory]);

  return (
    <ShopRoot
      onValueChange={(v) => setActiveCategory(v as ShopCategory)}
      value={activeCategory}
    >
      <ShopTabsList aria-label="Shop categories">
        {CATEGORIES.map(({ value, label }) => (
          <ShopTab key={value} value={value}>
            {label}
          </ShopTab>
        ))}
      </ShopTabsList>

      {CATEGORIES.map(({ value }) => (
        <Tabs.Content key={value} value={value}>
          <ShopGrid>
            {items
              .filter((item) => item.category === value)
              .map((item) => (
                <ShopCard
                  focused={focusItemId === item.id}
                  item={item}
                  key={item.id}
                />
              ))}
          </ShopGrid>
        </Tabs.Content>
      ))}
    </ShopRoot>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ShopRoot = styled(Tabs.Root)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ShopTabsList = styled(Tabs.List)`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  flex-wrap: wrap;
`;

const ShopTab = styled(Tabs.Trigger)`
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 1.3rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 150ms ease, border-color 150ms ease;

  &[data-state="active"] {
    color: light-dark(var(--color-primary-600), var(--color-primary-400));
    border-bottom-color: light-dark(var(--color-primary-600), var(--color-primary-400));
  }

  &:hover:not([data-state="active"]) {
    color: light-dark(var(--color-grey-700), var(--color-grey-200));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const ShopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
`;

const Card = styled.div`
  background: light-dark(var(--color-grey-50), var(--color-grey-900));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  border-radius: 8px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &[data-focused] {
    border-color: #f59e0b;
    box-shadow: 0 0 0 2px #f59e0b44;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
`;

const ItemName = styled.span`
  font-size: 1.3rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
  line-height: 1.3;
`;

const Cost = styled.span`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 1.3rem;
  font-weight: 700;
  color: #f59e0b;
  white-space: nowrap;
  flex-shrink: 0;
`;

const CoinDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe066, #f59e0b);
  display: inline-block;
  flex-shrink: 0;
`;

const ItemDescription = styled.p`
  font-size: 1.2rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
  margin: 0;
  line-height: 1.4;
  flex: 1;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
`;

const OwnedBadge = styled.span`
  font-size: 1.1rem;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
  font-weight: 600;
`;

const FeedbackMsg = styled.p`
  font-size: 1.1rem;
  color: var(--color-danger-500, #ef4444);
  margin: 0;
  text-align: right;
`;
