"use client";

import { EnergyPlanner } from "@/components/energy-planner/EnergyPlanner";
import { EnergyPlannerProvider } from "@/lib/energy-planner/context";

export default function EnergyPlannerPage() {
  return (
    <EnergyPlannerProvider>
      <EnergyPlanner />
    </EnergyPlannerProvider>
  );
}
