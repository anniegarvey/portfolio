---
trigger: always_on
globs: *.tx, *.tsx
---

- Use next-yak and existing global CSS variables from src/app/globals.css for styling
- Make sure all UI changes follow all a11y best practices, verify this in the browser for each change
- Use Radix, ShadCN or Reach components as a basis where possible, in priority order
- Don't disable linting rules unless absolutely necessary; if it must be disabled explain why with references
- Ensure `pnpm lint` and `pnpm test run` both pass before finishing, fix any warnings as well as errors
- Test selectors should  should resemble how users interact with your code (component, page, etc.) as much as possible: https://testing-library.com/docs/queries/about/#priority
- Check unit test quality using mutation tests `pnpm stryker run`, passing the changed file paths in the `--mutate` option, eg `--mutate "src/**/*.js", "a.js"`. At least 80% of mutants should be killed.