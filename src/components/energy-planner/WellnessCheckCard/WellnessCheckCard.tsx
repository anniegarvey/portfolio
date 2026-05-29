"use client";

import { css, styled } from "next-yak";
import { useState } from "react";
import { Button } from "@/components/Button";
import { useWellnessCheck } from "@/lib/wellness/context";
import type { WellnessMetric } from "@/lib/wellness/schema";

export function WellnessCheckCard() {
  const { config, saveEntry } = useWellnessCheck();
  const [ratings, setRatings] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(config.metrics.map((m) => [m.id, null])),
  );

  const hasAnyRating = config.metrics.some((m) => ratings[m.id] !== null);

  const handleRate = (metricId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [metricId]: value }));
  };

  const handleSave = async () => {
    const metrics = config.metrics.map((m) => ({
      metricId: m.id,
      label: m.label,
      value: ratings[m.id] ?? null,
    }));
    await saveEntry(metrics);
  };

  return (
    <Card aria-label="Wellness check">
      <CardTitle>Wellness Check</CardTitle>
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
      <SaveRow>
        <Button disabled={!hasAnyRating} onClick={handleSave} size="sm">
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
      background-color: light-dark(
        var(--color-primary-600),
        var(--color-primary-500)
      );
      border-color: light-dark(
        var(--color-primary-600),
        var(--color-primary-500)
      );
      color: white;
    `}
`;

const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;
