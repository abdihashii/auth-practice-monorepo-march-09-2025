// Third-party imports
import { eq } from "drizzle-orm";
import { Hono } from "hono";

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
import { createApiResponse, generateTokens, hashPassword } from "@/utils";

export const authRoutes = new Hono<CustomEnv>();

/**
 * Register a new user
 * POST /api/v1/auth/register
 *
 * TODO:
 * - input validation
 * - `ApiResponse` typing for returns (success and error)
 * - add `authentication_token`
 */
authRoutes.post("/register", async (c) => {
  try {
    // Get db connection
    const db = c.get("db");

    // Get body from request of type application/json
    const body = await c.req.json<CreateUserDto>();

    // Check if user already exists and return error if so
    const existingUser = await db.query.usersTable.findFirst({
      where: eq(usersTable.email, body.email),
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
