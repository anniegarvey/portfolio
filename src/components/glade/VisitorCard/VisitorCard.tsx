"use client";

import { styled } from "next-yak";
import { type RefObject, useId, useRef } from "react";
import { Button } from "@/components/Button";
import { CreatureSVG } from "@/components/glade/CreatureSVG";
import { UnlockNotice } from "@/components/glade/UnlockNotice";
import { Toggletip } from "@/components/Toggletip";
import {
  ALL_TREAT_IDS,
  PET_SPOT_LABELS,
  POSTURE_LABELS,
  RECIPES,
  SPECIES,
  type SpeciesConfig,
  tameThresholdFor,
} from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type {
  GladeState,
  PetSpot,
  Posture,
  PreferenceKind,
  TreatId,
  WildVisitor,
} from "@/lib/glade/schema";
import {
  isConfirmedHintUnlocked,
  isSkillUnlocked,
  isToggletipVisible,
  isTriedLogUnlocked,
  isVagueHintUnlocked,
} from "@/lib/glade/skillsModule";

const POSTURES = Object.keys(POSTURE_LABELS) as Posture[];
const PET_SPOTS = Object.keys(PET_SPOT_LABELS) as PetSpot[];

const PREFERENCE_KINDS: PreferenceKind[] = ["treat", "posture", "petSpot"];

const PREFERENCE_LABELS: Record<PreferenceKind, string> = {
  treat: "Favourite treat",
  posture: "Preferred posture",
  petSpot: "Preferred pet spot",
};

const VAGUE_HINT: Record<PreferenceKind, (species: SpeciesConfig) => string> = {
  treat: (species) => species.vagueTreatHint,
  posture: (species) => species.vaguePostureHint,
  petSpot: (species) => species.vaguePetSpotHint,
};

const CLEAR_HINT: Record<PreferenceKind, (species: SpeciesConfig) => string> = {
  treat: (species) => species.clearTreatHint,
  posture: (species) => species.clearPostureHint,
  petSpot: (species) => species.clearPetSpotHint,
};

/** Every option for a preference type, used to render the tier-4 elimination log. */
const PREFERENCE_OPTIONS: Record<
  PreferenceKind,
  { value: string; label: string }[]
> = {
  treat: ALL_TREAT_IDS.map((id) => ({ value: id, label: RECIPES[id].name })),
  posture: POSTURES.map((p) => ({ value: p, label: POSTURE_LABELS[p] })),
  petSpot: PET_SPOTS.map((s) => ({ value: s, label: PET_SPOT_LABELS[s] })),
};

/** Preference kinds whose vague hint is currently visible for this species. */
function visibleHintKinds(state: GladeState): PreferenceKind[] {
  return PREFERENCE_KINDS.filter((kind) => isVagueHintUnlocked(state, kind));
}

export function VisitorCard({ visitor }: { visitor: WildVisitor }) {
  const { state, lastAction, approachVisitor } = useGlade();
  const headingId = useId();
  const portraitRef = useRef<HTMLDivElement>(null);

  const species = SPECIES[visitor.speciesId];
  const threshold = tameThresholdFor(visitor.speciesId);
  const trustPct = Math.round((visitor.trust / threshold) * 100);
  const hintKinds = visibleHintKinds(state);

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
    <Card aria-labelledby={headingId}>
      <Portrait ref={portraitRef}>
        <CreatureSVG size={72} speciesId={visitor.speciesId} />
      </Portrait>
      <Name id={headingId}>
        {species.name} <Rarity>· {species.rarity}</Rarity>
      </Name>
      <Blurb>{species.blurb}</Blurb>
      {hintKinds.map((kind) => (
        <Hint key={kind}>{VAGUE_HINT[kind](species)}</Hint>
      ))}
      {isToggletipVisible(state) && (
        <ToggletipRow>
          <Toggletip
            content={<PreferenceDetails species={species} visitor={visitor} />}
            label="Preference details"
          />
        </ToggletipRow>
      )}

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
                      portraitRef.current?.getBoundingClientRect(),
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

        <PetActionGroup portraitRef={portraitRef} visitor={visitor} />

        <TreatActionGroup portraitRef={portraitRef} visitor={visitor} />
      </Actions>
    </Card>
  );
}

