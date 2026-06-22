---
name: react-review
description: Perform code reviews for React and front end code (eg `.tsx`, `.ts`). Use when reviewing pull requests, examining code changes, or providing feedback on code quality. Covers accessibility, web design best practices, composability, and performance.
---

# React Code Review

## Apply Skills (in parallel)

The three review lenses are independent — spawn them as parallel subagents using the Agent tool with `subagent_type=general-purpose`, then merge results. Do not run them sequentially.

For each subagent prompt:
- Include the explicit list of files in the review scope (subagents start cold with no context)
- Specify which skill to invoke
- Instruct it to **report findings only — do not edit any files**
- Ask it to return findings as a list of `file:line — issue` entries

Spawn in a single message (one Agent call per skill, all three in parallel):
- Invoke `/web-design-guidelines` on the review scope
- Invoke `/vercel-composition-patterns` on the review scope
- Invoke `/vercel-react-best-practices` on the review scope

After all three complete, merge their findings, deduplicate any overlap, and present a single unified list.

## Identify Problems
Look for these issues in review scope:

- Side effects: Unintended behavioral changes affecting other components
- Backwards compatibility: Breaking API changes without migration path
- Security vulnerabilities: Injection, XSS, access control gaps, secrets exposure

## Test Coverage
- Changed or added user journeys should be covered in Playwright tests in /e2e, including accessibility analysis using `makeAxeBuilder().analyze()` for significantly different views
- Each source code file should have a corresponding test file alongside it, meeting coverage thresholds in `vitest.config.ts`
- Bug fixes must include a test reproducing the issue to prevent regressions
