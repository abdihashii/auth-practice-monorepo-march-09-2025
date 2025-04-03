import type { Context, Env, Input, MiddlewareHandler } from 'hono';

import { RedisStore } from '@hono-rate-limiter/redis';
import { Redis } from '@upstash/redis';
import { rateLimiter } from 'hono-rate-limiter';

import type { CustomEnv } from '@/lib/types';

import env from '@/env';

// Create Redis client using environment variables
const redis = new Redis({
  url: env.REDIS_URL,
  token: env.REDIS_TOKEN,
});

/**
 * Creates a more intelligent key for rate limiting
 * - For authenticated users: Uses userId from auth context if available
 * - For login/registration: Uses email from request body if available
 * - Fallback: Uses IP address + route path
 */
function keyGenerator(c: Context<Env, string, Input>) {
  // Try to get user ID for authenticated requests
  const userId = c.get('userId') as string | undefined;
  if (userId) {
    return `user:${userId}`;
  }

  // For login/register attempts, use email if available in body
  const path = new URL(c.req.url).pathname;
  if (path.includes('/login') || path.includes('/register')) {
    try {
      // Clone the request to read the body without consuming it
      // Note: This assumes JSON body and isn't perfect, but helps with rate limiting
      const request = c.req.raw.clone();
      request.json().then((body) => {
        if (body && typeof body === 'object' && 'email' in body && typeof body.email === 'string') {
          return `email:${body.email}:${path}`;
        }
      }).catch(() => {});
    } catch {
      // Silently fail if we can't parse the body
    }
  }

  // Fallback to IP + path + user agent for better fingerprinting
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const userAgent = c.req.header('user-agent') || 'unknown';
  return `ip:${ip}:path:${path}:ua:${userAgent.substring(0, 20)}`;
}

const redisStore = new RedisStore({ client: redis });

// Global rate limiter - applies to all routes
// Limit to 60 requests per minute per IP
export const globalRateLimiter: MiddlewareHandler<CustomEnv> = rateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  limit: 60, // 60 requests per minute
  standardHeaders: true, // Return rate limit info in the headers
  message: 'Too many requests, please try again later',
  keyGenerator,
  store: redisStore,
}) as MiddlewareHandler<CustomEnv>;

// Strict rate limiter for authentication endpoints
// Limit to 5 attempts per 15 minutes per IP
export const authRateLimiter: MiddlewareHandler<CustomEnv> = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  limit: 5, // 5 attempts per 15 minutes
  standardHeaders: true,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator,
  store: redisStore,
}) as MiddlewareHandler<CustomEnv>;

// API rate limiter for API endpoints
// Limit to 30 requests per minute per IP
export const apiRateLimiter: MiddlewareHandler<CustomEnv> = rateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  limit: 30, // 30 requests per minute
  standardHeaders: true,
  message: 'Too many API requests, please try again later',
  keyGenerator,
  store: redisStore,
}) as MiddlewareHandler<CustomEnv>;
