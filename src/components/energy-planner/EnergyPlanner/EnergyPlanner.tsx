"use client";

import { styled } from "next-yak";
import { useState } from "react";
import { CreateActivity } from "@/components/energy-planner/CreateActivity";
import { DateSelector } from "@/components/energy-planner/DateSelector";
import { DayPlanner } from "@/components/energy-planner/DayPlanner";
import { EnergyInput } from "@/components/energy-planner/EnergyInput";
import { ImportExport } from "@/components/energy-planner/ImportExport";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { isToday } from "@/hooks/utils";
import { useEnergyPlanner } from "@/lib/energy-planner/context";
import type { Activity } from "@/lib/energy-planner/schema";

export function EnergyPlanner() {
  const { currentDate, goToPreviousDay, goToNextDay, goToToday } =
    useEnergyPlanner();

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>(
    undefined,
  );

  const [creationContext, setCreationContext] = useState<
    { date: string; zoneId?: string } | undefined
  >(undefined);

  const viewingToday = isToday(currentDate);

  const handleOpenCreate = (context?: { date: string; zoneId?: string }) => {
    setEditingActivity(undefined);
    setCreationContext(context);
    setIsActivityModalOpen(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setCreationContext(undefined); // Editing doesn't use creation context (yet)
    setIsActivityModalOpen(true);
  };

  const handleCloseActivityModal = () => {
    setIsActivityModalOpen(false);
    setEditingActivity(undefined);
    setCreationContext(undefined);
  };

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Energy Planner</PageTitle>
        <ImportExport />
      </PageHeader>

      <p>
        Plan your day according to your energy levels. Based on extended Spoon
        Theory.
      </p>

      <Layout>
        <DateSelector
          currentDate={currentDate}
          onGoToToday={goToToday}
          onNextDay={goToNextDay}
          onPreviousDay={goToPreviousDay}
          viewingToday={viewingToday}
        />

        <EnergyInput />

        <DayPlanner
          onEditActivity={handleEditActivity}
          onOpenCreateActivity={handleOpenCreate}
        />

        <CreateActivity
          creationContext={creationContext}
          editingActivity={editingActivity}
          isOpen={isActivityModalOpen}
          onClose={handleCloseActivityModal}
        />
      </Layout>
    </MaxWidthWrapper>
  );
}

const Layout = styled.div`
  display: flex;
  gap: 32px;
  flex-direction: column;
  padding-block: 32px;
`;
