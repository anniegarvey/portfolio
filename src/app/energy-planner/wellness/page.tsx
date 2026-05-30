"use client";

import { WellnessDashboard } from "@/components/energy-planner/WellnessDashboard";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { WellnessProvider } from "@/lib/wellness/context";

export default function WellnessPage() {
  return (
    <WellnessProvider>
      <MaxWidthWrapper as="main">
        <PageHeader>
          <PageTitle>Wellness Trends</PageTitle>
        </PageHeader>
        <WellnessDashboard />
      </MaxWidthWrapper>
    </WellnessProvider>
  );
}
