---
trigger: glob
globs: src/**/*.tsx
---

- Use next-yak and existing global CSS variables from src/app/globals.css for styling
- Don't target child tags within styled components if the same could have been achieved by making the child into a styled component itself
- Use pixels in multiples of 4 for things that don't need to scale with text, like margin and padding of sections, and gaps. border-radius should be in pixels too.
- Make sure all UI changes follow all a11y best practices, verify this in the browser for each change
- Keep React components small, with a single responsibility. Move any reusable components to the top level of src/components
- Reuse components from src/components where appropriate
- When building new UI patterns, use Radix, ShadCN or Reach components as a basis where possible, in priority order