"use client";

import { ArrowRight, Check, Undo2 } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { formatDateForDisplay } from "@/hooks/utils";
import { QUERIES } from "@/lib/constants";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Activity } from "@/lib/energy-planner/schema";
import { usePoints } from "@/lib/points/context";

interface UncompletedActivityCardProps {
  activity: Activity;
  instanceId: string;
  fromDate: string;
}

export function UncompletedActivityCard({
  activity,
  instanceId,
  fromDate,
}: UncompletedActivityCardProps) {
  const {
    energyTypes,
    markActivityCompleteOnDate,
    moveActivityToToday,
    moveActivityToUnplanned,
  } = useEnergyPlanner();
  const { awardPoints } = usePoints();

  const handleMarkComplete = (e: React.MouseEvent<HTMLButtonElement>) => {
    const energySum = Object.values(activity.energyCost).reduce(
      (sum, cost) => sum + cost,
      0,
    );
    awardPoints(3 + energySum, e.currentTarget.getBoundingClientRect());
    markActivityCompleteOnDate(instanceId, fromDate);
  };

  const handleMoveToToday = () => {
    moveActivityToToday(instanceId, fromDate);
  };

  const handleReturnToUnplanned = () => {
    moveActivityToUnplanned(instanceId, fromDate);
  };

  return (
    <Card>
      <ActivityContent>
        <ActivityHeader>
          <ActivityTitle>{activity.title}</ActivityTitle>
          <FromDate>from {formatDateForDisplay(fromDate)}</FromDate>
        </ActivityHeader>
        {activity.description && (
          <ActivityDescription>{activity.description}</ActivityDescription>
        )}
        <EnergyBadges>
          {energyTypes.map((type) => {
            const value = activity.energyCost[type.id] || 0;
            if (value === 0) return null;
            return (
              <Badge $color={type.color} key={type.id}>
                {value} {type.label.charAt(0).toUpperCase()}
              </Badge>
            );
          })}
        </EnergyBadges>
      </ActivityContent>
      <Actions>
        <Button
          aria-label="Mark as complete"
          intent="secondary"
          leftIcon={<Check size={16} />}
          onClick={(e) => handleMarkComplete(e)}
          title="Mark as complete"
        >
          <ResponsiveSpan>Complete</ResponsiveSpan>
        </Button>
        <Button
          aria-label="Move to today"
          intent="secondary"
          leftIcon={<ArrowRight size={16} />}
          onClick={handleMoveToToday}
          title="Move to today"
        >
          <ResponsiveSpan>Move to Today</ResponsiveSpan>
        </Button>
        <Button
          aria-label="Return to unplanned"
          intent="secondary"
          leftIcon={<Undo2 size={16} />}
          onClick={handleReturnToUnplanned}
          title="Return to unplanned"
        >
          <ResponsiveSpan>Unplan</ResponsiveSpan>
        </Button>
      </Actions>
    </Card>
  );
}

const Card = styled.article`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-800));
  padding: 12px;
  border-radius: 8px;
  border: 2px solid var(--color-orange-400);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin-bottom: 0.5rem;

  @media (${QUERIES.PHABLET_UP}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
`;

const ActivityTitle = styled.span`
  font-weight: 600;
  color: light-dark(var(--color-orange-900), var(--color-orange-100));
`;

const FromDate = styled.span`
  font-size: 0.75rem;
  color: light-dark(var(--color-orange-700), var(--color-orange-300));
`;

const EnergyBadges = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 999px;
  background-color: ${({ $color }) => `${$color}30`};
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
  border: 1px solid ${({ $color }) => `${$color}50`};
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActivityDescription = styled.p`
    font-size: 0.8rem;
    color: light-dark(var(--color-grey-700), var(--color-grey-300));
    margin-bottom: 0.5rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
`;

const ResponsiveSpan = styled.span`
  display: none;

  @media (${QUERIES.PHABLET_UP}) {
    display: inline;
  }
`;
