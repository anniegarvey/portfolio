"use client";

import { styled } from "next-yak";
import { NeighbourCard } from "@/components/meadowmere/NeighbourCard";
import { ALL_NEIGHBOUR_IDS } from "@/lib/meadowmere/catalog";

export function NeighboursPanel() {
  return (
    <Grid>
      {ALL_NEIGHBOUR_IDS.map((neighbourId) => (
        <NeighbourCard key={neighbourId} neighbourId={neighbourId} />
      ))}
    </Grid>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;
