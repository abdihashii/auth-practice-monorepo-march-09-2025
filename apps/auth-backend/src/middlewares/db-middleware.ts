import type { MiddlewareHandler } from 'hono';

import type { CustomEnv } from '@/lib/types';

import { dbConnect } from '@/db';

// Create the middleware handler with proper typing
export const dbMiddleware: MiddlewareHandler<CustomEnv> = async (c, next) => {
  try {
    // Connect to the database
    const db = await dbConnect();

    // Set the database connection in the context
    c.set('db', db);

    // Call the next middleware
    await next();
  } catch {
    return c.json({ error: 'Failed to connect to database' }, 500);
  }
};
