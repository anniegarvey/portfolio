"use client";

import { RestartGame } from "@/components/RestartGame";
import { useMeadowmere } from "@/lib/meadowmere/context";
import {
  questsUntilRestart,
  restartBonusPercent,
} from "@/lib/meadowmere/restartModule";

export function RestartMeadowmere() {
  const { state, restartMeadowmere } = useMeadowmere();
  const left = questsUntilRestart(state);

  return (
    <RestartGame
      bonusPercent={restartBonusPercent(state)}
      description="The smallholding goes back to its first day: crops, seeds, materials, friendships, quests and opened wild places start over. You keep what you’ve learned about each neighbour’s favourite gifts."
      game="meadowmere"
      label="Restart the farm"
      onRestart={restartMeadowmere}
      stillNeeded={
        left === 0
          ? null
          : `Complete ${left} more ${left === 1 ? "quest" : "quests"} to be able to restart. Every quest done adds to the bonus.`
      }
    />
  );
}
