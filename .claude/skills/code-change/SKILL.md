---
name: code-change
description: Use this whenever a code change is requested. Covers planning, working in a worktree with separate dev server, and creating a PR with proof of the change working.
---

# Code Change

- Use /grill-with-docs to flesh out the plan first
- Implement the feature, breaking work into small, focused commits
- If you need to run the dev server, run `pnpm dev`. The port number will be in the `.port` file
- Check your changes using vercel-composition-patterns, vercel-react-best-practices and web-design-guidelines skills when relevant, and apply recommended fixes
- Create a PR using the gh CLI once the feature is complete and ready for review. Explain how you proved it's working. For any screenshots or visual proof, create a temp HTML file in ./reports I can open locally to view them, output URL-formatted filename eg file://wsl.localhost/Ubuntu/home/annie/projects/portfolio/.claude/worktrees/enumerated-beaming-feigenbaum/reports/pr84-proof.html. Don't delete the file.
