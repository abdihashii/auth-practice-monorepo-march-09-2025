import type {
  UserDetail,
  UserListItem,
} from '@roll-your-own-auth/shared/types';

import { zValidator } from '@hono/zod-validator';
import { ImageMimeTypes } from '@roll-your-own-auth/shared/constants';
import {
  idParamSchema,
  updatePasswordSchema,
  updateUserSchema,
} from '@roll-your-own-auth/shared/schemas';
import { ApiErrorCode } from '@roll-your-own-auth/shared/types';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { every } from 'hono/combine';

import type { CustomEnv } from '@/lib/types';

import {
  authUserConnections,
  authUsersTable,
  profilesTable,
} from '@/db/schema';
import {
  DEFAULT_USER_DETAIL_COLUMNS,
  DEFAULT_USER_LIST_COLUMNS,
} from '@/lib/constants';
import { imageUploadService } from '@/lib/services/image-upload-service';
import {
  comparePasswords,
  createApiResponse,
  createSelectObject,
  hashPassword,
} from '@/lib/utils';
import { authMiddleware } from '@/middlewares/auth-middleware';

export const userRoutes = new Hono<CustomEnv>();

// Protect all routes with the auth middleware
userRoutes.use(authMiddleware);

// Get all users
userRoutes.get('/', async (c) => {
  try {
    const db = c.get('db');

    // Create select object using the helper function
    const selectObj = createSelectObject(
      authUsersTable,
      DEFAULT_USER_LIST_COLUMNS,
    );

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
 * Update a user's profile information.
 * Uses PATCH instead of PUT to indicate that only the provided fields are
 * being updated.
 * PATCH /users/:id
 */
userRoutes.patch(
  '/:id',
  every(
    zValidator('param', idParamSchema),
    zValidator('json', updateUserSchema),
  ),
  async (c) => {
    try {
      const db = c.get('db');
      const { id } = c.req.param();

      // Get the request body
      const body = await c.req.json();

      // Build the update object dynamically
      const updateData: Partial<
        { name?: string; bio?: string; profilePicture?: string }
      > = {};
      if (body.name !== undefined) {
        updateData.name = body.name;
      }
      if (body.bio !== undefined) {
        updateData.bio = body.bio;
      }
      if (body.profilePicture !== undefined) {
        updateData.profilePicture = body.profilePicture;
      }

      // Check if any fields were provided for update
      if (Object.keys(updateData).length === 0) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: 'No fields provided for update',
            },
          }),
          400,
        );
      }

      const [updatedProfile] = await db
        .update(profilesTable)
        .set(updateData)
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
  },
);

/**
 * Change a user's password
 * PUT /users/:id/password
 */
userRoutes.put(
  '/:id/password',
  every(
    zValidator('param', idParamSchema),
    zValidator('json', updatePasswordSchema),
  ),
  async (c) => {
    try {
    // Get the database connection from the context
      const db = c.get('db');

      // Get the user id from the request parameters
      const { id } = c.req.param();

      // Get the old and new passwords from the request body
      const {
        old_password,
        new_password,
        confirm_password,
      } = await c.req.json();

      // Final check to ensure the new password and confirm password match
      if (new_password !== confirm_password) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: 'Passwords do not match',
            },
          }),
          400,
        );
      }

      // Check if the new password is the same as the old password
      if (new_password === old_password) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: 'New password cannot be the same as the old password',
            },
          }),
          400,
        );
      }

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

      // Check if the user has a password set (might be null for OAuth users)
      if (!user.hashedPassword) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.INVALID_CREDENTIALS,
              message: 'Invalid credentials', // Keep message generic for security
            },
          }),
          401,
        );
      }

      // Check if the old password is correct
      const isPasswordCorrect = await comparePasswords(
        old_password,
        user.hashedPassword,
      );
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
      await db
        .update(authUsersTable)
        .set({ hashedPassword: hashedNewPassword })
        .where(eq(authUsersTable.id, id));

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
  },
);

userRoutes.post('/:id/profile-picture', async (c) => {
  try {
    const db = c.get('db');
    const { id: userId } = c.req.param();

    // Get the form data from the request
    const formData = await c.req.formData();

    // Get the file from the form data
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'No file provided',
          },
        }),
        400,
      );
    }

    // Check if the file is an image type (jpeg, png, webp)
    if (!ImageMimeTypes.includes(file.type as typeof ImageMimeTypes[number])) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'Invalid file type',
          },
        }),
        400,
      );
    }

    // Check if the file is too large (100KB max)
    if (file.size > 100 * 1024) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'File is too large',
          },
        }),
        400,
      );
    }

    // Upload the file to R2 and use: `pfp_userId` as the object key. If
    // the user already has a profile picture, we will overwrite it because
    // the object key will be the same and a user should only have one profile
    // picture.
    const objectKey = `pfp_${userId}`;
    const fileContent = await file.arrayBuffer();
    const contentType = file.type; // Get the content type
    await imageUploadService.uploadImage(
      fileContent,
      objectKey,
      contentType,
    );

    // Update the user's profile picture in the database
    await db
      .update(profilesTable)
      // Save the object key to the db instead of the signed URL because the
      // pre-signed URL is ephemeral and lasts only 5 minutes.
      .set({ profilePicture: objectKey })
      .where(eq(profilesTable.userId, userId));

    return c.json(
      createApiResponse({
        data: {
          message: 'Profile picture updated successfully',
        },
      }),
      200,
    );
  } catch (error) {
    console.error('Error updating user profile picture:', error);

    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to update user profile picture',
        },
      }),
      500,
    );
  }
});

/**
 * Delete a user
 * DELETE /users/:id
 */
// eslint-disable-next-line drizzle/enforce-delete-with-where
userRoutes.delete('/:id', zValidator('param', idParamSchema), async (c) => {
  try {
    const db = c.get('db');
    const { id: userId } = c.req.param();

    // Delete the user from the auth.users table.
    await db.delete(authUsersTable).where(eq(authUsersTable.id, userId));

    // Delete the user from the profiles table.
    await db.delete(profilesTable).where(eq(profilesTable.userId, userId));

    // Delete the user connections from the auth.user_connections table.
    await db
      .delete(authUserConnections)
      .where(eq(authUserConnections.userId, userId));

    return c.json(
      createApiResponse({
        data: {
          message: 'User deleted successfully',
        },
      }),
      200,
    );
  } catch (error) {
    console.error('Error deleting user profile picture:', error);

    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: 'Failed to delete user',
        },
      }),
      500,
    );
  }
});
