"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { keyframes, styled } from "next-yak";
import { useEffect, useId, useRef, useState } from "react";
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
  nextTier,
} from "@/lib/meadowmere/neighboursModule";
import type { ItemId, NeighbourId } from "@/lib/meadowmere/schema";

/** "a Friend" / "an Acquaintance" — tier names are the only nouns this sees. */
function withArticle(tierName: string): string {
  return `${/^[aeiou]/i.test(tierName) ? "an" : "a"} ${tierName}`;
}

/**
 * " (+12 friendship)", or nothing at all once a neighbour is as close as they
 * get. Somebody already at the top of the bar still likes the gift; claiming
 * they warmed to you by nothing would be worse than not mentioning it.
 */
function describeGain(gained: number): string {
  return gained > 0 ? ` (+${gained} friendship)` : "";
}

export function NeighbourCard({ neighbourId }: { neighbourId: NeighbourId }) {
  const { state, notice, giveGift } = useMeadowmere();
  // "" rather than null so the Select is controlled from the first render
  // (Radix warns when a value flips from undefined to defined).
  const [chosenItemId, setChosenItemId] = useState<ItemId | "">("");
  // Giving disables the button that was focused, so focus the reaction it
  // produced rather than letting focus fall back to the dialog.
  const [justGave, setJustGave] = useState(false);
  const reactionRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (justGave) reactionRef.current?.focus();
  }, [justGave]);
  const giftLabelId = useId();

  const neighbour = NEIGHBOURS[neighbourId];
  const friendship = friendshipOf(state, neighbourId);
  const today = getTodayDateString();
  const giftedToday = neighbourState(state, neighbourId).lastGiftDate === today;

  const holdings = Object.entries(state.inventory)
    .filter(([, count]) => count > 0)
    .map(([itemId]) => ITEMS[itemId as ItemId]);

  const giftable =
    chosenItemId !== "" && canGift(state, neighbourId, chosenItemId, today);

  // The one notice this card speaks for, so what it says and whether the bar
  // acknowledges it can't disagree.
  const gift =
    notice?.kind === "gift" && notice.neighbourId === neighbourId
      ? notice
      : null;
  const reaction =
    gift === null
      ? ""
      : `${neighbour.name} ${gift.liked ? "loved" : "accepted"} the ${ITEMS[gift.itemId].name.toLowerCase()}${describeGain(gift.friendshipGained)}${
          gift.newTierName ? ` — now ${withArticle(gift.newTierName)}!` : ""
        }`;

  return (
    // The neighbour's name titles the dialog this sits in, so the header only
    // has to say who they are beyond it.
    <Card>
      <Header>
        <Glyph aria-hidden>{neighbour.glyph}</Glyph>
        <Role>{neighbour.role}</Role>
      </Header>

      <Blurb>{neighbour.blurb}</Blurb>

      <FriendshipMeter
        friendship={friendship}
        justGrew={gift !== null && gift.friendshipGained > 0}
        neighbourName={neighbour.name}
      />

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
            <SelectValue placeholder="Choose a gift…" />
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
            setJustGave(true);
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
          ? `You’ve already given ${neighbour.name} something today.`
          : holdings.length === 0
            ? "Nothing to give yet — harvest or forage something first."
            : "One gift per neighbour per day."}
      </GiftHint>

      {/* Kept mounted and animated on an attribute rather than remounted on a
          key: this one element is the live region, the visible line and the
          focus target all at once, and a remount would lose the announcement
          and the focus it has just been given. */}
      <Reaction
        aria-atomic="true"
        aria-live="polite"
        data-shown={reaction === "" ? undefined : true}
        ref={reactionRef}
        tabIndex={reaction === "" ? undefined : -1}
      >
        {reaction}
      </Reaction>
    </Card>
  );
}

/**
 * How things stand with a neighbour: where they are, how full the bar is, and
 * what is next. The bar, the number beside it and what a screen reader is told
 * all count the same thing out of the same total — they used to disagree, with
 * the bar running to a hundred while the number counted to the next tier, so a
 * bar a twentieth full sat next to the text "5/20".
 */
function FriendshipMeter({
  friendship,
  neighbourName,
  justGrew,
}: {
  friendship: number;
  neighbourName: string;
  /** True only when a gift has just moved the bar, which is when it lights up. */
  justGrew: boolean;
}) {
  const tier = friendshipTier(friendship);
  const next = nextTier(friendship);

  return (
    <>
      <TierRow>
        <TierName>{tier.name}</TierName>
        <TierMeta>
          {friendship}/{MAX_FRIENDSHIP}
        </TierMeta>
      </TierRow>
      {/* A meter, not a progress bar: friendship is a level you are at, not a
          task running to completion. The glade's trust meter says the same. */}
      <FriendshipTrack
        aria-label={`Friendship with ${neighbourName}: ${friendship} of ${MAX_FRIENDSHIP}`}
        aria-valuemax={MAX_FRIENDSHIP}
        aria-valuemin={0}
        aria-valuenow={friendship}
        role="meter"
      >
        <FriendshipFill
          style={{ width: `${(friendship / MAX_FRIENDSHIP) * 100}%` }}
        />
        {/* One pass of light along the bar the moment it grows, as the glade's
            trust meter does. No remount key: a neighbour takes one gift a day,
            so this mounts once and plays once. Guarded on the gain, or the bar
            would flash at a neighbour who is already as close as they get. */}
        {justGrew && <FriendshipSweep aria-hidden="true" />}
      </FriendshipTrack>
      {/* What the tier fraction used to carry, in words. Leaving it out at the
          top says the same thing as anything we could write there. */}
      {next !== null && (
        <ToNextTier>
          {next.threshold - friendship} more to {next.name}
        </ToNextTier>
      )}
    </>
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
  position: relative;
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
  transition: width 420ms var(--ease-out);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const friendshipSweep = keyframes`
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
`;

const FriendshipSweep = styled.span`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    light-dark(
      color-mix(in oklch, white 80%, transparent),
      color-mix(in oklch, var(--color-orange-200) 55%, transparent)
    ),
    transparent
  );
  animation: ${friendshipSweep} 700ms var(--ease-out) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0;
  }
`;

/* Sits under the bar it explains, tight to it — the gap the card gives every
   other row would read as a line about something else. */
const ToNextTier = styled.span`
  margin-top: -0.25rem;
  font-size: 0.78rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
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

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Reaction = styled.p`
  margin: 0;
  min-height: 1.2rem;
  font-size: 0.83rem;
  font-weight: 600;
  color: light-dark(var(--color-secondary-700), var(--color-secondary-300));

  /* Fires when the attribute appears, which is the moment the reaction has
     something to say — the element itself never leaves the tree. */
  &[data-shown="true"] {
    animation: ${riseIn} 220ms var(--ease-out) both;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-shown="true"] {
      animation: none;
    }
  }
`;
