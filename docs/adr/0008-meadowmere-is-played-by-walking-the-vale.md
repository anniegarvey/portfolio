# Meadowmere is played by walking the Vale

Meadowmere's first build (PR #136) put its four loops behind tabs: a Farm panel of plot cards, a Wilds panel of site cards, a Neighbours panel, a Quest log. Everything worked, and it was the wrong game. What makes Stardew Valley Stardew Valley is being somewhere — walking a character up to a thing and using it. A tab strip is not that, so the play style was rebuilt.

The game logic was unaffected: farming, foraging, neighbours, quests and the daily engine are pure state→state modules that never knew how they were presented, and they came across untouched. ADR 0007 stands as written — real calendar days, derived growth, no in-game clock, no energy bar, no tool tiers. The change here is only how the player reaches those loops.

## One map, and one rule for using it

The Vale is a 16 × 12 grid with a terrain layer and a set of features standing on it. Every feature — plot, wild site, cottage, seed stall, barn cat — blocks movement, so there is a single rule everywhere: stand beside it, face it, act on it. Letting the farmer walk over plots would have meant a second rule for tile-you-stand-on versus tile-you-face, for no gain.

That every feature blocks movement is what constrains where a feature may be *placed*. The barn cat takes a new perch each day, and a moving feature on walkable ground would be a wall that moves too — able to shut off the only way round to a plot or a cottage door. So its perches are all hedge or rock: ground the farmer could never have stood on, where adding a feature changes walkability not at all. Anything else that comes and goes belongs under the same rule.

Movement is grid stepping, not free roam. `(state, pose, direction) → pose` is a pure function that unit tests can drive; a pixel-position game loop would have put the same behaviour behind requestAnimationFrame and out of reach of tests. As in Stardew, a direction both turns and moves — walking into a plot turns to face it, ready to work.

The world model lives in `src/lib/meadowmere/` alongside the game logic (`valeMap`, `movement`, `interaction`), so the components stay thin renderers. A test asserts every feature keeps a walkable tile beside it on a full farm, and another that nothing stands on the tile above a cottage, whose roof is drawn taller than it stands — layout mistakes that would otherwise strand a whole loop or hide it.

## Clicking is walking

Each feature also carries a real `<button>` laid transparently over its tile, named for the interaction available there ("Water Parsnip in Plot 4"). Activating one — by click or by Tab and Enter — walks the farmer over and does the thing. This is how Stardew's own mouse control behaves, and it means the map is fully operable by keyboard and legible to a screen reader without a parallel list UI to keep in step.

**The action resolves before the walk is played back.** The walk is animation, not a gate. Gating state on it would mean an interrupted walk could silently drop what the player asked for, reduced-motion users taking a different code path, and every end-to-end test waiting on animation. Instead the interaction fires immediately and the farmer is stepped across afterwards; pressing a direction key abandons the walk, and nothing is lost when it does.

The map is `role="application"`, which asks screen readers to pass arrow and action keys through rather than using them to browse. Nothing depends on that being honoured: the buttons work either way.
