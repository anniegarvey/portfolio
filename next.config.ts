// @ts-check
import type { NextConfig } from "next";
import { withYak } from "next-yak/withYak";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withYak(nextConfig);
