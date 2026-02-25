---
trigger: always_on
globs: *.tx, *.tsx
---

- Don't disable linting rules
- Prioritise simple, maintainable code, preferring refactoring over risk-averse minor modifications
- Use pnpm
- Ensure the `pnpm validate` command passes after any code change
- Use comments sparingly to explain why decisions were made, not how the code works
