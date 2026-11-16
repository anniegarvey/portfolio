"use client";

import { Coins } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { getTodayDateString } from "@/lib/date";
import { ALL_CROP_IDS, CROPS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import { canBuyGrowTonic, growTonicCost } from "@/lib/meadowmere/extrasModule";
import { seedCount } from "@/lib/meadowmere/inventory";
import { usePoints } from "@/lib/points/context";

/**
 * The seed stall. Points earned in the Energy Planner are spent here and
 * nowhere else in Meadowmere pays them back — the farm is somewhere to spend
 * points, never a way to mint them (ADR 0003, ADR 0005).
 */
export function StallDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, buySeed, buyGrowTonic } = useMeadowmere();
  const { points } = usePoints();
  const today = getTodayDateString();
  const tonicCost = growTonicCost(state, today);

  return (
    <Modal
      description="Seeds and grow tonic are bought with points earned in the Energy Planner. Nothing here pays points back."
      isOpen={open}
      onClose={onClose}
      showDescription
      title="The seed stall"
    >
      <Grid>
        {ALL_CROP_IDS.map((cropId) => {
          const crop = CROPS[cropId];
          const locked = !state.unlockedCropIds.includes(cropId);
          return (
            <Item key={cropId}>
              <Name>
                <span aria-hidden>{crop.glyph}</span> {crop.name}
              </Name>
              <Meta>
                {crop.daysToMature} days · yields {crop.baseYield}+ · you have{" "}
                {seedCount(state, cropId)}
              </Meta>
              <Blurb>{crop.blurb}</Blurb>
              {locked ? (
                <Meta>Locked — earned through a quest.</Meta>
              ) : (
                <Button
                  // Five buttons reading "Buy seed 12" are indistinguishable
                  // to anyone navigating the shop by button.
                  aria-label={`Buy ${crop.name} seed for ${crop.seedCost} points`}
                  disabled={points < crop.seedCost}
                  onClick={() => buySeed(cropId)}
                  size="sm"
                  variant="outline"
                >
                  Buy seed <Coins aria-hidden size={13} /> {crop.seedCost}
                </Button>
              )}
            </Item>
          );
        })}
        <Item>
          <Name>
            <span aria-hidden>🧪</span> Grow tonic
          </Name>
          <Meta>Every growing crop · a day further along</Meta>
          <Blurb>
            A splash for the whole farm. Ripe crops don’t need it, and the price
            climbs with each bottle bought today.
          </Blurb>
          {tonicCost === null ? (
            <Meta>Sold out for today — back tomorrow.</Meta>
          ) : canBuyGrowTonic(state, today) ? (
            <Button
              aria-label={`Buy grow tonic for ${tonicCost} points`}
              disabled={points < tonicCost}
              onClick={buyGrowTonic}
              size="sm"
              variant="outline"
            >
              Buy tonic <Coins aria-hidden size={13} /> {tonicCost}
            </Button>
          ) : (
            <Meta>Nothing is growing right now.</Meta>
          )}
        </Item>
      </Grid>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
  gap: 0.75rem;
`;

const Item = styled.article`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  padding: 0.85rem;
  border-radius: 10px;
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const Name = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const Meta = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Blurb = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;
