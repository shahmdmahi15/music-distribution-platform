import "./src/env";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: "10mb",
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // output: "standalone",
  // // If output is standalone add the packages in transpilePackages
  // transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
};

export default nextConfig;
