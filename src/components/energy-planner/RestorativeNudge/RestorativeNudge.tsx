"use client";

import { Leaf, X } from "lucide-react";
import { styled } from "next-yak";
import { useRestorativeNudge } from "@/hooks/useRestorativeNudge";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Activity } from "@/lib/energy-planner/schema";

interface RestorativeNudgeProps {
  onOpenManageActivities: () => void;
}

export function RestorativeNudge({
  onOpenManageActivities,
}: RestorativeNudgeProps) {
  const { resolvedActivities, availableActivities, addToPlan, addActivity } =
    useEnergyPlanner();

  const {
    shouldShow,
    nonRestorativeCount,
    restorativeSuggestions,
    defaultSuggestions,
    dismiss,
  } = useRestorativeNudge(resolvedActivities, availableActivities);

  if (!shouldShow) return null;

  const handleAddHistoryActivity = (activity: Activity) => {
    addToPlan(activity.id, undefined, activity);
  };

  const handleAddDefault = (title: string) => {
    const newActivity = addActivity({
      title,
      energyCost: {},
      factors: {
        isRestorative: true,
        initiationDifficulty: 0,
        terminationDifficulty: 0,
      },
    });
    addToPlan(newActivity.id, undefined, newActivity);
  };

  const hasSuggestions = restorativeSuggestions.length > 0;

  return (
    <Banner
      aria-label="Restorative activity reminder"
      aria-live="polite"
      role="note"
    >
      <Body>
        <Title>
          <Leaf aria-hidden size={14} />
          Consider some recovery time
        </Title>
        <Message>
          You have {nonRestorativeCount} demanding activities planned — adding
          something restorative can help sustain your energy.
        </Message>
        <Suggestions>
          {hasSuggestions
            ? restorativeSuggestions.map((activity) => (
                <Chip
                  key={activity.id}
                  onClick={() => handleAddHistoryActivity(activity)}
                  type="button"
                >
                  + {activity.title}
                </Chip>
              ))
            : defaultSuggestions.map((title) => (
                <Chip
                  key={title}
                  onClick={() => handleAddDefault(title)}
                  type="button"
                >
                  + {title}
                </Chip>
              ))}
          {hasSuggestions && (
            <BrowseButton onClick={onOpenManageActivities} type="button">
              Browse all →
            </BrowseButton>
          )}
        </Suggestions>
      </Body>
      <DismissButton
        aria-label="Dismiss reminder"
        onClick={dismiss}
        type="button"
      >
        <X aria-hidden size={14} />
      </DismissButton>
    </Banner>
  );
}

const Banner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: color-mix(in oklch, var(--color-teal-500) 7%, transparent);
  border: 1px solid color-mix(in oklch, var(--color-teal-500) 25%, transparent);
  border-radius: 8px;
  padding: 12px 14px;
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  color: light-dark(var(--color-teal-900), var(--color-teal-200));
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: light-dark(var(--color-teal-800), var(--color-teal-300));
`;

const Suggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
`;

const Chip = styled.button`
  background: color-mix(in oklch, var(--color-teal-500) 12%, transparent);
  border: 1px solid color-mix(in oklch, var(--color-teal-500) 35%, transparent);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 0.8rem;
  font-weight: 500;
  color: light-dark(var(--color-teal-900), var(--color-teal-200));
  cursor: pointer;
  touch-action: manipulation;

  &:hover {
    background: color-mix(in oklch, var(--color-teal-500) 20%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;

const BrowseButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 0.8rem;
  color: light-dark(var(--color-teal-700), var(--color-teal-400));
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  touch-action: manipulation;

  &:hover {
    color: light-dark(var(--color-teal-900), var(--color-teal-200));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

const DismissButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  flex-shrink: 0;
  color: light-dark(var(--color-teal-700), var(--color-teal-400));
  cursor: pointer;
  border-radius: 2px;
  display: flex;
  align-items: center;
  touch-action: manipulation;

  &:hover {
    color: light-dark(var(--color-teal-900), var(--color-teal-200));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;
