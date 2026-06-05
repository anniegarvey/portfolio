"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { styled } from "next-yak";
import { useEffect, useState } from "react";
import { CreateActivity } from "@/components/energy-planner/CreateActivity";
import { DayPlanner } from "@/components/energy-planner/DayPlanner";
import { EnergyCapacityModal } from "@/components/energy-planner/EnergyCapacityModal";
import { ImportExport } from "@/components/energy-planner/ImportExport";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { Toggletip } from "@/components/Toggletip";
import { isToday } from "@/lib/date";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Activity } from "@/lib/energy-planner/schema";

export function EnergyPlanner() {
  const { currentDate, dailyCapacity, isLoading } = useEnergyPlanner();

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(
    undefined,
  );

  const [creationContext, setCreationContext] = useState<
    { date: string; zoneId?: string } | undefined
  >(undefined);
  const [onActivityCreated, setOnActivityCreated] = useState<
    (() => void) | undefined
  >(undefined);
  const [onActivityCreatedWithType, setOnActivityCreatedWithType] = useState<
    ((type: "one-off" | "repeating") => void) | undefined
  >(undefined);

  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);

  const viewingToday = isToday(currentDate);

  // Auto-open capacity modal if no capacities have been set yet for today
  useEffect(() => {
    if (isLoading || !viewingToday) return;

    const hasCapacities = Object.values(dailyCapacity).some((val) => val > 0);
    if (!hasCapacities) {
      setIsCapacityModalOpen(true);
    }
  }, [viewingToday, dailyCapacity, isLoading]);

  const handleOpenCreate = (
    context?: { date: string; zoneId?: string },
    onCreated?: () => void,
    onCreatedWithType?: (type: "one-off" | "repeating") => void,
  ) => {
    setEditingActivity(undefined);
    setCreationContext(context);
    // Use a function wrapper to avoid useState treating it as an updater fn
    setOnActivityCreated(onCreated ? () => onCreated : undefined);
    setOnActivityCreatedWithType(
      onCreatedWithType ? () => onCreatedWithType : undefined,
    );
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setCreationContext({ date: currentDate }); // Provide date context even for editing
    setIsActivityModalOpen(true);
  };

  const handleCloseActivityModal = () => {
    setIsActivityModalOpen(false);
    setEditingActivity(undefined);
    setCreationContext(undefined);
    setOnActivityCreated(undefined);
    setOnActivityCreatedWithType(undefined);
  };

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Energy Planner</PageTitle>
        <ActionRow>
          <Toggletip content="Plan your day according to your energy levels. Based on extended Spoon Theory." />
          <WellnessLink href="/energy-planner/wellness">
            <Heart size={14} />
            Wellness
          </WellnessLink>
          <ImportExport />
        </ActionRow>
      </PageHeader>

      <Layout>
        {/* DateSelector is now a property passed down or rendered inside DayPlanner per design */}
        <DayPlanner
          onEditActivity={handleEditActivity}
          onOpenCapacityModal={() => setIsCapacityModalOpen(true)}
          onOpenCreateActivity={handleOpenCreate}
        />

        <CreateActivity
          creationContext={creationContext}
          editingActivity={editingActivity}
          isOpen={isActivityModalOpen}
          onClose={handleCloseActivityModal}
          onCreated={onActivityCreated}
          onCreatedWithType={onActivityCreatedWithType}
        />

        <EnergyCapacityModal
          isOpen={isCapacityModalOpen}
          onClose={() => {
            setIsCapacityModalOpen(false);
          }}
        />
      </Layout>
    </MaxWidthWrapper>
  );
}

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const WellnessLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
  white-space: nowrap;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;

  &:hover {
    background-color: light-dark(var(--color-grey-100), var(--color-grey-800));
    color: light-dark(var(--color-grey-900), var(--color-grey-100));
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
`;

const Layout = styled.div`
  display: flex;
  gap: 32px;
  flex-direction: column;
  padding-block: 16px;
`;
