---
name: new-feature
description: Guidelines for implementing and reviewing new features in the codebase. Use when adding new functionality
---

# New Feature

- Start from up-to-date main branch
- Create a new worktree in .claude/worktrees. Keep all changes inside this worktree
- Run `pnpm i` then `pnpm dev` and share the port number from the `.port` file
- Implement the feature, breaking work into small, focused commits
- Create a PR using the github CLI once the feature is complete and ready for review
