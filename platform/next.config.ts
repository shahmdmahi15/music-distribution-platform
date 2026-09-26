import "./src/env";
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
  async redirects() {
    return [
      {
        source: "/whitelabel/branding",
        destination: "/whitelabel/setup",
        permanent: false,
      },
      {
        source: "/whitelabel/theme",
        destination: "/whitelabel/setup",
        permanent: false,
      },
      {
        source: "/whitelabel/domain",
        destination: "/whitelabel/setup",
        permanent: false,
      },
      {
        source: "/whitelabel/sso",
        destination: "/whitelabel/setup",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
