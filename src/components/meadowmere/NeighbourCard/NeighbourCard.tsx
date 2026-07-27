"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { styled } from "next-yak";
import { useId, useState } from "react";
import { Button } from "@/components/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { getTodayDateString } from "@/lib/date";
import { ITEMS, MAX_FRIENDSHIP, NEIGHBOURS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import {
  canGift,
  friendshipOf,
  friendshipTier,
  neighbourState,
  nextTierThreshold,
} from "@/lib/meadowmere/neighboursModule";
import type { ItemId, NeighbourId } from "@/lib/meadowmere/schema";

/** "a Friend" / "an Acquaintance" — tier names are the only nouns this sees. */
function withArticle(tierName: string): string {
  return `${/^[aeiou]/i.test(tierName) ? "an" : "a"} ${tierName}`;
}

export function NeighbourCard({ neighbourId }: { neighbourId: NeighbourId }) {
  const { state, notice, giveGift } = useMeadowmere();
  // "" rather than null so the Select is controlled from the first render
  // (Radix warns when a value flips from undefined to defined).
  const [chosenItemId, setChosenItemId] = useState<ItemId | "">("");
  const giftLabelId = useId();
  const nameId = useId();

  const neighbour = NEIGHBOURS[neighbourId];
  const friendship = friendshipOf(state, neighbourId);
  const tier = friendshipTier(friendship);
  const nextThreshold = nextTierThreshold(friendship);
  const today = getTodayDateString();
  const giftedToday = neighbourState(state, neighbourId).lastGiftDate === today;

  const holdings = Object.entries(state.inventory)
    .filter(([, count]) => count > 0)
    .map(([itemId]) => ITEMS[itemId as ItemId]);

  const giftable =
    chosenItemId !== "" && canGift(state, neighbourId, chosenItemId, today);

  const reaction =
    notice?.kind === "gift" && notice.neighbourId === neighbourId
      ? `${neighbour.name} ${notice.liked ? "loved" : "accepted"} the ${ITEMS[notice.itemId].name.toLowerCase()} (+${notice.friendshipGained} friendship)${
          notice.newTierName ? ` — now ${withArticle(notice.newTierName)}!` : ""
        }`
      : "";

  return (
    <Card aria-labelledby={nameId}>
      <Header>
        <Glyph aria-hidden>{neighbour.glyph}</Glyph>
        <div>
          <Name id={nameId}>{neighbour.name}</Name>
          <Role>{neighbour.role}</Role>
        </div>
      </Header>

      <Blurb>{neighbour.blurb}</Blurb>

      <TierRow>
        <TierName>{tier.name}</TierName>
        <TierMeta>
          {nextThreshold === null
            ? `${friendship}/${MAX_FRIENDSHIP}`
            : `${friendship}/${nextThreshold}`}
        </TierMeta>
      </TierRow>
      <FriendshipTrack
        aria-label={`Friendship with ${neighbour.name}`}
        aria-valuemax={MAX_FRIENDSHIP}
        aria-valuemin={0}
        aria-valuenow={friendship}
        role="progressbar"
      >
        <FriendshipFill
          style={{ width: `${(friendship / MAX_FRIENDSHIP) * 100}%` }}
        />
      </FriendshipTrack>

      <Likes>
        Likes: {neighbour.likedItemIds.map((id) => ITEMS[id].name).join(", ")}
      </Likes>

      <GiftRow>
        <VisuallyHidden id={giftLabelId}>
          Gift for {neighbour.name}
        </VisuallyHidden>
        <Select
          disabled={giftedToday || holdings.length === 0}
          onValueChange={(value) => setChosenItemId(value as ItemId)}
          value={chosenItemId}
        >
          <SelectTrigger aria-labelledby={giftLabelId}>
            <SelectValue placeholder="Choose a gift..." />
          </SelectTrigger>
          <SelectContent>
            {holdings.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} ×{state.inventory[item.id]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          disabled={!giftable}
          onClick={() => {
            if (chosenItemId === "") return;
            giveGift(neighbourId, chosenItemId);
            // Clear the choice: giving away the last of an item drops it from
            // the list, which would otherwise leave the trigger showing blank.
            setChosenItemId("");
          }}
          size="sm"
        >
          Give gift
        </Button>
      </GiftRow>

      <GiftHint>
        {giftedToday
          ? `You've already given ${neighbour.name} something today.`
          : holdings.length === 0
            ? "Nothing to give yet — harvest or forage something first."
            : "One gift per neighbour per day."}
      </GiftHint>

      <Reaction aria-atomic="true" aria-live="polite">
        {reaction}
      </Reaction>
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Card = styled.article`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const Glyph = styled.span`
  font-size: 2rem;
  line-height: 1;
`;

const Name = styled.p`
  margin: 0;
  font-weight: 700;
  font-size: 1.05rem;
`;

const Role = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Blurb = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const TierRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 0.15rem;
`;

const TierName = styled.span`
  font-weight: 600;
  font-size: 0.9rem;
`;

const TierMeta = styled.span`
  font-size: 0.78rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const FriendshipTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const FriendshipFill = styled.div`
  height: 100%;
  border-radius: 999px;
  background: light-dark(var(--color-orange-500), var(--color-orange-400));
  transition: width 250ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Likes = styled.span`
  font-size: 0.78rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const GiftRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.25rem;
`;

const GiftHint = styled.span`
  font-size: 0.75rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;

const Reaction = styled.p`
  margin: 0;
  min-height: 1.2rem;
  font-size: 0.83rem;
  font-weight: 600;
  color: light-dark(var(--color-secondary-700), var(--color-secondary-300));
`;
