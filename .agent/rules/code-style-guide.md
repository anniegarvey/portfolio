---
trigger: always_on
globs: *.tx, *.tsx
---

- Don't disable linting rules unless absolutely necessary, especially in source files; if it must be disabled explain why with references. 
- Ensure `pnpm lint`, `pnpm test run` and `npx playwright test` commands all pass with no warnings or errors before saying a task is finished
- After any source code or unit test changes, check unit test quality using mutation tests `pnpm stryker run`, passing the changed file paths in the `--mutate` option, eg `--mutate "src/**/*.js", "a.js"`. At least 80% of mutants should be killed.