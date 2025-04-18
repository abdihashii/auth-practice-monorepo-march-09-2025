import type { MiddlewareHandler } from 'hono';

import { sql } from 'drizzle-orm';

import type { CustomEnv } from '@/lib/types';

import { dbConnect } from '@/db';

// Create the middleware handler with proper typing
export const dbMiddleware: MiddlewareHandler<CustomEnv> = async (c, next) => {
  try {
    // Connect to the database
    const db = await dbConnect();

    // Set default session variables for anonymous access
    // These ensure the RLS policies have sensible defaults when no user is authenticated
    await db.execute(sql`SET LOCAL app.current_user_id = ''`);
    await db.execute(sql`SET LOCAL app.is_admin = 'false'`);
    await db.execute(sql`SET LOCAL app.is_superadmin = 'false'`);

    // Set the database connection in the context
    c.set('db', db);

    // Call the next middleware
    await next();
  } catch {
    return c.json({ error: 'Failed to connect to database' }, 500);
  }
};
