---
trigger: always_on
globs: *.tx, *.tsx
---

- Use next-yak and existing global CSS variables from src/app/globals.css for styling
- Make sure all UI changes follow all a11y best practices, verify this in the browser for each change
- Ensure linting and testing is all passing before finishing
- Cover all changes with unit tests `pnpm test run`, check this using mutation tests `pnpm stryker run` passing the changed file paths in the `--mutate` option, eg `--mutate "src/**/*.js", "a.js"`