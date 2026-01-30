---
trigger: glob
globs: src/**/*.tsx
---

- Use next-yak and existing global CSS variables from src/app/globals.css for styling
- Prefer more styled components over targeting descendant tags
- Ensure all UI changes follow a11y best practices, using semantic HTML and ensuring sufficient contrast in light & dark mode
- Keep React components small, with a single responsibility. Move any reusable components to the top level of src/components
- Reuse components from src/components where appropriate, otherwise use Radix, ShadCN or Reach components as a basis where possible, in priority order
- Cover all significant UX changes in /e2e tests