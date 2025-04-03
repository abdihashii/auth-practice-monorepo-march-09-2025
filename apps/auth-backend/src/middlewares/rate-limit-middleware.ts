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
 * - For login/registration: Attempts to extract email from request body via headers
 * - Fallback: Uses route path + partial fingerprint
 */
function keyGenerator(c: Context<Env, string, Input>) {
  // Try to get user ID for authenticated requests
  const userId = c.get('userId') as string | undefined;
  if (userId) {
    return `user:${userId}`;
  }

  const path = new URL(c.req.url).pathname;

  // For login/register attempts, use email if it was extracted and stored in a header
  // This requires a preprocessing middleware to extract and store the email before rate limiting
  const extractedEmail = c.req.header('x-rate-limit-email');
  if (extractedEmail && (path.includes('/login') || path.includes('/register'))) {
    return `email:${extractedEmail}:${path}`;
  }

  // Fallback to a session/request identifier that doesn't solely rely on IP
  // Use a combination of factors for better request characterization
  const userAgent = c.req.header('user-agent') || 'unknown';
  const acceptLang = c.req.header('accept-language') || 'unknown';
  const secChUa = c.req.header('sec-ch-ua') || ''; // Browser identification

  // Create a fingerprint based on path and browser characteristics
  // Avoiding sole reliance on IP addresses which can affect multiple users
  return `path:${path}:fingerprint:${userAgent.substring(0, 20)}:${acceptLang.substring(0, 5)}:${secChUa.substring(0, 10)}`;
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
// Unused for now, but can be used to limit API requests in the future
export const apiRateLimiter: MiddlewareHandler<CustomEnv> = rateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  limit: 30, // 30 requests per minute
  standardHeaders: true,
  message: 'Too many API requests, please try again later',
  keyGenerator,
  store: redisStore,
}) as MiddlewareHandler<CustomEnv>;
