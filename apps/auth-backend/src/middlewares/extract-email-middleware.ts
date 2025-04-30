import type { MiddlewareHandler } from 'hono';

import type { CustomEnv } from '@/lib/types';

/**
 * Middleware that extracts email from request body for login/register routes
 * and stores it in the context for rate limiting purposes
 */
export const extractEmailMiddleware: MiddlewareHandler<CustomEnv> = async (
  c,
  next,
) => {
  const path = new URL(c.req.url).pathname;

  // Only process login and register routes
  if (path.includes('/login') || path.includes('/register')) {
    try {
      // Clone the request to avoid consuming the body
      const clonedRequest = c.req.raw.clone();

      // Parse the body to extract email
      const body = await clonedRequest.json();

      // If email exists in the body, store it in the context for rate limiting
      if (
        body
        && typeof body === 'object'
        && 'email' in body
        && typeof body.email === 'string'
      ) {
        // Use context storage instead of modifying request headers
        c.set('rateLimitEmail', body.email);
      }
    } catch (error) {
      // Silently fail - we'll fall back to other rate limiting methods
      console.error('Failed to extract email for rate limiting:', error);
    }
  }

  await next();
};
