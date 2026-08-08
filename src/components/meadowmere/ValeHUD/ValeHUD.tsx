"use client";

import { Coins, Footprints, ScrollText, Sprout } from "lucide-react";
import { styled } from "next-yak";
import { useId, useState } from "react";
import { Modal } from "@/components/Modal";
import { QuestLog } from "@/components/meadowmere/QuestLog";
import { ALL_CROP_IDS, CROPS, ITEMS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import { foragesLeft } from "@/lib/meadowmere/foragingModule";
import { seedCount } from "@/lib/meadowmere/inventory";
import { questStatus, visibleQuests } from "@/lib/meadowmere/questsModule";
import type { CropId, ItemId } from "@/lib/meadowmere/schema";
import { usePoints } from "@/lib/points/context";

/**
 * The band above the map: what the farmer is carrying and which seed is in
 * hand. The chosen seed is what gets sown into the next bare plot the farmer
 * uses, so it belongs here rather than inside a dialog.
 */
export interface ValeHUDProps {
  selectedCropId: CropId | null;
  onSelectCrop: (cropId: CropId | null) => void;
}

/**
 * What a forage trip is and what it buys you. Fixed wording, because it is the
 * loop rather than the state that needs explaining.
 */
const FORAGING_HINT =
  "Walk up to a wild place and use it to spend a trip and bring a material " +
  "home. Materials are what neighbours want as gifts and what quests ask for. " +
  "Trips refill each morning, and more places open up as quests are handed in.";

/**
 * The next step of sowing, in the state the pouch is currently in. Sowing the
 * last packet leaves that seed still in hand with nothing behind it, and the
 * chip goes disabled — so the run-out has to be named here rather than left
 * to a hint telling the player to sow a seed they haven't got.
 */
function sowingHint(selectedCropId: CropId | null, count: number): string {
  if (selectedCropId === null) {
    return "Pick a seed, then tap or click a bare plot to sow it.";
  }
  const { name } = CROPS[selectedCropId];
  return count === 0
    ? `No ${name} seed left — buy more at the stall.`
    : `Now tap or click a bare plot to sow ${name}.`;
}

export function ValeHUD({ selectedCropId, onSelectCrop }: ValeHUDProps) {
  const { state } = useMeadowmere();
  const { points } = usePoints();
  const [questsOpen, setQuestsOpen] = useState(false);
  // Each region is named by the heading it already shows, so a screen reader
  // doesn't announce a region and a heading as two unrelated things.
  const pouchId = useId();
  const larderId = useId();

  const unlocked = ALL_CROP_IDS.filter((id) =>
    state.unlockedCropIds.includes(id),
  );
  const larder = Object.entries(state.inventory).filter(
    ([, count]) => (count ?? 0) > 0,
  ) as [ItemId, number][];
  const readyQuests = visibleQuests(state).filter(
    (quest) => questStatus(state, quest.id) === "ready",
  ).length;
  const seedsInHand =
    selectedCropId === null ? 0 : seedCount(state, selectedCropId);

  return (
    <Bar>
      <Group>
        <Stat>
          <Coins aria-hidden size={15} />
          {points} points
        </Stat>
        <Stat>
          <Footprints aria-hidden size={15} />
          {foragesLeft(state)} forage trips left
        </Stat>
        <QuestsButton onClick={() => setQuestsOpen(true)} type="button">
          <ScrollText aria-hidden size={15} />
          Quest journal
          {readyQuests > 0 && (
            <ReadyPip>{readyQuests} ready to hand in</ReadyPip>
          )}
        </QuestsButton>
        {/* A trip counter says how many are left but nothing about what they are
            for. Foraging is the one loop with no visible cause and effect — you
            spend a trip and an item you have never heard of appears in the
            larder — so what it earns and when it comes back are said out loud. */}
        <Hint>{FORAGING_HINT}</Hint>
      </Group>

      <Section aria-labelledby={pouchId}>
        <GroupLabel id={pouchId}>
          <Sprout aria-hidden size={15} />
          Seed in hand
        </GroupLabel>
        {unlocked.length === 0 ? (
          <Muted>No seeds yet — buy some at the stall.</Muted>
        ) : (
          <>
            {unlocked.map((cropId) => {
              const count = seedCount(state, cropId);
              const selected = selectedCropId === cropId;
              return (
                <SeedChip
                  aria-label={`${CROPS[cropId].name}, ${count} ${count === 1 ? "seed" : "seeds"}`}
                  aria-pressed={selected}
                  disabled={count === 0}
                  key={cropId}
                  onClick={() => onSelectCrop(selected ? null : cropId)}
                  type="button"
                >
                  <span aria-hidden>{CROPS[cropId].glyph}</span>
                  <span aria-hidden>
                    {CROPS[cropId].name} ×{count}
                  </span>
                </SeedChip>
              );
            })}
            {/* Sowing is two steps and only the second one happens on the map,
                so the first says out loud what it is for. */}
            <Hint>{sowingHint(selectedCropId, seedsInHand)}</Hint>
          </>
        )}
      </Section>

      <Section aria-labelledby={larderId}>
        <GroupLabel id={larderId}>Larder</GroupLabel>
        {larder.length === 0 ? (
          <Muted>Empty.</Muted>
        ) : (
          larder.map(([itemId, count]) => (
            <Holding key={itemId}>
              <span aria-hidden>{ITEMS[itemId].glyph}</span>
              {ITEMS[itemId].name} ×{count}
            </Holding>
          ))
        )}
      </Section>

      <Modal
        description="Every objective the neighbours have set, and how far along each one is."
        isOpen={questsOpen}
        onClose={() => setQuestsOpen(false)}
        title="Quest journal"
      >
        <QuestLog />
      </Modal>
    </Bar>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Bar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Section = styled.section`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const GroupLabel = styled.h2`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Stat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-200));
`;

const Muted = styled.span`
  font-size: 0.9rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

/** Its own line under the chips, so it reads as a step rather than a chip. */
const Hint = styled(Muted)`
  flex-basis: 100%;
`;

const Holding = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
  background: light-dark(var(--color-grey-100), var(--color-grey-800));
  color: light-dark(var(--color-grey-800), var(--color-grey-200));
`;

const QuestsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  color: light-dark(var(--color-grey-800), var(--color-grey-200));

  /* Guarded, or the highlight sticks after a tap — there is no pointer to move
     away and clear it. */
  @media (hover: hover) {
    &:hover {
      border-color: light-dark(var(--color-grey-500), var(--color-grey-400));
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }
`;

const ReadyPip = styled.span`
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: light-dark(var(--color-orange-600), var(--color-orange-400));
  color: light-dark(#fff, var(--color-grey-900));
`;

const SeedChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  font-size: 0.9rem;
  cursor: pointer;
  border: 2px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  color: light-dark(var(--color-grey-800), var(--color-grey-200));

  &[aria-pressed="true"] {
    border-color: light-dark(var(--color-orange-600), var(--color-orange-400));
    background: light-dark(var(--color-orange-50), var(--color-grey-700));
  }

  @media (hover: hover) {
    &:hover:not(:disabled) {
      border-color: light-dark(var(--color-grey-500), var(--color-grey-400));
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-400);
    outline-offset: 2px;
  }
`;
