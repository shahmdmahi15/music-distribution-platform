import { env } from "@/env";
import axios from "axios";
import { headers } from "next/headers";

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

    const forwardedFor = headerList.get("x-forwarded-for");
    const realIp = headerList.get("x-real-ip");
    const userAgent = headerList.get("user-agent") || "Unknown-Agent";

    // 2. Parse and clean the IP address safely
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp || "127.0.0.1";

    // 3. Inject them directly into this specific outgoing request
    config.headers["x-real-ip"] = clientIp;
    config.headers["User-Agent"] = userAgent;
  } catch (error) {
    console.log("[Lib.Api]: ", error);
    config.headers["x-real-ip"] = "127.0.0.1";
    config.headers["User-Agent"] = "NextJS-Server-Side";
  }

  return config;
});
