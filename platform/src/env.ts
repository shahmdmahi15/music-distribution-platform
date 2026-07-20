import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    API_BASE_URL: z.url(),
    API_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    API_BASE_URL: process.env.API_BASE_URL,
    API_KEY: process.env.API_KEY,
  },
});
