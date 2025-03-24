import type { MiddlewareHandler } from 'hono';

import { eq } from 'drizzle-orm';
import { verify } from 'hono/jwt';

import { usersTable } from '@/db/schema';
import env from '@/env';
import { ApiErrorCode } from '@/lib/types';

interface CustomJWTPayload {
  userId: string;
  exp: number;
  iat: number;
}

// declare module "hono" {
//   type ContextVariableMap = {
//     userId: string;
//   };
// }

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    // Get the auth token from the header
    const authToken = c.req.header('Authorization')?.split(' ')[1];
    if (!authToken) {
      return c.json(
        {
          error: {
            code: ApiErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        401,
      );
    }

    // Get the JWT secret from the environment variables
    const jwtSecret = env.JWT_SECRET;
    if (!jwtSecret) {
      return c.json(
        {
          error: {
            code: ApiErrorCode.INTERNAL_SERVER_ERROR,
            message: 'JWT secret not found',
          },
        },
        500,
      );
    }

    try {
      // Decode the access token
      const decoded = await verify(authToken, jwtSecret);
      const payload = decoded as unknown as CustomJWTPayload;

      // Check if the user id is present in the payload
      if (!payload.userId) {
        return c.json(
          {
            error: {
              code: ApiErrorCode.INVALID_ACCESS_TOKEN,
              message: 'Invalid access token',
            },
          },
          401,
        );
      }

      // Check if the token is expired
      if (payload.exp < Date.now() / 1000) {
        return c.json(
          {
            error: {
              code: ApiErrorCode.ACCESS_TOKEN_EXPIRED,
              message: 'Access token expired',
            },
          },
          401,
        );
      }

      // Check if the user exists and is active
      const db = c.get('db');
      const user = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, payload.userId),
      });
      if (!user) {
        return c.json(
          {
            error: {
              code: ApiErrorCode.USER_NOT_FOUND,
              message: 'User not found',
            },
          },
          404,
        );
      }
      if (!user.isActive) {
        return c.json(
          {
            error: {
              code: ApiErrorCode.USER_INACTIVE,
              message: 'User is inactive',
            },
          },
          401,
        );
      }

      // Add the user id to the request context
      c.set('userId', user.id);

      // Check if user's tokens were invalidated
      if (user.lastTokenInvalidation) {
        const tokenIssuedAt = payload.iat;
        const invalidationTime = Math.floor(
          user.lastTokenInvalidation.getTime() / 1000,
        );

        if (tokenIssuedAt < invalidationTime) {
          return c.json(
            {
              error: {
                code: ApiErrorCode.TOKEN_INVALIDATED,
                message: 'Access token invalidated',
              },
            },
            401,
          );
        }
      }

      // Call the next middleware
      await next();
    } catch {
      return c.json(
        {
          error: {
            code: ApiErrorCode.INVALID_ACCESS_TOKEN,
            message: 'Invalid access token',
          },
        },
        401,
      );
    }
  } catch {
    return c.json(
      {
        error: {
          code: ApiErrorCode.UNAUTHORIZED,
          message: 'Unauthorized',
        },
      },
      401,
    );
  }
};
