# Restarts multiply points, and extras give points somewhere to go

Annie's real Energy Planner data (Feb–Nov 2026) showed about 125 points on an active day, while Meadowmere's seeds cost 4–22 and all of Creature Glade's lessons came to 615 points a run. Points piled up unspent (over 2,000 banked), and once Glade's skill tree was done, taming was held back by each visitor's three daily actions rather than by points. Two decisions follow, taken together because each is pointless without the other.

## Extras: points buy speed, at a price that climbs within a day

Each game gains a few **Extras**, bought with points: in Meadowmere an extra forage trip, a grow tonic (every growing planting a day further along) and another gift for a neighbour; in Glade another round of taming actions with a visitor and an invitation for one more visitor. Each price climbs with every one bought that day and caps, so a big day in the planner goes further without buying the game out, and the daily rhythm both games are built on survives. Extras are only offered when they would do something (no trip while free ones are left, no tonic with nothing growing, no round while an unlocked action is spare), so a purchase is never wasted.

This replaces ADR 0007's "the seed stall is the only thing points are spent on". ADR 0003 still holds: nothing here mints points.

## Restarts: trade a game's progress for a lasting multiplier on every award

A **Restart** resets a game's progress in exchange for a **Restart bonus** added to one shared **Points multiplier**, which scales every Energy Planner award. The multiplier is shared rather than per game because points are one wallet: a Meadowmere-only multiplier on planner awards can't be attributed to Meadowmere once the points land. Annie chose this over per-game price discounts. A restart in either game therefore speeds up Bonsai too.

The bonus grows with how far the game got, so staying longer is always worth something: 4% per Meadowmere quest completed (the full chain is +1.0) and, in Glade, 3/5/10/15/25% per resident by rarity, so the long tames count most. A restart is offered from halfway (13 quests, 11 residents).

What resets is the game's progress. What the player has learned stays, so a second run is quicker without being a different game: Meadowmere keeps every neighbour's gift hints, Glade keeps every discovered and tried preference. Points are never touched.

The multiplier lives in its own localStorage record beside the points (`points-prestige`), not in either game's save, so resetting or restarting one game can never lose the other's bonus. The points provider reads it on every award. Energy Planner backups carry it from v8 (`pointsPrestige`).
