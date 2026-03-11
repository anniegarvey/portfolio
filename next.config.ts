import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";
import { withYak } from "next-yak/withYak";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {}, // Required to allow next-pwa (which uses webpack) to run
};

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false,
});

export default withPWA(withYak(nextConfig));
