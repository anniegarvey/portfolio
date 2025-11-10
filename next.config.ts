import type { NextConfig } from "next";
import { withYak } from "next-yak/withYak";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default withYak(nextConfig);
