import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained Node bundle so the production image only needs
  // .next/standalone, .next/static, and public — not the full node_modules.
  output: "standalone",
};

export default nextConfig;
