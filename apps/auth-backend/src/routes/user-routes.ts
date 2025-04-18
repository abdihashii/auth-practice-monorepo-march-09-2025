import type { UserDetail, UserListItem } from '@roll-your-own-auth/shared/types';

import { zValidator } from '@hono/zod-validator';
import { idParamSchema, updatePasswordSchema, updateUserSchema } from '@roll-your-own-auth/shared/schemas';
import { ApiErrorCode } from '@roll-your-own-auth/shared/types';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { every } from 'hono/combine';

import type { CustomEnv } from '@/lib/types';

import { authUsersTable, profilesTable } from '@/db/schema';
import {
  DEFAULT_USER_DETAIL_COLUMNS,
  DEFAULT_USER_LIST_COLUMNS,
} from '@/lib/constants';
import { comparePasswords, createApiResponse, createSelectObject, hashPassword } from '@/lib/utils';

export const userRoutes = new Hono<CustomEnv>();

// Get all users
userRoutes.get('/', async (c) => {
  try {
    const db = c.get('db');

    // Create select object using the helper function
    const selectObj = createSelectObject(authUsersTable, DEFAULT_USER_LIST_COLUMNS);

    // Only select the necessary columns based on default list columns
    const users = await db.select(selectObj).from(authUsersTable);

    // Return standardized response using the unified utility
    return c.json(
      createApiResponse({
        data: users as UserListItem[],
      }),
      200,
    );
  } catch (error) {
    console.error('Error fetching users:', error);

    // Return error response using the unified utility
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve users',
        },
      }),
      500,
    );
  }
});

// Get a user by id
userRoutes.get('/:id', zValidator('param', idParamSchema), async (c) => {
  try {
    const db = c.get('db');
    const { id } = c.req.param();

    // Create select object using the helper function
    const selectObj = createSelectObject(
      authUsersTable,
      DEFAULT_USER_DETAIL_COLUMNS,
    );

    // Only select the necessary columns based on default detail columns
    const results = await db
      .select(selectObj)
      .from(authUsersTable)
      .where(eq(authUsersTable.id, id));

    if (results.length === 0) {
      // Return not found error using the unified utility
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.NOT_FOUND,
            message: 'User not found',
          },
        }),
        404,
      );
    }

    // Return standardized success response using the unified utility
    return c.json(
      createApiResponse({
        data: results[0] as UserDetail,
      }),
      200,
    );
  } catch (error) {
    console.error('Error fetching user:', error);

    // Return error response using the unified utility
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve user',
        },
      }),
      500,
    );
  }
});

/**
 * Update a user's profile information
 * PUT /users/:id
 */
userRoutes.put('/:id', every(zValidator('param', idParamSchema), zValidator('json', updateUserSchema)), async (c) => {
  try {
    const db = c.get('db');
    const { id } = c.req.param();

    const { name, bio, profilePicture } = await c.req.json();

    const [updatedProfile] = await db
      .update(profilesTable)
      .set({ name, bio, profilePicture })
      .where(eq(profilesTable.userId, id))
      .returning();
    if (!updatedProfile) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.NOT_FOUND,
            message: 'User profile not found',
          },
        }),
        404,
      );
    }

    return c.json(
      createApiResponse({
        data: {
          message: 'User profile updated successfully',
        },
      }),
      200,
    );
  } catch (error) {
    console.error('Error updating user profile:', error);

    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update user profile',
        },
      }),
      500,
    );
  }
});

/**
 * Change a user's password
 * PUT /users/:id/password
 */
userRoutes.put('/:id/password', every(zValidator('param', idParamSchema), zValidator('json', updatePasswordSchema)), async (c) => {
  try {
    // Get the database connection from the context
    const db = c.get('db');

    // Get the user id from the request parameters
    const { id } = c.req.param();

    // Get the old and new passwords from the request body
    const { old_password, new_password } = await c.req.json();

    // Get the user from the database
    const user = await db.query.authUsersTable.findFirst({
      where: eq(authUsersTable.id, id),
    });
    if (!user) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.NOT_FOUND,
            message: 'User not found',
          },
        }),
        404,
      );
    }

    // Check if the old password is correct
    const isPasswordCorrect = await comparePasswords(old_password, user.hashedPassword);
    if (!isPasswordCorrect) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid old password. Please try again.',
          },
        }),
        401,
      );
    }

    // Hash the new password if user is able to confirm their old password
    const hashedNewPassword = await hashPassword(new_password);

    // Update the user's password
    await db.update(authUsersTable).set({ hashedPassword: hashedNewPassword }).where(eq(authUsersTable.id, id));

    return c.json(
      createApiResponse({
        data: {
          message: 'Password updated successfully',
        },
      }),
      200,
    );
  } catch (error) {
    console.error('Error updating user password:', error);

    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update user password',
        },
      }),
      500,
    );
  }
});
