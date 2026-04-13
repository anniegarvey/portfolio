import { styled } from "next-yak";
import type { Activity } from "../../../lib/energy-planner/schema";
import { UncompletedActivityCard } from "../UncompletedActivityCard";

interface UncompletedActivitiesSectionProps {
  activities: { activity: Activity; instanceId: string; fromDate: string }[];
}

export function UncompletedActivitiesSection({
  activities,
}: UncompletedActivitiesSectionProps) {
  if (activities.length === 0) return null;

  return (
    <Section data-testid="uncompleted-activities">
      <Heading>Uncompleted Activities ({activities.length})</Heading>
      <List>
        {activities.map(({ activity, instanceId, fromDate }) => (
          <UncompletedActivityCard
            activity={activity}
            fromDate={fromDate}
            instanceId={instanceId}
            key={`${instanceId}-${fromDate}`}
          />
        ))}
      </List>
    </Section>
  );
}

const Section = styled.section`
  background-color: light-dark(var(--color-orange-50), oklch(25% 0.05 50));
  border: 1px solid var(--color-orange-300);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const Heading = styled.h3`
  color: light-dark(var(--color-orange-900), var(--color-orange-100));
  margin-bottom: 12px;
  font-size: 0.95rem;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
