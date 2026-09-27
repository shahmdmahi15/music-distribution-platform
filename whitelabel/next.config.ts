import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: "100mb",
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
