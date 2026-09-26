"use client";

import { ResetProgress } from "@/components/ResetProgress";
import { useMeadowmere } from "@/lib/meadowmere/context";

export function ResetMeadowmere() {
  const { resetMeadowmere } = useMeadowmere();

  return (
    <ResetProgress
      description="The smallholding goes back to its very first day: crops, seeds, materials, friendships, quests and opened wild places are all lost. Points are not affected."
      label="Reset Meadowmere"
      onReset={resetMeadowmere}
      title="Reset Meadowmere?"
    />
  );
}
