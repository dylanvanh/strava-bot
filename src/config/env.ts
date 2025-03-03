import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

export const env = createEnv({
  server: {
    PORT: z
      .string()
      .transform((val) => parseInt(val, 10))
      .default("3000"),
    STRAVA_CLIENT_ID: z.string().min(1, "Strava Client ID is required"),
    STRAVA_CLIENT_SECRET: z.string().min(1, "Strava Client Secret is required"),
    STRAVA_REFRESH_TOKEN: z.string().min(1, "Strava Refresh Token is required"),
  },

  clientPrefix: "PUBLIC_",
  client: {},

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
