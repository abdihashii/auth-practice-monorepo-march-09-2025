import type {
  AuthResponse,
  CreateUserDto,
  NotificationPreferences,
  User,
  UserSettings,
} from '@roll-your-own-auth/shared/types';

import {
  createUserSchema,
  loginUserSchema,
} from '@roll-your-own-auth/shared/schemas';
import { ApiErrorCode } from '@roll-your-own-auth/shared/types';
import { validateAuthSchema } from '@roll-your-own-auth/shared/validations';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { every } from 'hono/combine';
import { getCookie, setCookie } from 'hono/cookie';

import type { CustomEnv } from '@/lib/types';

import { authUsersTable, profilesTable } from '@/db/schema';
import env from '@/env';
import {
  ACCESS_TOKEN_COOKIE_NAME_DEV,
  ACCESS_TOKEN_COOKIE_NAME_PROD,
  REFRESH_TOKEN_COOKIE_NAME_DEV,
  REFRESH_TOKEN_COOKIE_NAME_PROD,
} from '@/lib/constants';
import { imageUploadService } from '@/lib/services/image-upload-service';
import {
  createApiResponse,
  generateRefreshToken,
  generateTokens,
  generateVerificationToken,
  hashPassword,
  refreshAccessToken,
  verifyPassword,
} from '@/lib/utils';
import { sendVerificationEmail } from '@/lib/utils/email';
import { authMiddleware } from '@/middlewares/auth-middleware';
import {
  extractEmailMiddleware,
} from '@/middlewares/extract-email-middleware';
import {
  publicRouteRlsMiddleware,
} from '@/middlewares/public-route-rls-middleware';
import { authRateLimiter } from '@/middlewares/rate-limit-middleware';
import { oauthProviderRoutes } from '@/routes/oauth-provider-routes';

export const authRoutes = new Hono<CustomEnv>();

// Public auth routes (no auth required)
const publicRoutes = new Hono<CustomEnv>();
publicRoutes.route('', oauthProviderRoutes);

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
publicRoutes.post(
  '/register',
  every(extractEmailMiddleware, authRateLimiter, publicRouteRlsMiddleware),
  async (c) => {
    try {
    // Get db connection
      const db = c.get('db');

      // Get body from request of type application/json
      const rawBody = await c.req.json();

      // Check if user already exists and return error if so
      const existingUser = await db.query.authUsersTable.findFirst({
        where: eq(authUsersTable.email, rawBody.email),
      });
      if (existingUser) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.USER_ALREADY_EXISTS,
              message: 'User already exists',
            },
          }),
          400,
        );
      }

      // Validate user input data (email, password, and optional name)
      const validationResult = validateAuthSchema(createUserSchema, rawBody);
      if (!validationResult.isValid) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: 'Invalid input data',
              details: { errors: validationResult.errors },
            },
          }),
          400,
        );
      }

      // Create a body object from the validated data
      const body = validationResult.data as CreateUserDto;

      // Get email and password from body
      const { email, password } = body;

      // Hash user password using Argon2
      const hashedPassword = await hashPassword(password);

      // Generate verification token and expiration date
      const {
        verificationToken,
        verificationTokenExpiresAt,
      } = await generateVerificationToken();

      // Wrap user and profile creation in a transaction
      const { user, profile: _profile } = await db.transaction(async (tx) => {
      // Create user
        const [user] = await tx
          .insert(authUsersTable)
          .values({
            email,
            hashedPassword,
            verificationToken,
            verificationTokenExpiresAt,
          })
          .returning();

        // If user creation fails, throw error to rollback transaction
        if (!user) {
          throw new Error('Failed to create user within transaction');
        }

        // Create profile for user
        const [profile] = await tx.insert(profilesTable).values({
          userId: user.id,
          email: user.email,
        // name: user.email, // Use email as default name
        }).returning();

        // If profile creation fails, throw error to rollback transaction
        if (!profile) {
          throw new Error('Failed to create profile within transaction');
        }

        return { user, profile };
      });

      // If the transaction failed, user/profile will not be populated,
      // but the catch block below should handle the thrown error.
      // We might add an explicit check here if needed, but transaction errors should bubble up.

      // Send verification email
      try {
        const emailResult = await sendVerificationEmail(
          email,
          verificationToken,
          env.FRONTEND_URL,
        );
        if (!emailResult.success) {
          // Delete the user if email sending fails
          await db.delete(authUsersTable).where(eq(authUsersTable.id, user.id));

          const errorDetails = emailResult.error as {
            message?: string;
            name?: string;
            code?: string;
          };

          return c.json(
            createApiResponse({
              error: {
                code: ApiErrorCode.EMAIL_VERIFICATION_FAILED,
                message: 'Failed to send verification email. Registration canceled.',
                details: errorDetails
                  ? {
                      message: errorDetails.message || 'Unknown error',
                      name: errorDetails.name || 'Error',
                      ...(errorDetails.code && { code: errorDetails.code }),
                    }
                  : undefined,
              },
            }),
            400,
          );
        }
      } catch (error) {
        // Delete the user if email sending fails
        await db.delete(authUsersTable).where(eq(authUsersTable.id, user.id));

        console.error('Failed to send verification email:', error);
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.EMAIL_VERIFICATION_FAILED,
              message: 'Failed to send verification email. Registration canceled.',
            },
          }),
          400,
        );
      }

      // Combine user and access token into auth response
      const authResponse: AuthResponse = {
        message: 'Registration successful. Please verify your email before logging in.',
        emailVerificationRequired: true,
      };

      return c.json(
        createApiResponse({
          data: authResponse,
        }),
        200,
      );
    } catch (err) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INTERNAL_SERVER_ERROR,
            message: err instanceof Error ? err.message : 'Internal server error',
          },
        }),
        500,
      );
    }
  },
);

