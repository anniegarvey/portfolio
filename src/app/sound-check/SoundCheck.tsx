"use client";

import { styled } from "next-yak";
import { Button } from "@/components/Button";
import { SOUND_GROUPS } from "./soundList";

export function SoundCheck() {
  return (
    <Groups>
      {SOUND_GROUPS.map((group) => (
        <section aria-labelledby={headingId(group.name)} key={group.name}>
          <GroupHeading id={headingId(group.name)}>{group.name}</GroupHeading>
          <Sounds>
            {group.sounds.map((sound) => (
              <li key={sound.label}>
                <Button onClick={sound.play} size="sm" variant="outline">
                  {sound.label}
                </Button>
              </li>
            ))}
          </Sounds>
        </section>
      ))}
    </Groups>
  );
}

function headingId(name: string) {
  return `sounds-${name.toLowerCase().replace(/\s+/g, "-")}`;
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const Groups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 40rem;
  margin-inline: auto;
  padding-bottom: 3rem;
`;

const GroupHeading = styled.h2`
  font-size: 1.125rem;
  margin-bottom: 0.75rem;
`;

const Sounds = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
`;
