---
trigger: glob
globs: src/**/*.test.tsx, e2e/**/*.spec.ts
---

- Test selectors should resemble how users interact with your code (component, page, etc.) as much as possible: https://testing-library.com/docs/queries/about/#priority
- Prefer updating source code to provide better, contextual accessible names than using nth or within selectors
- Keep common setup steps in beforeEach blocks