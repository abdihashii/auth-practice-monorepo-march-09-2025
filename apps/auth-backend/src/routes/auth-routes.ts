// Third-party imports
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";

// Local imports
import { usersTable } from "@/db/schema";
import {
  ApiErrorCode,
  type AuthResponse,
  type CreateUserDto,
  type CustomEnv,
  type NotificationPreferences,
  type User,
  type UserSettings,
} from "@/types";
import {
  createApiResponse,
  generateTokens,
  hashPassword,
  verifyPassword,
} from "@/utils";
import {
  createUserSchema,
  loginUserSchema,
  validateAuthSchema,
} from "@/validation/auth-validation";

export const authRoutes = new Hono<CustomEnv>();

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
authRoutes.post("/register", async (c) => {
  try {
    // Get db connection
    const db = c.get("db");

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
            message: "User already exists",
          },
        }),
        400
      );
    }

    // Validate user input data (email, password, and optional name)
    const validationResult = validateAuthSchema(createUserSchema, rawBody);
    if (!validationResult.isValid) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: "Invalid input data",
            details: { errors: validationResult.errors },
          },
        }),
        400
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
      throw new Error("Failed to create user");
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
    setCookie(c, "auth-app-refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in production
      sameSite: "Lax", // or 'Strict' if not dealing with third-party redirects
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      // Optional: Use __Host- prefix for additional security in production
      ...(process.env.NODE_ENV === "production" && {
        prefix: "host", // This will prefix the cookie with __Host-
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
        theme: "system",
        language: "en",
        timezone: "UTC",
      },
      notificationPreferences:
        (user.notificationPreferences as NotificationPreferences) ?? {
          email: {
            enabled: false,
            digest: "never",
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
      200
    );
  } catch (err) {
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: err instanceof Error ? err.message : "Internal server error",
        },
      }),
      500
    );
  }
});

/**
 * Login a user
 * POST /api/v1/auth/login
 */
authRoutes.post("/login", async (c) => {
  try {
    // Get db connection
    const db = c.get("db");

    // Get body from request of type application/json
    const rawBody = await c.req.json();

    // Validate user input data (email and password)
    const validationResult = validateAuthSchema(loginUserSchema, rawBody);
    if (!validationResult.isValid || !validationResult.data) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.VALIDATION_ERROR,
            message: "Invalid input data",
          },
        }),
        400
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
            message: "User not found",
          },
        }),
        404
      );
    }

    // Verify entered password using Argon2
    const isPasswordValid = await verifyPassword(password, user.hashedPassword);
    if (!isPasswordValid) {
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.INVALID_CREDENTIALS,
            message: "Invalid credentials",
          },
        }),
        401
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
    setCookie(c, "auth-app-refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // true in production
      sameSite: "Lax", // or 'Strict' if not dealing with third-party redirects
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      // Optional: Use __Host- prefix for additional security in production
      ...(process.env.NODE_ENV === "production" && {
        prefix: "host", // This will prefix the cookie with __Host-
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
        theme: "system",
        language: "en",
        timezone: "UTC",
      },

      // User preferences & settings
      notificationPreferences:
        (user.notificationPreferences as NotificationPreferences) ?? {
          email: {
            enabled: false,
            digest: "never",
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
      200
    );
  } catch (err) {
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: err instanceof Error ? err.message : "Internal server error",
        },
      }),
      500
    );
  }
});
