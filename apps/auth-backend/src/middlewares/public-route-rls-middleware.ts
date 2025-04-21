import type { MiddlewareHandler } from 'hono';

import { ApiErrorCode } from '@roll-your-own-auth/shared/types';
import { sql } from 'drizzle-orm';

import { createApiResponse } from '@/lib/utils';

export const publicRouteRlsMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    const db = c.get('db');

    // Set the is_service_request to true for public routes to bypass RLS
    await db.execute(sql`
      SELECT set_config('app.is_service_request', 'true', FALSE)
    `);

    await next();
  } catch (error) {
    console.error('Public route RLS middleware error:', error);
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        },
      }),
      500,
    );
  }
};
