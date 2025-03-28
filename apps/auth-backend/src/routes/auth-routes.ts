import {
  ApiErrorCode,
  createUserSchema,
  loginUserSchema,
  validateAuthSchema,
} from '@roll-your-own-auth/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

import type { AuthResponse, CreateUserDto, CustomEnv, NotificationPreferences, TokenResponse, User, UserSettings } from '@/lib/types';

import { usersTable } from '@/db/schema';
import env from '@/env';
import {
  createApiResponse,
  generateTokens,
  hashPassword,
  verifyPassword,
} from '@/lib/utils';
import { authMiddleware } from '@/middlewares/auth-middleware';

export const authRoutes = new Hono<CustomEnv>();

// Public auth routes (no auth required)
const publicRoutes = new Hono<CustomEnv>();

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
publicRoutes.post('/register', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get body from request of type application/json
    const rawBody = await c.req.json();

    // Check if user already exists and return error if so
    const existingUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, rawBody.email),
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

    // Create user
    const [user] = await db
      .insert(usersTable)
      .values({
        email,
        hashedPassword,
        name: body.name ?? null,
      })
      .returning();

    // If user creation fails, throw error and have it handled in catch block
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    // Update user with refresh token after successful registration
    await db
      .update(usersTable)
      .set({
        refreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        lastSuccessfulLogin: new Date(),
        loginCount: 1,
      })
      .where(eq(usersTable.id, user.id));

    // Set refresh token in HTTP-only cookie
    setCookie(c, 'auth-app-refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // true in production
      sameSite: 'Lax', // or 'Strict' if not dealing with third-party redirects
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      // Optional: Use __Host- prefix for additional security in production
      ...(env.NODE_ENV === 'production' && {
        prefix: 'host', // This will prefix the cookie with __Host-
      }),
    });

    // Create a safe user object (excluding sensitive data)
    const safeUser: User = {
      // Core user information
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),

      // Email verification
      emailVerified: user.emailVerified ?? false,

      // Account status & managemetn
      isActive: user.isActive ?? true,
      deletedAt: user.deletedAt?.toISOString() ?? null,

      // User preferences & settings
      settings: (user.settings as UserSettings) ?? {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
      },
      notificationPreferences:
        (user.notificationPreferences as NotificationPreferences) ?? {
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
      lastActivityAt: user.lastActivityAt?.toISOString() ?? null,
      lastSuccessfulLogin: user.lastSuccessfulLogin?.toISOString() ?? null,
      loginCount: user.loginCount ?? 0,
    };

    // Combine user and access token into auth response
    const authResponse: AuthResponse = {
      user: safeUser,
      accessToken,
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
});

/**
 * Login a user
 * POST /api/v1/auth/login
 */
publicRoutes.post('/login', async (c) => {
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
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, email),
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

    // Verify entered password using Argon2
    const isPasswordValid = await verifyPassword(password, user.hashedPassword);
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

    // Generate JWT tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    // Update user with refresh token after successful login
    await db
      .update(usersTable)
      .set({
        refreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        lastSuccessfulLogin: new Date(),
        loginCount: (user.loginCount ?? 0) + 1,
        lastActivityAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    // Set refresh token in HTTP-only cookie
    setCookie(c, 'auth-app-refreshToken', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // true in production
      sameSite: 'Lax', // or 'Strict' if not dealing with third-party redirects
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      // Optional: Use __Host- prefix for additional security in production
      ...(env.NODE_ENV === 'production' && {
        prefix: 'host', // This will prefix the cookie with __Host-
      }),
    });

    // Create a safe user object (excluding sensitive data)
    const safeUser: User = {
      // Core user information
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),

      // Email verification
      emailVerified: user.emailVerified ?? false,

      // Account status & management
      isActive: user.isActive ?? true,
      deletedAt: user.deletedAt?.toISOString() ?? null,

      // User preferences & settings
      settings: (user.settings as UserSettings) ?? {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
      },

      // User preferences & settings
      notificationPreferences:
        (user.notificationPreferences as NotificationPreferences) ?? {
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
        user.lastActivityAt?.toISOString() ?? new Date().toISOString(),
      lastSuccessfulLogin:
        user.lastSuccessfulLogin?.toISOString() ?? new Date().toISOString(),
      loginCount: (user.loginCount ?? 0) + 1,
    };

    // Combine user and access token into auth response
    const authResponse: AuthResponse = {
      user: safeUser,
      accessToken,
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
});

/**
 * Logout a user
 * POST /api/v1/auth/logout
 */
publicRoutes.post('/logout', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get refresh token from cookie
    const refreshToken = getCookie(c, 'auth-app-refreshToken');

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
      .update(usersTable)
      .set({
        refreshToken: null,
        refreshTokenExpiresAt: null,
        lastTokenInvalidation: new Date(),
      })
      .where(eq(usersTable.refreshToken, refreshToken));

    // Clear refresh token from cookie
    setCookie(c, 'auth-app-refreshToken', '', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // true in production
      sameSite: 'Lax', // or 'Strict' if not dealing with third-party redirects
      path: '/',
      maxAge: 0, // Expire immediately
      ...(env.NODE_ENV === 'production' && {
        prefix: 'host', // This will prefix the cookie with __Host-
      }),
    });

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
          message: err instanceof Error ? err.message : 'Internal server error',
        },
      }),
      500,
    );
  }
});

/**
 * Refresh a user's access token
 * POST /api/v1/auth/refresh
 */
publicRoutes.post('/refresh', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get refresh token from cookie
    const refreshToken = getCookie(c, 'auth-app-refreshToken');
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
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.refreshToken, refreshToken),
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

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken }
      = await generateTokens(user.id);

    // Update user with new refresh token (rotation)
    await db
      .update(usersTable)
      .set({
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        lastActivityAt: new Date(),
      })
      .where(eq(usersTable.id, user.id));

    // Set new refresh token cookie
    setCookie(c, 'auth-app-refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // true in production
      sameSite: 'Lax', // or 'Strict' if not dealing with third-party redirects
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      // Optional: Use __Host- prefix for additional security in production
      ...(env.NODE_ENV === 'production' && {
        prefix: 'host', // This will prefix the cookie with __Host-
      }),
    });

    const tokenResponse: TokenResponse = {
      accessToken: newAccessToken,
    };

    return c.json(
      createApiResponse({
        data: tokenResponse,
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
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
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

    // Create a safe user object (excluding sensitive data)
    const safeUser: User = {
      // Core user information
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? new Date().toISOString(),

      // Email verification
      emailVerified: user.emailVerified ?? false,

      // Account status & management
      isActive: user.isActive ?? true,
      deletedAt: user.deletedAt?.toISOString() ?? null,

      // User preferences & settings
      settings: (user.settings as UserSettings) ?? {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
      },

      // User preferences & settings
      notificationPreferences:
        (user.notificationPreferences as NotificationPreferences) ?? {
          email: {
            enabled: false,
          },
        },

      // Activity tracking
      lastActivityAt: user.lastActivityAt?.toISOString() ?? null,
      lastSuccessfulLogin: user.lastSuccessfulLogin?.toISOString() ?? null,
      loginCount: user.loginCount ?? 0,
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
