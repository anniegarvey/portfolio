"use client";

import { Coins } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { ALL_CROP_IDS, CROPS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
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
  const { state, buySeed } = useMeadowmere();
  const { points } = usePoints();

  return (
    <Modal
      description="Seeds are bought with points earned in the Energy Planner. Nothing here pays points back."
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
      </Grid>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
