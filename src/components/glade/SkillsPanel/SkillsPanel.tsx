"use client";

import { Coins } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { MAX_TIER, SKILL_NAMES, xpThresholdFor } from "@/lib/glade/catalog";
import { useGlade } from "@/lib/glade/context";
import type { SkillId } from "@/lib/glade/schema";
import { canBuyLesson, nextLessonCost } from "@/lib/glade/skillsModule";

const SKILL_DESCRIPTIONS: Record<SkillId, string> = {
  "treat-cooking":
    "Unlocks new recipes. Earn XP by cooking treats in the kitchen.",
  "body-language":
    "Calmer approaches build more trust. Earn XP by approaching visitors.",
  "petting-technique":
    "Better petting builds more trust. Earn XP by petting visitors.",
};

const SKILL_IDS = Object.keys(SKILL_NAMES) as SkillId[];

export function SkillsPanel() {
  const { state, buyLesson } = useGlade();

  return (
    <Panel>
      {SKILL_IDS.map((skillId) => {
        const skill = state.skills[skillId];
        const threshold = xpThresholdFor(skill.tier);
        const maxed = threshold === null;
        const xpPct = maxed ? 100 : Math.round((skill.xp / threshold) * 100);
        const cost = nextLessonCost(state, skillId);

        return (
          <SkillCard key={skillId}>
            <SkillHeader>
              <SkillName>{SKILL_NAMES[skillId]}</SkillName>
              <Tier>
                Tier {skill.tier}/{MAX_TIER}
              </Tier>
            </SkillHeader>
            <Description>{SKILL_DESCRIPTIONS[skillId]}</Description>
            <XpTrack
              aria-label={
                maxed
                  ? `${SKILL_NAMES[skillId]}: mastered`
                  : `${SKILL_NAMES[skillId]} XP: ${skill.xp} of ${threshold}`
              }
              aria-valuemax={threshold ?? skill.xp}
              aria-valuemin={0}
              aria-valuenow={skill.xp}
              role="meter"
            >
              <XpFill style={{ width: `${xpPct}%` }} />
            </XpTrack>
            {maxed ? (
              <Mastered>Mastered</Mastered>
            ) : canBuyLesson(state, skillId) ? (
              <Button onClick={() => buyLesson(skillId)} size="sm">
                Take lesson <Coins aria-hidden size={13} /> {cost}
              </Button>
            ) : (
              <Progress>
                {skill.xp}/{threshold} XP to next lesson
              </Progress>
            )}
          </SkillCard>
        );
      })}
    </Panel>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Panel = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 0.75rem;
`;

const SkillCard = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  background: light-dark(var(--color-grey-50), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
`;

const SkillHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  width: 100%;
`;

const SkillName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const Tier = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-700), var(--color-primary-400));
`;

const Description = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const XpTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: light-dark(var(--color-grey-200), var(--color-grey-700));
  overflow: hidden;
`;

const XpFill = styled.div`
  height: 100%;
  border-radius: 4px;
  background: light-dark(var(--color-secondary-500), var(--color-secondary-400));
  transition: width 300ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Progress = styled.span`
  font-size: 0.85rem;
  color: light-dark(var(--color-grey-600), var(--color-grey-400));
`;

const Mastered = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: light-dark(var(--color-secondary-700), var(--color-secondary-400));
`;
