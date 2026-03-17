import { DayPlannerSkeleton } from "@/components/energy-planner/DayPlannerSkeleton";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";

export default function EnergyPlannerLoading() {
  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Energy Planner</PageTitle>
      </PageHeader>
      <DayPlannerSkeleton />
    </MaxWidthWrapper>
  );
}