/**
 * Login a user
 * POST /api/v1/auth/login
 */
publicRoutes.post(
  '/login',
  every(extractEmailMiddleware, authRateLimiter, publicRouteRlsMiddleware),
  async (c) => {
    try {
    // Get db connection
      const db = c.get('db');

      // Get body from request of type application/json
      const rawBody = await c.req.json();

      // Validate user input data (email and password)
      const validationResult = validateAuthSchema(loginUserSchema, rawBody);
      if (!validationResult.isValid || !validationResult.data) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: 'Invalid input data',
            },
          }),
          400,
        );
      }

      // Get the email and password from the validated data
      const { email, password } = validationResult.data;

      // Check if user exists in the database
      const user = await db.query.authUsersTable.findFirst({
        where: eq(authUsersTable.email, email),
      });
      if (!user) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.USER_NOT_FOUND,
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

      // Check if user profile exists
      const profile = await db.query.profilesTable.findFirst({
        where: eq(profilesTable.userId, user.id),
      });
      if (!profile) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.USER_NOT_FOUND,
              message: 'User profile not found',
            },
          }),
          404,
        );
      }

      // Verify entered password using Argon2
      const isPasswordValid = await verifyPassword(
        password,
        user.hashedPassword,
      );
      if (!isPasswordValid) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.INVALID_CREDENTIALS,
              message: 'Invalid credentials',
            },
          }),
          401,
        );
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.EMAIL_NOT_VERIFIED,
              message: 'Please verify your email before logging in',
              details: {
                email: user.email,
                emailVerificationRequired: true,
              // Don't include registered date for security reasons
              },
            },
          }),
          403,
        );
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = await generateTokens(user.id);

      // Update user with refresh token after successful login
      await db
        .update(authUsersTable)
        .set({
          refreshToken,
          refreshTokenExpiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ), // 7 days
        })
        .where(eq(authUsersTable.id, user.id));

      // Update profile with user id
      await db
        .update(profilesTable)
        .set({
          lastSuccessfulLogin: new Date(),
          loginCount: (profile.loginCount ?? 0) + 1,
          lastActivityAt: new Date(),
        })
        .where(eq(profilesTable.userId, user.id));

      // Set refresh token in HTTP-only cookie
      if (env.NODE_ENV === 'production') {
        setCookie(c, REFRESH_TOKEN_COOKIE_NAME_PROD, refreshToken, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: true, // Ensures the cookie is only sent over HTTPS
          sameSite: 'None', // Allow cross-site cookie sending in production since both apps are on different domains
          path: '/', // The cookie is only sent to requests to the root domain
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });
      } else {
        setCookie(c, REFRESH_TOKEN_COOKIE_NAME_DEV, refreshToken, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: false, // The cookie is only sent over HTTPS in production
          sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
          path: '/', // The cookie is only sent to requests to the root domain
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });
      }

      // Set the access token in the HTTP-only cookie
      if (env.NODE_ENV === 'production') {
        setCookie(c, ACCESS_TOKEN_COOKIE_NAME_PROD, accessToken, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: true, // Ensures the cookie is only sent over HTTPS
          sameSite: 'None', // Allow cross-site cookie sending in production since both apps are on different domains
          path: '/', // The cookie is only sent to requests to the root domain
          maxAge: 15 * 60, // 15 minutes in seconds
        });
      } else {
        setCookie(c, ACCESS_TOKEN_COOKIE_NAME_DEV, accessToken, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: false, // The cookie is only sent over HTTPS in production
          sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
          path: '/', // The cookie is only sent to requests to the root domain
          maxAge: 15 * 60, // 15 minutes in seconds
        });
      }

      // Create a safe user object (excluding sensitive data)
      const safeUser: User = {
      // Core user information
        id: user.id,
        email: user.email,
        name: profile.name,
        bio: profile.bio,
        profilePicture: profile.profilePicture,
        createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),

        // Email verification
        emailVerified: user.emailVerified ?? false,

        // Account status & management
        isActive: user.isActive ?? true,
        deletedAt: profile.deletedAt?.toISOString() ?? null,

        // User preferences & settings
        settings: (profile.settings as UserSettings) ?? {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
        },

        // User preferences & settings
        notificationPreferences:
        (profile.notificationPreferences as NotificationPreferences) ?? {
          email: {
            enabled: false,
            digest: 'never',
            marketing: false,
          },
          push: {
            enabled: false,
            alerts: false,
          },
        },

        // Activity tracking
        lastActivityAt:
      profile.lastActivityAt?.toISOString() ?? new Date().toISOString(),
        lastSuccessfulLogin:
      profile.lastSuccessfulLogin?.toISOString() ?? new Date().toISOString(),
        loginCount: (profile.loginCount ?? 0) + 1,
      };

      // Combine user and access token into auth response
      const authResponse: AuthResponse = {
        user: safeUser,
      };

      return c.json(
        createApiResponse({
          data: authResponse,
        }),
        200,
      );
    } catch (err) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INTERNAL_SERVER_ERROR,
            message: err instanceof Error
              ? err.message
              : 'Internal server error',
          },
        }),
        500,
      );
    }
  },
);

