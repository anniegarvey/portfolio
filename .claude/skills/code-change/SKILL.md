---
name: code-change
description: Use this whenever a code change is requested. Covers planning, working in a worktree with separate dev server, and creating a PR with proof of the change working.
---

# Code Change

- Use the grill-me skill to flesh out the plan first
- Start from up-to-date main branch
- Create a new worktree. Keep all changes inside the worktree
- Run `pnpm i` then `pnpm dev` and share the port number from the `.port` file
- Implement the feature, breaking work into small, focused commits
- Check your changes using vercel-composition-patterns, vercel-react-best-practices and web-design-guidelines skills and apply recommended fixes
- Create a PR using the github CLI once the feature is complete and ready for review. Explain how you proved it's working
