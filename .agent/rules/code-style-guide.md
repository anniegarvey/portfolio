---
trigger: always_on
globs: *.tx, *.tsx
---

- Use next-yak and existing global CSS variables from src/app/globals.css for styling
- Make sure all UI changes follow all a11y best practices, verify this in the browser for each change
- Use Radix, ShadCN or Reach components as a basis where possible, in priority order
- Don't disable linting rules unless absolutely necessary; if it must be disabled explain why with references
- Ensure linting and testing is all passing before finishing, fix any warnings as well as errors
- Cover all changes with unit tests `pnpm test run`
- Check unit test quality using mutation tests `pnpm stryker run`, passing the changed file paths in the `--mutate` option, eg `--mutate "src/**/*.js", "a.js"`. At least 80% of mutants should be killed.