/**
 * Logout a user
 * POST /api/v1/auth/logout
 *
 * TODO: This route should be protected and only accessible to authenticated
 *       users. We should also invalidate the refresh token in the database.
 */
publicRoutes.post('/logout', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get refresh token from cookie, if production, use __Host- prefix
    const refreshToken = env.NODE_ENV === 'production'
      ? getCookie(c, REFRESH_TOKEN_COOKIE_NAME_PROD)
      : getCookie(c, REFRESH_TOKEN_COOKIE_NAME_DEV);

    // If no refresh token is found, return success (already logged out)
    if (!refreshToken) {
      return c.json(
        createApiResponse({
          data: {
            message: 'Logged out successfully',
          },
        }),
        200,
      );
    }

    // Clear refresh token from database and invalidate it
    await db
      .update(authUsersTable)
      .set({
        refreshToken: null,
        refreshTokenExpiresAt: null,
        lastTokenInvalidation: new Date(),
      })
      .where(eq(authUsersTable.refreshToken, refreshToken));

    // Clear refresh token from cookie
    if (env.NODE_ENV === 'production') {
      setCookie(c, REFRESH_TOKEN_COOKIE_NAME_PROD, '', {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: true, // Ensures the cookie is only sent over HTTPS
        sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
        path: '/', // The cookie is only sent to requests to the root domain
        maxAge: 0, // Expire immediately
      });
    } else {
      setCookie(c, REFRESH_TOKEN_COOKIE_NAME_DEV, '', {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: false, // The cookie is only sent over HTTPS in production
        sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
        path: '/', // The cookie is only sent to requests to the root domain
        maxAge: 0, // Expire immediately
      });
    }

    // Clear access token from cookie
    if (env.NODE_ENV === 'production') {
      setCookie(c, ACCESS_TOKEN_COOKIE_NAME_PROD, '', {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: true, // Ensures the cookie is only sent over HTTPS
        sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
        path: '/', // The cookie is only sent to requests to the root domain
        maxAge: 0, // Expire immediately
      });
    } else {
      setCookie(c, ACCESS_TOKEN_COOKIE_NAME_DEV, '', {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: false, // The cookie is only sent over HTTPS in production
        sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
        path: '/', // The cookie is only sent to requests to the root domain
        maxAge: 0, // Expire immediately
      });
    }

    return c.json(
      createApiResponse({
        data: {
          message: 'Logged out successfully',
        },
      }),
      200,
    );
  } catch (err) {
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: err instanceof Error
            ? err.message
            : 'Internal server error',
        },
      }),
      500,
    );
  }
});

