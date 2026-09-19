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
    // Resolve the promise if the status code is less than 500
    // This means 2xx, 400, 401, 404, etc. will NOT throw an error anymore
    return status < 500;
  },
});

// Dynamic Request Interceptor for Next.js Server Actions
api.interceptors.request.use(async (config) => {
  try {
    // 1. Fetch current user context headers dynamically
    const headerList = await headers();

    const clientIp = resolveForwardedIp(headerList);
    const userAgent = headerList.get("user-agent") || "Unknown-Agent";

    // 2. Forward the client IP only when it could actually be established, and
    // always pair it with the secret that proves this request came from this
    // server rather than a browser. Sending a placeholder address would bucket
    // unrelated users together under one rate limit.
    if (clientIp) {
      config.headers["x-real-ip"] = clientIp;
      config.headers["x-internal-secret"] = env.INTERNAL_API_SECRET;
    }

    config.headers["User-Agent"] = userAgent;
  } catch (error) {
    console.log("[Lib.Api]: ", error);
    config.headers["User-Agent"] = "NextJS-Server-Side";
  }

  return config;
});
