"use client";

import { styled } from "next-yak";
import { useId } from "react";
import { Button } from "@/components/Button";
import { INGREDIENTS, SPECIES } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type { IngredientId } from "@/lib/glade/schema";

/** "Berries" / "Berries ×2" / "Berries and Honey" */
function describeGathered(ingredientIds: IngredientId[]): string {
  const counts = new Map<IngredientId, number>();
  for (const id of ingredientIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const parts = [...counts].map(
    ([id, n]) => `${INGREDIENTS[id].name}${n > 1 ? ` ×${n}` : ""}`,
  );
  return parts.join(" and ");
}

export function DailyDigest() {
  const { state, dailyReport, clearDailyReport } = useGlade();
  const headingId = useId();

  if (dailyReport === null) return null;
  const { soothedTrust, soothedVisitors, foraged, arrivalSpeciesId } =
    dailyReport;

  const lines: { key: string; text: string }[] = [];

  if (arrivalSpeciesId !== null) {
    lines.push({
      key: "arrival",
      text: `A wild ${SPECIES[arrivalSpeciesId].name} wandered in!`,
    });
  }

  // Group forage events by resident so a wellspring's two gifts read as one line.
  const byResident = new Map<string, IngredientId[]>();
  for (const event of foraged) {
    const list = byResident.get(event.residentId) ?? [];
    list.push(event.ingredientId);
    byResident.set(event.residentId, list);
  }
  const residentById = new Map(state.residents.map((r) => [r.id, r]));
  for (const [residentId, ingredientIds] of byResident) {
    const resident = residentById.get(residentId);
    if (!resident) continue;
    const name = resident.name ?? SPECIES[resident.speciesId].name;
    lines.push({
      key: residentId,
      text: `${name} gathered ${describeGathered(ingredientIds)}`,
    });
  }

  if (soothedTrust > 0 && soothedVisitors > 0) {
    lines.push({
      key: "soothe",
      text: `Your soothers calmed ${soothedVisitors} wild visitor${
        soothedVisitors === 1 ? "" : "s"
      } (+${soothedTrust} trust)`,
    });
  }

  if (lines.length === 0) return null;

  return (
    <Panel aria-labelledby={headingId}>
      <Heading id={headingId}>Overnight in the glade</Heading>
      <EventList>
        {lines.map((line) => (
          <li key={line.key}>{line.text}</li>
        ))}
      </EventList>
      <Button onClick={clearDailyReport} size="sm" variant="ghost">
        Dismiss
      </Button>
    </Panel>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid
    light-dark(var(--color-primary-300), var(--color-primary-700));
`;

const Heading = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const EventList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;