/**
 * Refresh a user's access token
 * POST /api/v1/auth/refresh
 *
 * TODO: This route should be protected and only accessible to authenticated
 *       users. We should also invalidate the refresh token in the database.
 */
publicRoutes.post('/refresh', authRateLimiter, async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get refresh token from cookie, if production, use __Host- prefix
    const refreshToken = env.NODE_ENV === 'production'
      ? getCookie(c, REFRESH_TOKEN_COOKIE_NAME_PROD)
      : getCookie(c, REFRESH_TOKEN_COOKIE_NAME_DEV);
    if (!refreshToken) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.NO_REFRESH_TOKEN,
            message: 'No refresh token provided',
          },
        }),
        401,
      );
    }

    // Find the user with this refresh token
    const user = await db.query.authUsersTable.findFirst({
      where: eq(authUsersTable.refreshToken, refreshToken),
    });
    if (!user || !user.refreshTokenExpiresAt) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INVALID_REFRESH_TOKEN,
            message: 'Invalid refresh token',
          },
        }),
        401,
      );
    }

    // Find the user profile
    const profile = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.userId, user.id),
    });
    if (!profile) {
      return c.json(createApiResponse({
        error: {
          code: ApiErrorCode.USER_NOT_FOUND,
          message: 'User profile not found',
        },
      }), 404);
    }

    // Check if refresh token is expired
    if (user.refreshTokenExpiresAt < new Date()) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.REFRESH_TOKEN_EXPIRED,
            message: 'Refresh token expired',
          },
        }),
        401,
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.USER_INACTIVE,
            message: 'User account is not active',
          },
        }),
        401,
      );
    }

    // Generate new access token
    let newAccessToken: string;
    try {
      newAccessToken = await refreshAccessToken(refreshToken);
    } catch (error) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INVALID_REFRESH_TOKEN,
            message: error instanceof Error
              ? error.message
              : 'Failed to refresh token',
          },
        }),
        401,
      );
    }

    // Generate a new refresh token for rotation
    let newRefreshToken: string;
    try {
      newRefreshToken = await generateRefreshToken(user.id, env.JWT_SECRET);
    } catch (error) {
      // Log the error
      console.error('Failed to generate tokens:', error);

      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Failed to generate a new refresh token',
          },
        }),
        500,
      );
    }

    // Update user with new refresh token (rotation)
    await db
      .update(authUsersTable)
      .set({
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ), // 7 days
      })
      .where(eq(authUsersTable.id, user.id));

    // Update profile with last activity at
    await db
      .update(profilesTable)
      .set({
        lastActivityAt: new Date(),
      })
      .where(eq(profilesTable.userId, user.id));

    // Replace the old refresh token in the HTTP-only cookie with the newly
    // rotated one
    if (env.NODE_ENV === 'production') {
      setCookie(c, REFRESH_TOKEN_COOKIE_NAME_PROD, newRefreshToken, {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: true, // Ensures the cookie is only sent over HTTPS
        sameSite: 'None', // Allow cross-site cookie sending in production since both apps are on different domains
        path: '/', // The cookie is only sent to requests to the root domain
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });
    } else {
      setCookie(c, REFRESH_TOKEN_COOKIE_NAME_DEV, newRefreshToken, {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: false, // The cookie is only sent over HTTPS in production
        sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
        path: '/', // The cookie is only sent to requests to the root domain
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });
    }

    // Replace the old access token in the HTTP-only cookie with the newly
    // generated one
    if (env.NODE_ENV === 'production') {
      setCookie(c, ACCESS_TOKEN_COOKIE_NAME_PROD, newAccessToken, {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: true, // Ensures the cookie is only sent over HTTPS
        sameSite: 'None', // Allow cross-site cookie sending in production since both apps are on different domains
        path: '/', // The cookie is only sent to requests to the root domain
        maxAge: 15 * 60, // 15 minutes in seconds
      });
    } else {
      setCookie(c, ACCESS_TOKEN_COOKIE_NAME_DEV, newAccessToken, {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: false, // The cookie is only sent over HTTPS in production
        sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
        path: '/', // The cookie is only sent to requests to the root domain
        maxAge: 15 * 60, // 15 minutes in seconds
      });
    }

    return c.json(
      createApiResponse({
        data: {
          message: 'Access token refreshed successfully',
        },
      }),
      200,
    );
  } catch (err) {
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: err instanceof Error
            ? err.message
            : 'Internal server error',
        },
      }),
      500,
    );
  }
});

