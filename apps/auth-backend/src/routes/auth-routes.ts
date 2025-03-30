import type { AuthProvider } from '@roll-your-own-auth/shared/types';

import { DEFAULT_AUTH_PROVIDER, VALID_AUTH_PROVIDERS } from '@roll-your-own-auth/shared/constants';
import {
  createUserSchema,
  loginUserSchema,
} from '@roll-your-own-auth/shared/schemas';
import { ApiErrorCode } from '@roll-your-own-auth/shared/types';
import { validateAuthProviders, validateAuthSchema } from '@roll-your-own-auth/shared/validations';
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
  verifyGoogleIdToken,
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

    // Validate the default auth provider
    const defaultAuthProvider = [DEFAULT_AUTH_PROVIDER];
    if (!validateAuthProviders(defaultAuthProvider)) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Invalid default auth provider',
          },
        }),
        500,
      );
    }

    // Create user
    const [user] = await db
      .insert(usersTable)
      .values({
        email,
        hashedPassword,
        name: body.name ?? null,
        authProviders: defaultAuthProvider,
        providerIds: {}, // No provider IDs for email registration
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
 * Login a user with Google
 * POST /api/v1/auth/login/google
 */
publicRoutes.post('/login/google', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get Google OAuth credentials from environment variables
    const { GOOGLE_CLIENT_ID } = env;

    // Get token from request body
    const body = await c.req.json();
    const { idToken } = body;

    if (!idToken) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'Google ID token is required',
          },
        }),
        400,
      );
    }

    // Verify the Google ID token
    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(idToken, GOOGLE_CLIENT_ID);
    } catch {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid Google token',
          },
        }),
        401,
      );
    }

    if (!googleUser.sub) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid Google token - missing user ID',
          },
        }),
        401,
      );
    }

    // Check if user exists in the database
    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, googleUser.email),
    });

    // If user doesn't exist, create a new one
    if (!user) {
      // Generate a secure random password for the user (they will never use it)
      const randomPassword = crypto.randomUUID();
      const hashedPassword = await hashPassword(randomPassword);

      // Validate the auth provider
      const googleAuthProvider = ['google'];
      if (!validateAuthProviders(googleAuthProvider)) {
        return c.json(
          createApiResponse({
            error: {
              code: ApiErrorCode.INTERNAL_SERVER_ERROR,
              message: 'Invalid auth provider',
            },
          }),
          500,
        );
      }

      // Create user in the database
      const [newUser] = await db
        .insert(usersTable)
        .values({
          email: googleUser.email,
          hashedPassword,
          name: googleUser.name,
          emailVerified: true, // Google already verified the email
          authProviders: googleAuthProvider, // Set Google as the auth provider
          providerIds: { google: googleUser.sub }, // Store Google user ID
        })
        .returning();

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      user = newUser;
    } else {
      // If user exists but doesn't have Google as an auth provider, add it
      const authProviders = user.authProviders as string[] || [];
      const providerIds = user.providerIds as Record<string, string> || {};

      if (!authProviders.includes('google')) {
        // Validate the updated providers list
        const updatedProvidersInclGoogle = [...authProviders, 'google'];
        if (!validateAuthProviders(updatedProvidersInclGoogle)) {
          return c.json(
            createApiResponse({
              error: {
                code: ApiErrorCode.VALIDATION_ERROR,
                message: `Invalid auth provider - must be one of: ${VALID_AUTH_PROVIDERS.join(', ')}`,
              },
            }),
            400,
          );
        }

        // Update user to include Google as an auth provider
        await db
          .update(usersTable)
          .set({
            authProviders: updatedProvidersInclGoogle, // Include Google as an auth provider
            providerIds: { ...providerIds, google: googleUser.sub }, // Store Google user ID
            // If email wasn't verified before, verify it now
            emailVerified: true,
          })
          .where(eq(usersTable.id, user.id));
      }
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
      emailVerified: user.emailVerified ?? true, // Google users are verified by default

      // Account status & management
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

/**
 * Link a Google account to an existing account
 * POST /api/v1/auth/link/google
 */
protectedRoutes.post('/link/google', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get user id from auth middleware context variable
    const userId = c.get('userId');

    // Get Google OAuth credentials from environment variables
    const { GOOGLE_CLIENT_ID } = env;

    // Get token from request body
    const body = await c.req.json();
    const { idToken } = body;

    if (!idToken) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'Google ID token is required',
          },
        }),
        400,
      );
    }

    // Verify the Google ID token
    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(idToken, GOOGLE_CLIENT_ID);
    } catch {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INVALID_CREDENTIALS,
            message: 'Invalid Google token',
          },
        }),
        401,
      );
    }

    // Find the current user
    const currentUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!currentUser) {
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

    // Check if this Google account is already linked to another account
    const existingGoogleUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, googleUser.email),
    });

    if (existingGoogleUser && existingGoogleUser.id !== userId) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.CONFLICT,
            message: 'This Google account is already linked to another user',
          },
        }),
        409, // Conflict
      );
    }

    // Update auth providers array and provider IDs
    const authProviders = (currentUser.authProviders as string[]) || [];
    const providerIds = (currentUser.providerIds as Record<string, string>) || {};

    // Check if the provider is already linked
    if (authProviders.includes('google')) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.CONFLICT,
            message: 'Google account already linked',
          },
        }),
        409, // Conflict
      );
    }

    // Validate the updated providers list
    const updatedProvidersInclGoogle = [...authProviders, 'google'];
    if (!validateAuthProviders(updatedProvidersInclGoogle)) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: `Invalid auth provider - must be one of: ${VALID_AUTH_PROVIDERS.join(', ')}`,
          },
        }),
        400,
      );
    }

    // Update the user with the new provider
    await db
      .update(usersTable)
      .set({
        authProviders: updatedProvidersInclGoogle, // Include Google as an auth provider
        providerIds: { ...providerIds, google: googleUser.sub }, // Store Google user ID
        // If the user's email was not verified, verify it now
        emailVerified: true,
      })
      .where(eq(usersTable.id, userId));

    return c.json(
      createApiResponse({
        data: {
          message: 'Google account linked successfully',
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
 * Unlink a provider from an account
 * POST /api/v1/auth/unlink/:provider
 */
protectedRoutes.post('/unlink/:provider', async (c) => {
  try {
    // Get db connection
    const db = c.get('db');

    // Get user id from auth middleware context variable
    const userId = c.get('userId');

    // Get provider from URL params
    const provider = c.req.param('provider');

    // Validate provider is one of the allowed enum values
    if (!VALID_AUTH_PROVIDERS.includes(provider as AuthProvider)) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: `Invalid provider - must be one of: ${VALID_AUTH_PROVIDERS.join(', ')}`,
          },
        }),
        400,
      );
    }

    // Find the current user
    const currentUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });

    if (!currentUser) {
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

    // Get current auth providers
    const authProviders = (currentUser.authProviders as string[]) || [];
    const providerIds = (currentUser.providerIds as Record<string, string>) || {};

    // Prevent removing the last auth provider
    if (authProviders.length <= 1) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: 'Cannot remove the only authentication method',
          },
        }),
        400,
      );
    }

    // Check if the provider is linked
    if (!authProviders.includes(provider)) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: `${provider} is not linked to this account`,
          },
        }),
        400,
      );
    }

    // Remove the provider
    const newAuthProviders = authProviders.filter((p) => p !== provider);
    const newProviderIds = { ...providerIds };
    delete newProviderIds[provider];

    // Update the user
    await db
      .update(usersTable)
      .set({
        authProviders: newAuthProviders,
        providerIds: newProviderIds,
      })
      .where(eq(usersTable.id, userId));

    return c.json(
      createApiResponse({
        data: {
          message: `${provider} account unlinked successfully`,
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

// Mount route groups to authRoutes
authRoutes.route('', publicRoutes);
authRoutes.route('', protectedRoutes);
