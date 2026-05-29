"use client";

import { EnergyPlanner } from "@/components/energy-planner/EnergyPlanner";
import { EnergyPlannerProvider } from "@/lib/energy-planner/context";
import { WellnessProvider } from "@/lib/wellness/context";

export default function EnergyPlannerPage() {
  return (
    <EnergyPlannerProvider>
      <WellnessProvider>
        <EnergyPlanner />
      </WellnessProvider>
    </EnergyPlannerProvider>
  );
}
