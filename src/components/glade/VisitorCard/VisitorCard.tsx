"use client";

import { styled } from "next-yak";
import { useId, useRef } from "react";
import { Button } from "@/components/Button";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import {
  ALL_TREAT_IDS,
  PET_SPOT_LABELS,
  POSTURE_LABELS,
  RECIPES,
  SPECIES,
  tameThresholdFor,
} from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type {
  PetSpot,
  Posture,
  TreatId,
  WildVisitor,
} from "@/lib/glade/schema";
import { hasClearHints } from "@/lib/glade/skillsModule";

const POSTURES = Object.keys(POSTURE_LABELS) as Posture[];
const PET_SPOTS = Object.keys(PET_SPOT_LABELS) as PetSpot[];

export function VisitorCard({ visitor }: { visitor: WildVisitor }) {
  const { state, lastAction, offerTreat, approachVisitor, petVisitor } =
    useGlade();
  const headingId = useId();
  const cardRef = useRef<HTMLElement>(null);

  const species = SPECIES[visitor.speciesId];
  const threshold = tameThresholdFor(visitor.speciesId);
  const trustPct = Math.round((visitor.trust / threshold) * 100);
  const availableTreats = ALL_TREAT_IDS.filter(
    (id) => (state.pantry.treats[id] ?? 0) > 0,
  );

  // Feedback for the most recent action, only on the card it was taken on
  const feedback =
    lastAction !== null &&
    lastAction.visitorId === visitor.id &&
    lastAction.trustGained !== null
      ? lastAction.matched
        ? `+${lastAction.trustGained} trust — just right!`
        : `+${lastAction.trustGained} trust`
      : null;

  return (
    <Card aria-labelledby={headingId} ref={cardRef}>
      <Portrait>
        <CreatureSVG size={72} speciesId={visitor.speciesId} />
      </Portrait>
      <Name id={headingId}>
        {species.name} <Rarity>· {species.rarity}</Rarity>
      </Name>
      <Blurb>{species.blurb}</Blurb>
      <Hint>
        {hasClearHints(state) ? species.clearHint : species.vagueHint}
      </Hint>

      <TrustTrack
        aria-label={`Trust: ${visitor.trust} of ${threshold}`}
        aria-valuemax={threshold}
        aria-valuemin={0}
        aria-valuenow={visitor.trust}
        role="meter"
      >
        <TrustFill style={{ width: `${trustPct}%` }} />
      </TrustTrack>
      <TrustLabel>
        Trust {visitor.trust}/{threshold}
      </TrustLabel>

      {feedback !== null && <Feedback role="status">{feedback}</Feedback>}

      <Actions>
        <ActionGroup>
          <GroupLabel>Offer a treat</GroupLabel>
          {visitor.actionsToday.treat ? (
            <Done>Fed for today</Done>
          ) : availableTreats.length === 0 ? (
            <Done>No treats cooked yet</Done>
          ) : (
            <ChoiceRow>
              {availableTreats.map((treatId: TreatId) => (
                <Button
                  key={treatId}
                  onClick={() =>
                    offerTreat(
                      visitor.id,
                      treatId,
                      cardRef.current?.getBoundingClientRect(),
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  {RECIPES[treatId].name} ×{state.pantry.treats[treatId]}
                </Button>
              ))}
            </ChoiceRow>
          )}
        </ActionGroup>

        <ActionGroup>
          <GroupLabel>Approach</GroupLabel>
          {visitor.actionsToday.approach ? (
            <Done>Approached today</Done>
          ) : (
            <ChoiceRow>
              {POSTURES.map((posture) => (
                <Button
                  key={posture}
                  onClick={() =>
                    approachVisitor(
                      visitor.id,
                      posture,
                      cardRef.current?.getBoundingClientRect(),
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  {POSTURE_LABELS[posture]}
                </Button>
              ))}
            </ChoiceRow>
          )}
        </ActionGroup>

        <ActionGroup>
          <GroupLabel>Pet</GroupLabel>
          {visitor.actionsToday.pet ? (
            <Done>Petted today</Done>
          ) : (
            <ChoiceRow>
              {PET_SPOTS.map((spot) => (
                <Button
                  key={spot}
                  onClick={() =>
                    petVisitor(
                      visitor.id,
                      spot,
                      cardRef.current?.getBoundingClientRect(),
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  {PET_SPOT_LABELS[spot]}
                </Button>
              ))}
            </ChoiceRow>
          )}
        </ActionGroup>
      </Actions>
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const Portrait = styled.div`
  display: grid;
  place-items: center;
  padding: 0.25rem;
  border-radius: 10px;
  background: light-dark(#eaf3e2, var(--color-grey-900));
`;

const Name = styled.h3`
  margin: 0;
  font-size: 1.15rem;
`;

const Rarity = styled.span`
  font-size: 0.85rem;
  font-weight: 400;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
  text-transform: capitalize;
`;

const Blurb = styled.p`
  margin: 0;
  font-size: 0.9rem;
`;

const Hint = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const TrustTrack = styled.div`
  height: 8px;
  border-radius: 4px;
  background: light-dark(var(--color-grey-200), var(--color-grey-700));
  overflow: hidden;
`;

const TrustFill = styled.div`
  height: 100%;
  border-radius: 4px;
  background: light-dark(var(--color-primary-500), var(--color-primary-400));
  transition: width 300ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const TrustLabel = styled.span`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Feedback = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-700), var(--color-primary-400));
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.25rem;
`;

const ActionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const GroupLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const ChoiceRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const Done = styled.span`
  font-size: 0.85rem;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
