import type { MiddlewareHandler } from 'hono';

import { sql } from 'drizzle-orm';

import type { CustomEnv } from '@/lib/types';

import { dbConnect } from '@/db';

// Create the middleware handler with proper typing
export const dbMiddleware: MiddlewareHandler<CustomEnv> = async (c, next) => {
  try {
    // Connect to the database
    const db = await dbConnect();

    // Only initialize variables when they're not being set by auth middleware
    // Don't overwrite existing variables if this is a subsequent middleware
    if (!c.get('userId')) {
      await db.execute(sql`
        SELECT
          set_config('app.current_user_id', '', FALSE),
          set_config('app.is_service_request', 'false', FALSE)
      `);
    }

    // Set the database connection in the context
    c.set('db', db);

    // Call the next middleware
    await next();
  } catch {
    return c.json({ error: 'Failed to connect to database' }, 500);
  }
};
