---
name: code-change
description: Use this whenever a code change is requested. Covers planning, working in a worktree with separate dev server, and creating a PR with proof of the change working.
---

# Code Change

- Use /grill-me to flesh out the plan first
- Starting from up-to-date main branch, create a new worktree. Keep all changes inside the worktree
- Implement the feature, breaking work into small, focused commits
- If you need to run the dev server, run `pnpm i` then `pnpm dev`. The port number will be in the `.port` file
- Check your changes using vercel-composition-patterns, vercel-react-best-practices and web-design-guidelines skills when relevant, and apply recommended fixes
- Create a PR using the github CLI once the feature is complete and ready for review. Explain how you proved it's working
