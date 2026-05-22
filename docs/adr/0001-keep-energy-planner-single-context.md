# Keep Energy Planner state in a single context

`useEnergyPlannerState` returns 40+ properties from five child hooks into one flat context (`EnergyPlannerContext`). We considered splitting it into multiple narrower contexts (day-plan, activities, energy types, zones) to limit re-render blast radius, but decided to keep the single context for now.

Two reasons drove the decision. First, the React Compiler is enabled and handles component memoisation, so the blast radius from a wide context is partially absorbed already — and no observable performance problems have been measured. Second, the coordinator has genuine cross-cutting work: `addToPlan`, `removeActivity`, and `handleUpdateActivity` all touch multiple domains simultaneously (activities store + day plan store + available-activities index). Splitting the context would leave this logic without a clean home — it would need either a fourth "coordinator" context or callback-passing between sibling providers.

Revisit if profiling shows re-render overhead causing visible lag, or if a second cross-cutting seam emerges that makes the current shape feel actively painful.
