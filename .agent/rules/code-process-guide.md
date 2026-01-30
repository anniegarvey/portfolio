---
trigger: always_on
globs: *.tx, *.tsx
---

- Don't disable linting rules
- Prioritise simple, maintainable code, preferring refactoring over risk-averse minor modifications
- Use pnpm
- Ensure the `pnpm validate` command passes after any code change
- After any source code or unit test changes, check unit test quality using mutation tests `pnpm stryker run`, passing the changed file paths in the `--mutate` option, eg `--mutate "src/**/*.js", "a.js"`. At least 80% of mutants should be killed.