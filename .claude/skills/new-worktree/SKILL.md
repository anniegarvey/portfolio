---
name: new-worktree
description: Guidelines for creating and managing new worktrees in the codebase
---

# New Worktree

- Start from up-to-date main branch
- Create a new worktree in .claude/worktrees. Keep all changes inside this worktree
- Run `pnpm i` then `pnpm dev` and share the port number from the `.port` file
- Implement the feature, breaking work into small, focused commits
- Create a PR using the github CLI once the feature is complete and ready for review
