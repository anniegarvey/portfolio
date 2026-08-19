---
name: code-change
description: Use this whenever a code change is requested. Covers planning, working in a worktree with separate dev server, and creating a PR with proof of the change working.
---

# Code Change

- When clarification is needed, run a `/grilling` sessions using the `/domain-modeling` skill.
- Implement the feature, breaking work into small, focused commits
- If you need to run the dev server, run `pnpm dev`. The port number will be in the `.port` file
- Check your changes using react-review, and apply recommended fixes
- Create a PR using the gh CLI once the feature is complete and ready for review. Explain how you proved it's working. For any screenshots or visual proof, create an artifact and link to it in the PR description