function PetActionGroup({
  visitor,
  portraitRef,
}: {
  visitor: WildVisitor;
  portraitRef: RefObject<HTMLDivElement | null>;
}) {
  const { state, petVisitor } = useGlade();
  const petUnlocked = isSkillUnlocked(state, "petting-technique");

  return (
    <ActionGroup>
      <GroupLabel>Pet</GroupLabel>
      {!petUnlocked ? (
        <UnlockNotice skillId="petting-technique" />
      ) : visitor.actionsToday.pet ? (
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
                  portraitRef.current?.getBoundingClientRect(),
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
  );
}

function TreatActionGroup({
  visitor,
  portraitRef,
}: {
  visitor: WildVisitor;
  portraitRef: RefObject<HTMLDivElement | null>;
}) {
  const { state, offerTreat } = useGlade();
  const treatUnlocked = isSkillUnlocked(state, "treat-cooking");
  const availableTreats = ALL_TREAT_IDS.filter(
    (id) => (state.pantry.treats[id] ?? 0) > 0,
  );

  return (
    <ActionGroup>
      <GroupLabel>Offer a treat</GroupLabel>
      {!treatUnlocked ? (
        <UnlockNotice skillId="treat-cooking" />
      ) : visitor.actionsToday.treat ? (
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
                  portraitRef.current?.getBoundingClientRect(),
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
  );
}

/**
 * The shared toggletip's content: one section per currently-visible
 * preference type. Each section's own depth (nothing / confirmed hint /
 * full tried-vs-untried log) tracks that type's own skill tier independently
 * of what triggered the toggletip's overall visibility.
 */
function PreferenceDetails({
  species,
  visitor,
}: {
  species: SpeciesConfig;
  visitor: WildVisitor;
}) {
  const { state } = useGlade();
  const baseId = useId();
  const discovered = state.discoveredPreferences[visitor.speciesId];
  const tried = state.triedPreferences[visitor.speciesId];

  return (
    <DetailsList>
      {visibleHintKinds(state).map((kind) => {
        const labelId = `${baseId}-${kind}`;
        return (
          <DetailsSection aria-labelledby={labelId} key={kind} role="group">
            <DetailsLabel id={labelId}>{PREFERENCE_LABELS[kind]}</DetailsLabel>
            {isConfirmedHintUnlocked(state, kind) ? (
              discovered?.[kind] ? (
                <DetailsHint>{CLEAR_HINT[kind](species)}</DetailsHint>
              ) : (
                <DetailsPlaceholder>Not yet confirmed.</DetailsPlaceholder>
              )
            ) : (
              <DetailsPlaceholder>
                Keep training to learn more.
              </DetailsPlaceholder>
            )}
            {isTriedLogUnlocked(state, kind) && (
              <TriedList kind={kind} tried={tried?.[kind] ?? []} />
            )}
          </DetailsSection>
        );
      })}
    </DetailsList>
  );
}

/** Every option for a preference type, marked tried or not — an elimination aid. */
function TriedList({ kind, tried }: { kind: PreferenceKind; tried: string[] }) {
  return (
    <TriedItems>
      {PREFERENCE_OPTIONS[kind].map(({ value, label }) => (
        <TriedItem data-tried={tried.includes(value)} key={value}>
          {label} — {tried.includes(value) ? "tried" : "not yet tried"}
        </TriedItem>
      ))}
    </TriedItems>
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

const ToggletipRow = styled.div`
  display: flex;
`;

const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-align: left;
`;

const DetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const DetailsLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const DetailsHint = styled.span`
  font-size: 0.85rem;
`;

const DetailsPlaceholder = styled.span`
  font-size: 0.85rem;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const TriedItems = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const TriedItem = styled.li`
  font-size: 0.8rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: light-dark(var(--color-grey-100), var(--color-grey-700));

  &[data-tried="true"] {
    color: light-dark(var(--color-grey-600), var(--color-grey-400));
  }
`;
