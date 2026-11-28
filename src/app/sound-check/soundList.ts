import { FLIGHT_MS } from "@/components/glade/TameCelebration/timing";
import { SPECIES } from "@/lib/glade/catalog";
import type { SpeciesId } from "@/lib/glade/schema";
import * as glade from "@/lib/glade/sounds";
import { NEIGHBOURS } from "@/lib/meadowmere/catalog";
import type { NeighbourId } from "@/lib/meadowmere/schema";
import * as meadowmere from "@/lib/meadowmere/sounds";
import * as points from "@/lib/points/sounds";

// Every game sound, played through the same functions the games call, so the
// sound check page plays exactly what ships. Add a sound's play function here
// when you add it; soundList.test.ts fails if one is missing.

export interface SoundEntry {
  label: string;
  play: () => void;
}

export interface SoundGroup {
  name: string;
  sounds: SoundEntry[];
}

const speciesIds = Object.keys(SPECIES) as SpeciesId[];
const neighbourIds = Object.keys(NEIGHBOURS) as NeighbourId[];

export const SOUND_GROUPS: SoundGroup[] = [
  {
    name: "Glade creatures",
    sounds: speciesIds.map((id) => ({
      label: SPECIES[id].name,
      play: () => glade.playCreatureSound(id),
    })),
  },
  {
    name: "Glade rewards",
    sounds: [
      {
        label: "Trust chime, a quarter of the way",
        play: () => glade.playTrustSound(true, 0.25),
      },
      {
        label: "Trust chime, nearly tame",
        play: () => glade.playTrustSound(true, 0.9),
      },
      {
        label: "Near miss",
        play: () => glade.playTrustSound(false, 0),
      },
      { label: "Tamed", play: () => glade.playTameSound(FLIGHT_MS / 1000) },
      { label: "Cooked", play: glade.playCookSound },
      { label: "Bought", play: glade.playBuySound },
      { label: "Lesson", play: glade.playLessonSound },
      { label: "Friendship level up", play: glade.playFriendshipSound },
    ],
  },
  {
    name: "Meadowmere farm",
    sounds: [
      { label: "Sow", play: meadowmere.playSowSound },
      { label: "Water", play: meadowmere.playWaterSound },
      {
        label: "Harvest (tap again quickly to climb)",
        play: meadowmere.playHarvestSound,
      },
      {
        label: "Forage (tap again quickly to climb)",
        play: meadowmere.playForageSound,
      },
      { label: "Nothing found", play: meadowmere.playNothingSound },
      ...meadowmere.CAT_SOUNDS.map((_, pets) => ({
        label: `Cat, pet ${pets + 1}`,
        play: () => meadowmere.playCatSound(pets),
      })),
    ],
  },
  {
    name: "Meadowmere village",
    sounds: [
      ...neighbourIds.map((id) => ({
        label: `${NEIGHBOURS[id].name}'s door`,
        play: () => meadowmere.playDoorSound(id),
      })),
      { label: "Shop bell", play: meadowmere.playShopSound },
      { label: "Seed bought", play: meadowmere.playBuySound },
      {
        label: "Gift accepted",
        play: () => meadowmere.playGiftSound(false, false),
      },
      {
        label: "Gift loved",
        play: () => meadowmere.playGiftSound(true, false),
      },
      {
        label: "Friendship up",
        play: () => meadowmere.playGiftSound(true, true),
      },
      { label: "Quest done", play: meadowmere.playQuestSound },
      { label: "Errand done", play: meadowmere.playErrandSound },
      { label: "Morning", play: meadowmere.playMorningSound },
    ],
  },
  {
    name: "Points",
    sounds: [
      { label: "Collect", play: points.playCollectSound },
      { label: "Deposit", play: points.playDepositSound },
    ],
  },
];
