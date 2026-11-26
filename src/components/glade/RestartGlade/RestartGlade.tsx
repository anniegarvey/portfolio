"use client";

import { RestartGame } from "@/components/RestartGame";
import { useGlade } from "@/lib/glade/context";
import {
  residentsUntilRestart,
  restartBonusPercent,
} from "@/lib/glade/restartModule";

export function RestartGlade() {
  const { state, restartGlade } = useGlade();
  const left = residentsUntilRestart(state);

  return (
    <RestartGame
      bonusPercent={restartBonusPercent(state)}
      description="Your residents wander back to the wild woods, and skills, trust and the pantry start over. You keep every preference you’ve discovered, so old friends are quicker to win back."
      game="glade"
      label="Restart the glade"
      onRestart={restartGlade}
      stillNeeded={
        left === 0
          ? null
          : `Tame ${left} more ${left === 1 ? "creature" : "creatures"} to be able to restart. Rarer residents add more to the bonus.`
      }
    />
  );
}
