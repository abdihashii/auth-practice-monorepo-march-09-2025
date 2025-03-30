import { cors } from 'hono/cors';

import env from '@/env';

/**
 * CORS middleware configuration
 * Controls which origins can access the API and what methods/headers are allowed
 */
export const corsMiddleware = cors({
  origin: (origin) => {
    // Get the environment - note that we've already validated
    // environment variables at startup, so this won't throw
    const isProd = env.NODE_ENV === 'production';

    // In development, allow all origins for easier local development
    if (!isProd) {
      return origin;
    }

    // In production, check against allowed domains
    const allowedOrigins = [
      // env.FRONTEND_URL,
      // Add any additional production domains here
      // For multiple environments (staging, etc.), parse from a comma-separated env var
    ].filter(Boolean) as string[];

    // If the origin matches an allowed origin, return it, otherwise
    // return the primary frontend URL
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'credentials',
    'X-Requested-With',
  ],
  exposeHeaders: ['Content-Length', 'X-Requested-With', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 600, // 10 minutes in seconds
});
