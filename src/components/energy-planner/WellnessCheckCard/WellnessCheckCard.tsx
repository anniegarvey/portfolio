"use client";

import { Settings, X } from "lucide-react";
import { css, styled } from "next-yak";
import { useState } from "react";
import { Button } from "@/components/Button";
import { usePoints } from "@/lib/points/context";
import { useWellnessCheck } from "@/lib/wellness/context";
import { isEntryFilled } from "@/lib/wellness/entry";
import type { WellnessEntry, WellnessMetric } from "@/lib/wellness/schema";

const WELLNESS_CHECK_POINTS = 5;

interface WellnessCheckCardProps {
  onOpenConfig?: () => void;
  onOptOut?: () => void;
  initialEntry?: WellnessEntry;
  onSave?: () => void;
}

export function WellnessCheckCard({
  onOpenConfig,
  onOptOut,
  initialEntry,
  onSave,
}: WellnessCheckCardProps) {
  const { config, saveEntry, amendEntry, disableCheck } = useWellnessCheck();
  const { awardPoints } = usePoints();
  const [ratings, setRatings] = useState<Record<string, number | null>>(() => {
    const base: Record<string, number | null> = Object.fromEntries(
      config.metrics.map((m) => [m.id, null]),
    );
    if (!initialEntry) return base;
    for (const m of initialEntry.metrics) {
      if (m.metricId in base) base[m.metricId] = m.value;
    }
    return base;
  });
  const [noteExpanded, setNoteExpanded] = useState(() =>
    Boolean(initialEntry?.note),
  );
  const [note, setNote] = useState(() => initialEntry?.note ?? "");

  const isFilled = isEntryFilled(ratings, note);

  const handleRate = (metricId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [metricId]: value }));
  };

  const handleSave = async () => {
    if (initialEntry) {
      await amendEntry(initialEntry.id, ratings, note.trim());
      onSave?.();
    } else {
      await saveEntry(ratings, note.trim());
    }
  };

  const handleOptOut = async () => {
    await disableCheck();
    onOptOut?.();
  };

  return (
    <Card aria-label="Wellness check">
      <CardHeader>
        <CardTitle>Wellness Check</CardTitle>
        <HeaderActions>
          {onOpenConfig && (
            <Button
              aria-label="Configure wellness check"
              intent="secondary"
              onClick={onOpenConfig}
              size="icon"
              variant="ghost"
            >
              <Settings size={16} />
            </Button>
          )}
          <Button
            aria-label="Turn off wellness checks"
            intent="secondary"
            onClick={handleOptOut}
            size="icon"
            variant="ghost"
          >
            <X size={16} />
          </Button>
        </HeaderActions>
      </CardHeader>
      {config.metrics.map((metric) => (
        <MetricRow key={metric.id}>
          <MetricLabel>{metric.label}</MetricLabel>
          <SegmentedControl aria-label={metric.label} role="group">
            {([1, 2, 3, 4, 5] as const).map((value) => (
              <SegmentButton
                $selected={ratings[metric.id] === value}
                aria-label={getSegmentLabel(metric, value)}
                aria-pressed={ratings[metric.id] === value}
                key={value}
                onClick={() => handleRate(metric.id, value)}
                type="button"
              >
                {getSegmentLabel(metric, value)}
              </SegmentButton>
            ))}
          </SegmentedControl>
        </MetricRow>
      ))}
      <NoteToggle
        aria-expanded={noteExpanded}
        onClick={() => setNoteExpanded((v) => !v)}
        type="button"
      >
        {noteExpanded ? "Hide note" : "Add note"}
      </NoteToggle>
      {noteExpanded && (
        <NoteTextarea
          aria-label="Note"
          onChange={(e) => setNote(e.target.value)}
          placeholder="How are you feeling?"
          rows={3}
          value={note}
        />
      )}
      <SaveRow>
        <Button
          disabled={!isFilled}
          onClick={async (e) => {
            if (!initialEntry) {
              awardPoints(
                WELLNESS_CHECK_POINTS,
                e.currentTarget.getBoundingClientRect(),
              );
            }
            await handleSave();
          }}
          size="sm"
        >
          Save
        </Button>
      </SaveRow>
    </Card>
  );
}

function getSegmentLabel(
  metric: WellnessMetric,
  value: 1 | 2 | 3 | 4 | 5,
): string {
  if (value === 1 && metric.lowLabel) return `${value} – ${metric.lowLabel}`;
  if (value === 5 && metric.highLabel) return `${value} – ${metric.highLabel}`;
  return String(value);
}

const Card = styled.section`
  background-color: light-dark(var(--color-primary-50), oklch(18% 0.03 270));
  border: 1px solid light-dark(var(--color-primary-200), var(--color-primary-800));
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CardTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-800), var(--color-primary-200));
  margin: 0;
`;

const MetricRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetricLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const SegmentedControl = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const SegmentButton = styled.button<{ $selected: boolean }>`
  padding: 6px 12px;
  min-height: 44px;
  font-size: 0.8rem;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid
    light-dark(var(--color-primary-300), var(--color-primary-700));
  background-color: light-dark(white, var(--color-grey-900));
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    background-color: light-dark(
      var(--color-primary-100),
      var(--color-primary-900)
    );
    border-color: light-dark(
      var(--color-primary-400),
      var(--color-primary-600)
    );
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  ${({ $selected }) =>
    $selected &&
    css`
      /* primary-600 in both themes: white text clears AA (5.88:1).
         primary-500 was too light in dark mode (4.40:1). */
      background-color: var(--color-primary-600);
      border-color: var(--color-primary-600);
      color: white;
    `}
`;

const NoteToggle = styled.button`
  align-self: flex-start;
  background: none;
  border: none;
  color: light-dark(var(--color-primary-600), var(--color-primary-400));
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const NoteTextarea = styled.textarea`
  width: 100%;
  padding: 8px;
  font-size: 0.875rem;
  border-radius: 4px;
  border: 1px solid light-dark(var(--color-primary-300), var(--color-primary-700));
  background-color: light-dark(white, var(--color-grey-900));
  color: light-dark(var(--color-grey-800), var(--color-grey-200));
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;

const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;
