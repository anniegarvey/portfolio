# Taming skills unlock sequentially instead of all starting active

Originally all three taming skills (Body Language, Petting Technique, Treat Cooking) started at tier 1 together, so a player could raise all three from day one. With modest daily-action caps (one approach, one pet, one treat per visitor per day) the whole skill tree maxed out within a couple of weeks, leaving little left to work toward.

Skills now unlock in sequence: Body Language is available from the start; reaching tier 2 in it unlocks Petting Technique (and the pet action); reaching tier 2 in Petting Technique unlocks Treat Cooking (and cooking/offering treats). `SKILL_UNLOCK_REQUIREMENT` in `catalog.ts` encodes the chain, and `isSkillUnlocked` is the single gate consulted by `canBuyLesson`, `petVisitor`, `offerTreat`, and `canCook` — a locked skill neither earns XP (its action never fires) nor accepts a lesson, so there's no way to skip ahead.

Because the gate is a pure function of skill tier rather than a separate persisted flag, no state migration was needed: existing saves that already progressed under the old rules simply read as fully unlocked. The new "reset glade" action (a confirmed, destructive wipe back to `createInitialState`) is how a player can choose to experience the sequential unlock from scratch instead; it deliberately leaves the shared points currency untouched.
