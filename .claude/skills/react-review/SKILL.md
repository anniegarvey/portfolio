---
name: react-review
description: Perform code reviews for React and front end code (eg `.tsx`, `.ts`). Use when reviewing pull requests, examining code changes, or providing feedback on code quality. Covers accessibility, web design best practices, composability, and performance.
---

# React Code Review

## Apply Skills
Use the following skills, in order, on all code in the review scope:
- `web-design-guidelines` 
- `vercel-composition-patterns`
- `vercel-react-best-practices`

## Identify Problems
Look for these issues in review scope:

- Side effects: Unintended behavioral changes affecting other components
- Backwards compatibility: Breaking API changes without migration path
- Security vulnerabilities: Injection, XSS, access control gaps, secrets exposure

## Test Coverage
- Changed or added user journeys should be covered in Playwright tests in /e2e, including accessibility analysis using `makeAxeBuilder().analyze()` for significantly different views
- Each source code file should have a corresponding test file alongside it, meeting coverage thresholds in `vitest.config.ts`
- Bug fixes must include a test reproducing the issue to prevent regressions
