import { env } from "@/env";
import axios from "axios";
import { headers } from "next/headers";
import { resolveForwardedIp } from "@/lib/client-ip";

export const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": env.API_KEY,
  },
  validateStatus: function (status) {
    return status < 500;
  },
});

// Dynamic Request Interceptor for Next.js Server Actions & SSR
api.interceptors.request.use(async (config) => {
  try {
    const headerList = await headers();

    const clientIp = resolveForwardedIp(headerList);
    const userAgent = headerList.get("user-agent") || "Whitelabel-Client";
    const host = headerList.get("host") || "";

    if (clientIp) {
      config.headers["x-real-ip"] = clientIp;
      config.headers["x-internal-secret"] = env.INTERNAL_API_SECRET;
    }

    config.headers["User-Agent"] = userAgent;

    // Detect subdomain from incoming HTTP host header if present
    const hostWithoutPort = host.split(":")[0];
    const hostParts = hostWithoutPort.split(".");

    if (
      hostParts.length > 2 &&
      hostWithoutPort !== "localhost" &&
      hostWithoutPort !== "127.0.0.1"
    ) {
      config.headers["x-whitelabel-subdomain"] = hostParts[0];
    }
    if (
      hostWithoutPort &&
      hostWithoutPort !== "localhost" &&
      hostWithoutPort !== "127.0.0.1"
    ) {
      config.headers["x-whitelabel-domain"] = hostWithoutPort;
    }
  } catch {
    config.headers["User-Agent"] = "Whitelabel-Server-Action";
  }

  if (env.API_KEY) {
    config.headers["x-api-key"] = env.API_KEY;
  }

  return config;
});
