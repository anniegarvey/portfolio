# Product

## Register

product

## Users

People living with limited daily energy: chronic illness, fatigue conditions, and
neurodivergence, who think in terms of "spoon theory." They arrive already
depleted, often on a bad day, and need to decide what is realistic to do before
they run out of energy. Their context is low-bandwidth: short attention, possible
brain fog, sometimes one-handed or assistive-tech use. The job to be done is "help
me see what I have capacity for today and plan around it without making me feel
worse." Secondary audience: visitors to Annie's portfolio evaluating craft, but the
real-user bar comes first.

## Product Purpose

An interactive daily planner built on energy/spoon theory. Users define their own
energy types (Physical, Social, Executive, etc.), set a daily capacity per type,
and schedule one-off and repeating activities that each carry an energy cost. The
planner shows whether the day's plan fits within capacity, surfaces what's due, and
captures periodic wellness checks to build a longitudinal record of warning signs.
A points/Bonsai layer rewards engagement. Success is a user trusting the tool
enough to plan with it daily, and feeling supported rather than judged when they
fall short of a plan.

## Brand Personality

Warm and playful, never clinical. Three words: encouraging, gentle, alive. The
voice is a kind friend who's good at logistics, not a productivity drill sergeant
and not a medical chart. Celebrates effort and completion (points, growth, the
Bonsai garden) without manufacturing guilt for unfinished or skipped work. Color
and motion carry warmth; copy is plain, supportive, and human.

## Anti-references

- Clinical/medical dashboards: cold blues, dense charts, "patient data" framing.
- High-pressure productivity tools that shame incomplete work (streaks that punish,
  red overdue counts everywhere, aggressive nagging).
- Hyperstimulating gamification (confetti spam, loud sounds, pressure mechanics)
  that overwhelms a low-energy user.
- Generic SaaS-cream + tracked-uppercase-eyebrow landing aesthetic.

## Design Principles

1. **Protect the user's energy.** Every interaction should cost less attention than
   the value it returns. Low cognitive load is the product, not a nicety.
2. **Never punish a bad day.** Skipping, falling short, or going over capacity is
   surfaced as information, never as failure. No shame mechanics.
3. **Warmth carries trust.** Encouragement and gentle delight earn daily use; the
   tool should feel like an ally.
4. **Accessible by default.** The audience makes accessibility a feature, not
   compliance. Keyboard, screen reader, reduced motion, and high contrast are
   first-class.
5. **Calm density.** Show enough to decide, hide the rest. Progressive disclosure
   over walls of controls.

## Accessibility & Inclusion

Target WCAG 2.1 toward AAA. Body text contrast pushed toward 7:1 where feasible;
never below AA (4.5:1 body, 3:1 large). Full keyboard operability with visible
focus, correct ARIA on all custom controls (modals, sortable lists, sliders,
selects), and logical heading/landmark structure. Honor
`prefers-reduced-motion` everywhere. Touch targets >= 44x44px. Account for brain
fog and assistive tech: clear labels, forgiving interactions, no time pressure.