/**
 * Verify a user's email address
 * POST /api/v1/auth/verify-email/:token
 */
publicRoutes.post(
  '/verify-email/:token',
  every(publicRouteRlsMiddleware),
  async (c) => {
    try {
      // Get db connection
      const db = c.get('db');

      // Get the token from the request params
      const token = c.req.param('token');
      if (!token) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.VALIDATION_ERROR,
              message: 'Invalid input data',
            },
          }),
          400,
        );
      }

      // Find the user with this verification token
      const user = await db.query.authUsersTable.findFirst({
        where: eq(authUsersTable.verificationToken, token),
      });
      if (!user) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.INVALID_EMAIL_VERIFICATION_TOKEN,
              message: 'Invalid email verification token',
            },
          }),
          401,
        );
      }

      // Find the user profile
      const profile = await db.query.profilesTable.findFirst({
        where: eq(profilesTable.userId, user.id),
      });
      if (!profile) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.USER_NOT_FOUND,
              message: 'User profile not found',
            },
          }),
          404,
        );
      }

      // Check if the token has expired
      if (
        !user.verificationTokenExpiresAt
        || user.verificationTokenExpiresAt < new Date()
      ) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED,
              message: 'Email verification token expired',
            },
          }),
          401,
        );
      }

      // If user is already verified, return success
      if (user.emailVerified) {
        return c.json(
          createApiResponse({
            data: {
              message: 'Email already verified',
              emailVerified: true,
            },
          }),
          200,
        );
      }

      // Generate JWT tokens now that email is verified
      const { accessToken, refreshToken } = await generateTokens(user.id);

      // Update user as verified, clear verification token, and set refresh token
      await db
        .update(authUsersTable)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiresAt: null,
          refreshToken,
          refreshTokenExpiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ), // 7 days
          updatedAt: new Date(),
        })
        .where(eq(authUsersTable.id, user.id));

      // Update profile with last successful login and login count
      await db
        .update(profilesTable)
        .set({
          lastSuccessfulLogin: new Date(),
          loginCount: 1,
          updatedAt: new Date(),
        })
        .where(eq(profilesTable.userId, user.id));

      // Set refresh token in HTTP-only cookie
      if (env.NODE_ENV === 'production') {
        setCookie(c, REFRESH_TOKEN_COOKIE_NAME_PROD, refreshToken, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: true, // Ensures the cookie is only sent over HTTPS
          sameSite: 'None', // Allow cross-site cookie sending in production since both apps are on different domains
          path: '/', // The cookie is only sent to requests to the root domain
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });
      } else {
        setCookie(c, REFRESH_TOKEN_COOKIE_NAME_DEV, refreshToken, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: false, // The cookie is only sent over HTTPS in production
          sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
          path: '/', // The cookie is only sent to requests to the root domain
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });
      }

      // Set the access token in the HTTP-only cookie
      if (env.NODE_ENV === 'production') {
        setCookie(c, ACCESS_TOKEN_COOKIE_NAME_PROD, accessToken, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: true, // Ensures the cookie is only sent over HTTPS
          sameSite: 'None', // Allow cross-site cookie sending in production since both apps are on different domains
          path: '/', // The cookie is only sent to requests to the root domain
          maxAge: 15 * 60, // 15 minutes in seconds
        });
      } else {
        setCookie(c, ACCESS_TOKEN_COOKIE_NAME_DEV, accessToken, {
          httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
          secure: false, // The cookie is only sent over HTTPS in production
          sameSite: 'Lax', // Prevents the cookie from being sent along with requests to other sites
          path: '/', // The cookie is only sent to requests to the root domain
          maxAge: 15 * 60, // 15 minutes in seconds
        });
      }

      // Create a safe user object
      const safeUser: User = {
      // Core user information
        id: user.id,
        email: user.email,
        name: profile.name,
        bio: profile.bio,
        profilePicture: profile.profilePicture,
        createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),

        // Email verification
        emailVerified: true,

        // Account status & management
        isActive: user.isActive ?? true,
        deletedAt: profile.deletedAt?.toISOString() ?? null,

        // User preferences & settings
        settings: (profile.settings as UserSettings) ?? {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
        },
        notificationPreferences:
        (profile.notificationPreferences as NotificationPreferences) ?? {
          email: {
            enabled: false,
            digest: 'never',
            marketing: false,
          },
          push: {
            enabled: false,
            alerts: false,
          },
        },

        // Activity tracking
        lastActivityAt: new Date().toISOString(),
        lastSuccessfulLogin: new Date().toISOString(),
        loginCount: 1,
      };

      const authResponse: AuthResponse = {
        user: safeUser,
        message: 'Email verified successfully',
      };

      return c.json(createApiResponse({
        data: authResponse,
      }), 200);
    } catch (err) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INTERNAL_SERVER_ERROR,
            message: err instanceof Error
              ? err.message
              : 'Internal server error',
          },
        }),
        500,
      );
    }
  },
);

