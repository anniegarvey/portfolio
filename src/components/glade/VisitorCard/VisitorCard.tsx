"use client";

import { Lightbulb } from "lucide-react";
import { keyframes, styled } from "next-yak";
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
import type { ActionKind, VisitorActionResult } from "@/lib/glade/context";
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

// Ordered to match the taming skill unlock sequence (body-language →
// petting-technique → treat-cooking), the same order actions appear in below.
const PREFERENCE_KINDS: PreferenceKind[] = ["posture", "petSpot", "treat"];

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

/**
 * Which of this visitor's action groups the last action just spent, if any.
 * Narrower than "something happened on this card": that would mark every
 * group the visitor has already spent today, so acting on another visitor and
 * coming back would replay the entrance on a note that had been sitting there
 * for two actions. Null on a page load, where nothing has just happened.
 */
function justClosedBy(
  lastAction: VisitorActionResult | null,
  visitorId: string,
): ActionKind | null {
  if (lastAction === null || lastAction.visitorId !== visitorId) return null;
  return lastAction.kind;
}

export function VisitorCard({ visitor }: { visitor: WildVisitor }) {
  const { state, lastAction, approachVisitor } = useGlade();
  const headingId = useId();
  const portraitRef = useRef<HTMLDivElement>(null);

  const species = SPECIES[visitor.speciesId];
  const threshold = tameThresholdFor(visitor.speciesId);
  const trustPct = Math.round((visitor.trust / threshold) * 100);
  const hintKinds = visibleHintKinds(state);
  const toggletipVisible = isToggletipVisible(state);

  // Feedback for the most recent action, only on the card it was taken on
  const actedOnThisVisitor =
    lastAction !== null && lastAction.visitorId === visitor.id;
  const justClosed = justClosedBy(lastAction, visitor.id);
  const feedback =
    actedOnThisVisitor && lastAction.trustGained !== null
      ? lastAction.matched
        ? `+${lastAction.trustGained} trust — just right!`
        : `+${lastAction.trustGained} trust`
      : null;
  // Changes with every action taken on this visitor (each one flips a
  // different flag), which is enough to remount the visible feedback so it
  // plays again on the second and third action of the day rather than
  // swapping its text in place. It resets with the flags on a new day; only
  // that it changes matters, not that it grows.
  const actionsTaken = Object.values(visitor.actionsToday).filter(
    Boolean,
  ).length;

  return (
    <Card aria-labelledby={headingId}>
      <Portrait ref={portraitRef}>
        <CreatureSVG size={72} speciesId={visitor.speciesId} />
      </Portrait>
      <Name id={headingId}>
        {species.name} <Rarity>· {species.rarity}</Rarity>
      </Name>
      <Blurb>{species.blurb}</Blurb>
      {/* Once the toggletip exists, every vague hint moves inside it (see
          PreferenceDetails) rather than sitting here too — a card with three
          hints stacked above an already-open toggletip was most of its
          height on mobile, saying half of it twice. */}
      {!toggletipVisible &&
        hintKinds.map((kind) => (
          <Hint key={kind}>{VAGUE_HINT[kind](species)}</Hint>
        ))}
      {toggletipVisible && (
        <ToggletipRow>
          <Toggletip
            content={<PreferenceDetails species={species} visitor={visitor} />}
            icon={<Lightbulb aria-hidden size={16} />}
            label="Hints"
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
        {/* One pass of light along the bar the moment it grows — the meter
            reads as something that just happened, not something that is. */}
        {feedback !== null && (
          <TrustSweep aria-hidden="true" key={actionsTaken} />
        )}
      </TrustTrack>
      <TrustLabel>
        Trust {visitor.trust}/{threshold}
      </TrustLabel>

      {/* The announcement and the visible text are separate on purpose. A
          live region is only announced when its contents change while it is
          already mounted, and the visible line is remounted every action so
          it can replay its entrance — which would silence every action after
          the first. This one stays mounted and out of the layout. */}
      {/* A bare live region rather than role="status", which the preference
          toggletip on this same card already uses — two status roles per
          visitor is noise in the accessibility tree. */}
      <FeedbackAnnouncement aria-atomic="true" aria-live="polite">
        {feedback ?? ""}
      </FeedbackAnnouncement>
      {feedback !== null && (
        <Feedback aria-hidden="true" key={actionsTaken}>
          {feedback}
        </Feedback>
      )}

      <Actions>
        <ActionGroup>
          <GroupLabel>Approach</GroupLabel>
          {visitor.actionsToday.approach ? (
            <Done data-fresh={justClosed === "approach" || undefined}>
              Approached today
            </Done>
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
  const { state, lastAction, petVisitor } = useGlade();
  const petUnlocked = isSkillUnlocked(state, "petting-technique");

  return (
    <ActionGroup>
      <GroupLabel>Pet</GroupLabel>
      {!petUnlocked ? (
        <UnlockNotice skillId="petting-technique" />
      ) : visitor.actionsToday.pet ? (
        <Done
          data-fresh={
            justClosedBy(lastAction, visitor.id) === "pet" || undefined
          }
        >
          Petted today
        </Done>
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
  const { state, lastAction, offerTreat } = useGlade();
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
        <Done
          data-fresh={
            justClosedBy(lastAction, visitor.id) === "treat" || undefined
          }
        >
          Fed for today
        </Done>
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
              // Every kind reaching this map is already vague-hint-unlocked
              // (visibleHintKinds filters on it), so there is always a real
              // hint to show here rather than a placeholder.
              <DetailsHint>{VAGUE_HINT[kind](species)}</DetailsHint>
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
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: light-dark(var(--color-grey-200), var(--color-grey-700));
  overflow: hidden;
`;

const TrustFill = styled.div`
  height: 100%;
  border-radius: 4px;
  background: light-dark(var(--color-primary-500), var(--color-primary-400));
  transition: width 420ms var(--ease-out);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const trustSweep = keyframes`
  from { transform: translateX(-100%); }
  to   { transform: translateX(100%); }
`;

const TrustSweep = styled.span`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    light-dark(
      color-mix(in oklch, white 80%, transparent),
      color-mix(in oklch, var(--color-primary-200) 55%, transparent)
    ),
    transparent
  );
  animation: ${trustSweep} 700ms var(--ease-out) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0;
  }
`;

const TrustLabel = styled.span`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* Out of the flow entirely, so an always-mounted region costs no layout. */
const FeedbackAnnouncement = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const Feedback = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-700), var(--color-primary-400));
  animation: ${riseIn} 220ms var(--ease-out) both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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

/* Only what the last action just closed off animates. On a page load where
   the day's actions are already spent, all three are simply there. */
const Done = styled.span`
  font-size: 0.85rem;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));

  &[data-fresh="true"] {
    animation: ${riseIn} 240ms var(--ease-out) both;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-fresh="true"] {
      animation: none;
    }
  }
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
