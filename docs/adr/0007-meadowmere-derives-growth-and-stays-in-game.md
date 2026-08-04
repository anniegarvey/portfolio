# Meadowmere derives crop growth and keeps its economy in-game

Two decisions taken while building Meadowmere, both about what the game does with time and with points.

## Growth is derived from the planting date

A planting's stage is computed from `today − plantedDate` on every read, rather than incremented by the daily advance. Stardew's model — a crop advances only on days it was watered — was the alternative, and we rejected it.

The deciding factor is that Meadowmere ticks on real calendar days, and a player who doesn't open it for a week would return to a farm that had stood still. Worse, the daily advance follows the Bonsai and Creature Glade pattern of running at most once per day (`lastAdvanceDate === today` returns early), so missed days collapse into a single tick: a Stardew-faithful model would have needed the engine to replay each missed day, roughly doubling the engine and its test surface to deliver a harsher experience.

Deriving growth instead means time away ripens crops correctly and for free, no crop ever withers, and the engine's only job at the daily advance is refilling forage trips. Watering keeps a purpose as a *bonus*: each watered day adds one produce to the harvest, so a diligent player roughly doubles their yield. Being away costs you bonuses, never progress — the same "no failure states" principle as the Glade.

The watering and gifting limits are date stamps (`lastWateredDate`, `lastGiftDate`) compared against today rather than flags the advance resets, so they expire on their own and can't leak stale state across a gap.

## The economy stays inside the game

ADR 0003 established that Playground games spend points and never mint them. Meadowmere is the third such game and the first where the obvious genre loop — sell crops, buy better seeds — would have broken that rule outright.

Points therefore buy seed packets and nothing pays them back. Harvested produce is never sold; it is spent on neighbour gifts and quest deliveries. Quest rewards are seeds, items, crop and site unlocks, extra plots, and friendship — never points. We considered adding a farm-only "coin" currency earned by selling produce, which would have preserved ADR 0003 on a technicality while restoring the Stardew loop, and rejected it: a second currency needs explaining and testing, and it would have made the farm self-sustaining, which is exactly the incentive problem ADR 0003 exists to prevent.

Foraging the wilds is free and yields materials, so a player with no points can still progress the quest chain — the shop is an accelerator, not a gate. This mirrors how Glade's resident foragers keep the kitchen stocked without minting points.

ADR 0003 names only Bonsai Garden and Creature Glade. Read it as the general rule for the Playground: Meadowmere is bound by it too.