/**
 * Resend verification email
 * POST /api/v1/auth/resend-verification-email
 */
publicRoutes.post('/resend-verification-email', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get email from request body
    const { email } = await c.req.json();
    if (!email || typeof email !== 'string') {
      return c.json(createApiResponse({
        error: {
          code: ApiErrorCode.VALIDATION_ERROR,
          message: 'Valid email is required',
        },
      }), 400);
    }

    // Find the user with this email
    const user = await db.query.authUsersTable.findFirst({
      where: eq(authUsersTable.email, email),
    });
    // For security reasons, don't reveal if user exists or not
    // We'll return the same message either way
    if (!user || user.emailVerified) {
      return c.json(createApiResponse({
        data: {
          message: 'If your email exists in our system, a verification link has been sent to you.',
        },
      }), 200);
    }

    // Generate verification token and expiration date
    const {
      verificationToken,
      verificationTokenExpiresAt,
    } = await generateVerificationToken();

    // Update user with new verification token
    await db.update(authUsersTable).set({
      verificationToken,
      verificationTokenExpiresAt,
      updatedAt: new Date(),
    }).where(eq(authUsersTable.id, user.id));

    // Send verification email
    try {
      const emailResult = await sendVerificationEmail(
        email,
        verificationToken,
        env.FRONTEND_URL,
      );
      if (!emailResult.success) {
        console.error('Failed to send verification email:', emailResult.error);

        const errorDetails = emailResult.error as {
          message?: string;
          name?: string;
          code?: string;
        };

        return c.json(createApiResponse({
          error: {
            code: ApiErrorCode.EMAIL_VERIFICATION_FAILED,
            message: 'Failed to send verification email',
            details: errorDetails
              ? {
                  message: errorDetails.message || 'Unknown error',
                  name: errorDetails.name || 'Error',
                  ...(errorDetails.code && { code: errorDetails.code }),
                }
              : undefined,
          },
        }), 400);
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return c.json(createApiResponse({
        error: {
          code: ApiErrorCode.EMAIL_VERIFICATION_FAILED,
          message: 'Failed to send verification email',
        },
      }), 400);
    }

    return c.json(createApiResponse({
      data: {
        message: 'If your email exists in our system, a verification link has been sent to you.',
      },
    }), 200);
  } catch (err) {
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: err instanceof Error
            ? err.message
            : 'Internal server error',
        },
      }),
      500,
    );
  }
});

