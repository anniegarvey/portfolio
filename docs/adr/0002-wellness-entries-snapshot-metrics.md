# Wellness entries snapshot their metrics

A wellness entry stores a self-describing snapshot of each metric at capture time (`{ metricId, label, value }`) rather than referencing the live metric config by ID alone. We chose this so that editing, renaming, or deleting a metric later never alters or destroys past entries — the entire purpose of the feature is a faithful longitudinal record of warning signs, and silently rewriting history on a config tweak would be the worst possible surprise.

## Considered Options

- **Reference live config by metric ID** (`{ metricId: value }`) — rejected: deleting a metric orphans its values and loses the label, erasing that metric's trend.
- **Snapshot per entry** (chosen) — entries are immutable historical records; deleting a metric means "stop asking going forward," and its history remains viewable. Costs marginally more storage (one entry per check) and slightly more code at capture time.
