"use client";

import { Trash2 } from "lucide-react";
import { styled } from "next-yak";
import { useMemo } from "react";
import { Button } from "@/components/Button";
import { useWellnessCheck } from "@/lib/wellness/context";
import {
  buildTrends,
  type MetricSeries,
  type TrendPoint,
} from "@/lib/wellness/trends";

const CHART_W = 600;
const CHART_H = 160;
const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 18;
const PAD_B = 18;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

function xOf(i: number, total: number): number {
  if (total <= 1) return PAD_L + PLOT_W / 2;
  return PAD_L + (i / (total - 1)) * PLOT_W;
}

function yOf(value: number): number {
  return PAD_T + (1 - (value - 1) / 4) * PLOT_H;
}

function buildSegments(
  points: TrendPoint[],
): Array<Array<{ x: number; y: number }>> {
  const segments: Array<Array<{ x: number; y: number }>> = [];
  let current: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.value !== null) {
      current.push({ x: xOf(i, points.length), y: yOf(pt.value) });
    } else if (current.length > 0) {
      segments.push(current);
      current = [];
    }
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y?.slice(2)}`;
}

function MetricChart({ series }: { series: MetricSeries }) {
  const { points } = series;
  const nonNull = points.filter((p) => p.value !== null);

  const segments = useMemo(() => buildSegments(points), [points]);
  const yLabels = [5, 4, 3, 2, 1] as const;

  const firstDate = points[0]?.date;
  const lastDate = points[points.length - 1]?.date;

  return (
    <ChartBlock>
      <ChartHeader>
        <MetricLabel>
          {series.label}
          {series.isHistoricalOnly && (
            <HistoricalBadge aria-label="archived metric">
              {" "}
              (archived)
            </HistoricalBadge>
          )}
        </MetricLabel>
        {nonNull.length > 0 &&
          firstDate &&
          lastDate &&
          firstDate !== lastDate && (
            <DateRange>
              {formatDate(firstDate)} – {formatDate(lastDate)}
            </DateRange>
          )}
      </ChartHeader>

      {nonNull.length === 0 ? (
        <EmptyChart>No rated values yet</EmptyChart>
      ) : (
        <svg
          aria-label={`${series.label} trend`}
          height={CHART_H}
          preserveAspectRatio="none"
          role="img"
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          width="100%"
        >
          {/* Horizontal grid lines */}
          {yLabels.map((v) => (
            <line
              key={v}
              stroke="currentColor"
              strokeDasharray={v === 1 || v === 5 ? undefined : "4 4"}
              strokeOpacity={v === 1 || v === 5 ? 0.15 : 0.08}
              x1={PAD_L}
              x2={CHART_W - PAD_R}
              y1={yOf(v)}
              y2={yOf(v)}
            />
          ))}

          {/* Y-axis labels */}
          {yLabels.map((v) => (
            <text
              dominantBaseline="middle"
              fill="currentColor"
              fillOpacity={0.45}
              fontSize={10}
              key={v}
              textAnchor="end"
              x={PAD_L - 5}
              y={yOf(v)}
            >
              {v}
            </text>
          ))}

          {/* Line segments — gaps left honest */}
          {segments.map((seg) =>
            seg.length > 1 ? (
              <polyline
                fill="none"
                key={seg[0]?.x}
                points={seg.map((p) => `${p.x},${p.y}`).join(" ")}
                stroke="var(--color-primary-500)"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            ) : null,
          )}

          {/* Data-point dots */}
          {points.map((pt, i) =>
            pt.value !== null ? (
              <circle
                cx={xOf(i, points.length)}
                cy={yOf(pt.value)}
                fill="var(--color-primary-500)"
                key={pt.date}
                r={3.5}
              />
            ) : null,
          )}
        </svg>
      )}
    </ChartBlock>
  );
}

export function WellnessDashboard() {
  const { config, entries, isLoading, deleteEntry } = useWellnessCheck();

  const series = useMemo(
    () => buildTrends(entries, config.metrics),
    [entries, config.metrics],
  );

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  );

  if (isLoading) return null;

  if (entries.length === 0) {
    return (
      <EmptyState>
        <EmptyStateText>
          No wellness check entries yet. Complete a check on the Energy Planner
          to start tracking your trends.
        </EmptyStateText>
      </EmptyState>
    );
  }

  return (
    <Dashboard>
      <ChartsSection aria-label="Wellness trends">
        {series.map((s) => (
          <MetricChart key={s.metricId} series={s} />
        ))}
      </ChartsSection>

      <EntriesSection>
        <SectionTitle>History</SectionTitle>
        <EntriesList aria-label="Wellness entries">
          {sortedEntries.map((entry) => (
            <EntryRow key={entry.id}>
              <EntryDate>{formatDate(entry.date)}</EntryDate>
              <EntryBody>
                <EntryRatings>
                  {entry.metrics
                    .filter((m) => m.value !== null)
                    .map((m) => (
                      <Rating key={m.metricId}>
                        <RatingLabel>{m.label}</RatingLabel>
                        <RatingValue>{m.value}</RatingValue>
                      </Rating>
                    ))}
                  {entry.metrics.every((m) => m.value === null) && (
                    <RatingLabel>No ratings recorded</RatingLabel>
                  )}
                </EntryRatings>
                {entry.note && <EntryNote>{entry.note}</EntryNote>}
              </EntryBody>
              <Button
                aria-label={`Delete entry from ${formatDate(entry.date)}`}
                intent="danger"
                onClick={() => deleteEntry(entry.id)}
                size="icon"
                title={`Delete entry from ${formatDate(entry.date)}`}
                variant="ghost"
              >
                <Trash2 size={16} />
              </Button>
            </EntryRow>
          ))}
        </EntriesList>
      </EntriesSection>
    </Dashboard>
  );
}

const Dashboard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ChartsSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ChartBlock = styled.div`
  background-color: light-dark(white, oklch(18% 0.03 270));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-800));
  border-radius: 8px;
  padding: 16px;
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 12px;
`;

const MetricLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-200));
`;

const HistoricalBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 400;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
`;

const DateRange = styled.span`
  font-size: 0.75rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  flex-shrink: 0;
`;

const EmptyChart = styled.div`
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-400), var(--color-grey-600));
`;

const EntriesSection = styled.section``;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-200));
  margin: 0 0 1rem;
`;

const EntriesList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const EntryRow = styled.li`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 12px 16px;
  background-color: light-dark(white, oklch(18% 0.03 270));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-800));
  border-radius: 8px;
`;

const EntryDate = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  flex-shrink: 0;
  min-width: 5rem;
`;

const EntryBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
`;

const EntryRatings = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const EntryNote = styled.p`
  font-size: 0.8rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
  margin: 0;
  font-style: italic;
`;

const Rating = styled.span`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 0.8rem;
`;

const RatingLabel = styled.span`
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const RatingValue = styled.span`
  font-weight: 700;
  color: light-dark(var(--color-primary-700), var(--color-primary-400));
`;

const EmptyState = styled.div`
  padding: 3rem 1rem;
  text-align: center;
`;

const EmptyStateText = styled.p`
  font-size: 1rem;
  color: light-dark(var(--color-grey-500), var(--color-grey-400));
  max-width: 36rem;
  margin: 0 auto;
`;
