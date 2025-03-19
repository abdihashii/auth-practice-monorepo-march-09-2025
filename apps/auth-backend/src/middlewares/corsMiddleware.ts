// Third party imports
import { cors } from "hono/cors";

// Local imports
import { getEnv } from "@/lib/utils";

/**
 * CORS middleware configuration
 * Controls which origins can access the API and what methods/headers are allowed
 */
export const corsMiddleware = cors({
  origin: (origin) => {
    // Get the environment - note that we've already validated
    // environment variables at startup, so this won't throw
    const env = getEnv();
    const isProd = env.NODE_ENV === "production";

    // In development, allow all origins
    if (!isProd) {
      return origin;
    }

    // In production, check against allowed domains
    const allowedOrigins = [
      // env.FRONTEND_URL,
      // Add any additional production domains here
    ].filter(Boolean) as string[];

    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "credentials",
    "X-Requested-With",
  ],
  exposeHeaders: ["Content-Length", "X-Requested-With", "X-CSRF-Token"],
  credentials: true,
  maxAge: 600,
});
