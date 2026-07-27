"use client";

import { styled } from "next-yak";
import { useId } from "react";
import { Button } from "@/components/Button";
import { CROPS } from "@/lib/meadowmere/catalog";
import { useMeadowmere } from "@/lib/meadowmere/context";
import type { RipenedEntry } from "@/lib/meadowmere/meadowmereEngine";

/** "3 Parsnips" / "1 Pumpkin and 2 Strawberries" */
function describeRipened(ripened: RipenedEntry[]): string {
  const parts = ripened.map(({ cropId, count }) =>
    count === 1 ? `1 ${CROPS[cropId].name}` : `${count} ${CROPS[cropId].name}s`,
  );
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function DailyDigest() {
  const { dailyReport, clearDailyReport } = useMeadowmere();
  const headingId = useId();

  if (dailyReport === null) return null;
  const { daysPassed, ripened, stillGrowing, foragesRefilled } = dailyReport;

  const lines: { key: string; text: string }[] = [];

  if (daysPassed > 1) {
    lines.push({
      key: "away",
      text: `${daysPassed} days have passed since your last visit.`,
    });
  }

  if (ripened.length > 0) {
    lines.push({
      key: "ripened",
      text: `Ready to harvest: ${describeRipened(ripened)}.`,
    });
  }

  if (stillGrowing > 0) {
    lines.push({
      key: "growing",
      text: `${stillGrowing} planting${stillGrowing === 1 ? " is" : "s are"} still coming along.`,
    });
  }

  if (foragesRefilled > 0) {
    lines.push({
      key: "forages",
      text: "Your forage trips have refilled.",
    });
  }

  if (lines.length === 0) return null;

  return (
    <Panel aria-labelledby={headingId}>
      <Heading id={headingId}>Overnight at Meadowmere</Heading>
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
  border: 1px solid light-dark(var(--color-orange-300), var(--color-orange-800));
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
