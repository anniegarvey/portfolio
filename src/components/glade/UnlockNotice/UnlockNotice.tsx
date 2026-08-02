"use client";

import { styled } from "next-yak";
import { SKILL_NAMES, SKILL_UNLOCK_REQUIREMENT } from "@/lib/glade/catalog";
import type { SkillId } from "@/lib/glade/schema";

/** "Unlocks at <skill> tier <N>" notice for a locked skill. Renders nothing for an always-unlocked skill. */
export function UnlockNotice({ skillId }: { skillId: SkillId }) {
  const requirement = SKILL_UNLOCK_REQUIREMENT[skillId];
  if (!requirement) return null;
  return (
    <Notice>
      Unlocks at {SKILL_NAMES[requirement.skillId]} tier {requirement.tier}
    </Notice>
  );
}

const Notice = styled.span`
  font-size: 0.85rem;
  font-style: italic;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;
