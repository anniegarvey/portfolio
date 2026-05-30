// @ts-check
import type { NextConfig } from "next";
import { withYak } from "next-yak/withYak";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin the workspace root to this directory. Otherwise Turbopack auto-detects
  // the root by scanning for lockfiles and picks the parent repo, which holds
  // git worktrees under .claude/worktrees/ (each with its own pnpm-lock.yaml).
  // That makes it crawl/watch that whole tree during on-demand route
  // compilation, which hangs dev ("stuck Compiling..."). Pinning the root
  // scopes Turbopack to this project.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withYak(nextConfig);
