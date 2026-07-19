# Wild visitors rotate daily instead of lingering until tamed

Originally a wild visitor stayed in the glade until tamed, so the same one-to-three creatures greeted the player every day — multi-week tames (rares and up) made the scene static and boring. Visitors now rotate: at each daily glade advance, yesterday's visitors depart and a fresh set of one to three distinct species is drawn.

The draw is weighted by rarity exactly as arrivals were before (per-rarity weights, beacon residents shifting weight from common to rare), with each rarity's weight shared evenly among its untamed species. A species' banked taming progress then scales its weight (`TRUST_VISIT_BONUS`), so a part-tamed creature is up to four times as likely to return as an untouched one of the same rarity — long tames keep momentum without being guaranteed.

Departing visitors bank their trust per species in `GladeState.speciesTrust`, and a returning species resumes from that banked value, so no taming progress is ever lost — preserving the "no failure states" principle. The map entry is deleted when the species is tamed. We considered decaying banked trust for absent species and rejected it: decay punishes the player for the rotation itself, which they don't control.
