"use client";

import { ResetProgress } from "@/components/ResetProgress";
import { useGlade } from "@/lib/glade/context";

export function ResetGlade() {
  const { resetGlade } = useGlade();

  return (
    <ResetProgress
      description="The glade goes back to its very first day: residents and skill progress are lost, discovered species return to the Collection's unknowns, and wild visitors and the pantry go back to their starting state. Points are not affected."
      label="Reset glade"
      onReset={resetGlade}
      title="Reset the glade?"
    />
  );
}
