---
name: log-flaky-test
description: Log a flaky Playwright test in e2e/FLAKY_TESTS.md. Use whenever a test fails intermittently (passes in isolation, fails under load or on retry).
---

# Log Flaky Test

Use this skill whenever a Playwright test fails intermittently. The log lives at `e2e/FLAKY_TESTS.md`.

## Steps

1. **Read `e2e/FLAKY_TESTS.md`** to check if the failure matches an existing entry:
   - Same symptom / error message → increment the failure count for that test in the existing entry's table
   - New symptom or different root cause → create a new `##` section (see format below)

2. **New entry format:**

   ```md
   ## <short description of the failure pattern>

   **Symptom:** <the exact error or assertion that failed, and under what conditions — e.g. "only under parallel load", "only on first run after cold start">

   **Root cause (suspected):** <best guess — leave blank if unknown>

   | Test | Failures |
   |------|----------|
   | `e2e/path/to/file.spec.ts` > "test name" | 1 |
   ```

3. **Commit** the updated file directly to the current branch with message:
   `test: log flaky test in FLAKY_TESTS.md`