// Protected auth routes (auth required)
const protectedRoutes = new Hono<CustomEnv>();
protectedRoutes.use('*', authMiddleware);

protectedRoutes.get('/me', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get user id from auth middleware context variable
    const userId = c.get('userId');

    // Find the user from the database
    const user = await db.query.authUsersTable.findFirst({
      where: eq(authUsersTable.id, userId),
    });
    if (!user) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.USER_NOT_FOUND,
            message: 'User not found',
          },
        }),
        404,
      );
    }

    // Find the user profile
    const profile = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.userId, user.id),
    });
    if (!profile) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.USER_NOT_FOUND,
            message: 'User profile not found',
          },
        }),
        404,
      );
    }

    // Get a new pre-signed URL if the profile picture is set
    const signedUrl = profile.profilePicture
      ? await imageUploadService.getImageUrl(profile.profilePicture)
      : null;

    // Create a safe user object (excluding sensitive data)
    const safeUser: User = {
      // Core user information
      id: user.id,
      email: user.email,
      name: profile.name,
      bio: profile.bio,
      profilePicture: signedUrl,
      createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),

      // Email verification
      emailVerified: user.emailVerified ?? false,

      // Account status & management
      isActive: user.isActive ?? true,
      deletedAt: profile.deletedAt?.toISOString() ?? null,

      // User preferences & settings
      settings: (profile.settings as UserSettings) ?? {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
      },

      // User preferences & settings
      notificationPreferences:
        (profile.notificationPreferences as NotificationPreferences) ?? {
          email: {
            enabled: false,
          },
        },

      // Activity tracking
      lastActivityAt: profile.lastActivityAt?.toISOString() ?? null,
      lastSuccessfulLogin: profile.lastSuccessfulLogin?.toISOString() ?? null,
      loginCount: profile.loginCount ?? 0,
    };

    return c.json(
      createApiResponse({
        data: safeUser,
      }),
      200,
    );
  } catch (err) {
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: err instanceof Error ? err.message : 'Internal server error',
        },
      }),
      500,
    );
  }
});

// Mount route groups to authRoutes
authRoutes.route('', publicRoutes);
authRoutes.route('', protectedRoutes);
