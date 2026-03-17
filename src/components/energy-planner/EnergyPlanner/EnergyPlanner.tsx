"use client";

import { styled } from "next-yak";
import { useEffect, useState } from "react";
import { CreateActivity } from "@/components/energy-planner/CreateActivity";
import { DayPlanner } from "@/components/energy-planner/DayPlanner";
import { EnergyCapacityModal } from "@/components/energy-planner/EnergyCapacityModal";
import { ImportExport } from "@/components/energy-planner/ImportExport";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { isToday } from "@/hooks/utils";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Activity } from "@/lib/energy-planner/schema";

const CAPACITY_MODAL_SHOWN_KEY = "energy-planner-capacity-modal-shown";

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

  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);

  const viewingToday = isToday(currentDate);

  // Auto-open capacity modal only once per session if visiting today with no capacities set.
  // We use sessionStorage so retains the "shown" flag while the user navigates around
  // but resets if they close the tab/window.
  useEffect(() => {
    if (isLoading || !viewingToday) return;

    const alreadyShown = sessionStorage.getItem(CAPACITY_MODAL_SHOWN_KEY);
    if (alreadyShown) return;

    const hasCapacities = Object.values(dailyCapacity).some((val) => val > 0);
    if (!hasCapacities) {
      setIsCapacityModalOpen(true);
      sessionStorage.setItem(CAPACITY_MODAL_SHOWN_KEY, "1");
    }
  }, [viewingToday, dailyCapacity, isLoading]);

  const handleOpenCreate = (
    context?: { date: string; zoneId?: string },
    onCreated?: () => void,
  ) => {
    setEditingActivity(undefined);
    setCreationContext(context);
    // Use a function wrapper to avoid useState treating it as an updater fn
    setOnActivityCreated(onCreated ? () => onCreated : undefined);
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
  };

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Energy Planner</PageTitle>
        <ImportExport />
        <p>
          Plan your day according to your energy levels. Based on extended Spoon
          Theory.
        </p>
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
        />

        <EnergyCapacityModal
          isOpen={isCapacityModalOpen}
          onClose={() => {
            sessionStorage.setItem(CAPACITY_MODAL_SHOWN_KEY, "1");
            setIsCapacityModalOpen(false);
          }}
        />
      </Layout>
    </MaxWidthWrapper>
  );
}

const Layout = styled.div`
  display: flex;
  gap: 32px;
  flex-direction: column;
  padding-block: 16px;
`;
