import type { InferSelectModel } from 'drizzle-orm';
import type { Context } from 'hono';

import { and, eq } from 'drizzle-orm';
import { setCookie } from 'hono/cookie';

import type { IOAuthProvider } from '@/lib/providers/oauth-provider';
import type { CustomEnv, ProviderUserProfile } from '@/lib/types';

import {
  authUserConnections,
  authUsersTable,
  profilesTable,
} from '@/db/schema';
import env from '@/env';
import {
  ACCESS_TOKEN_COOKIE_NAME_DEV,
  ACCESS_TOKEN_COOKIE_NAME_PROD,
  REFRESH_TOKEN_COOKIE_NAME_DEV,
  REFRESH_TOKEN_COOKIE_NAME_PROD,
} from '@/lib/constants';
import { generateTokens } from '@/lib/utils';

// Define types for the database connection and user connection
type DrizzleDB = CustomEnv['Variables']['db'];
type AuthUserConnection = InferSelectModel<typeof authUserConnections>;

/**
 * Interface representing the standardized user profile from any OAuth provider
 */
export interface OAuthUserProfileData {
  provider: IOAuthProvider['providerName'];
  providerId: string;
  email: string | null;
  name?: string | null;
  picture?: string | null;
}

/**
 * Find or create a user based on OAuth provider data
 *
 * @param db - The database instance
 * @param userProfile - The standardized user profile from the OAuth provider
 * @returns Object containing userId and whether the user was just created
 */
export async function findOrCreateOAuthUser(
  db: DrizzleDB,
  userProfile: ProviderUserProfile,
) {
  let userId: string;
  let userJustCreated = false;

  // Check if a connection already exists for this provider user
  const connection = await db.query.authUserConnections.findFirst({
    where: and(
      eq(
        authUserConnections.provider,
        userProfile.provider as IOAuthProvider['providerName'],
      ),
      eq(authUserConnections.providerUserId, userProfile.providerId),
    ),
  });

  if (connection) {
    // Connection exists, use the associated userId
    userId = connection.userId;
  } else {
    // No existing connection, check if user exists by email
    if (!userProfile.email) {
      throw new Error('Email not provided by OAuth provider');
    }

    const existingUserByEmail = await db.query.authUsersTable.findFirst({
      where: eq(authUsersTable.email, userProfile.email),
      with: { connections: true },
    });

    if (existingUserByEmail) {
      // User exists with this email, link the provider account
      userId = existingUserByEmail.id;

      // Double-check if the connection already exists
      const providerConnectionExists = existingUserByEmail
        .connections
        .some(
          (conn: AuthUserConnection) => conn.provider === userProfile.provider,
        );

      if (!providerConnectionExists) {
        await db.insert(authUserConnections).values({
          userId,
          provider: userProfile.provider as IOAuthProvider['providerName'],
          providerUserId: userProfile.providerId,
        });
      } else {
        console.warn(
          `User ${userId} already had a ${userProfile.provider} connection, but it wasn't found initially.`,
        );
      }
    } else {
      // No user found by connection or email, create a new user and profile
      userJustCreated = true;
      const newUserResult = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(authUsersTable).values({
          email: userProfile.email!,
          emailVerified: true, // Email is verified by the provider
        }).returning();

        if (!newUser) throw new Error('Failed to create user in transaction');

        await tx.insert(authUserConnections).values({
          userId: newUser.id,
          provider: userProfile.provider as IOAuthProvider['providerName'],
          providerUserId: userProfile.providerId,
        });

        // Create profile with provider data
        await tx.insert(profilesTable).values({
          userId: newUser.id,
          email: newUser.email,
          name: userProfile.name,
          profilePicture: userProfile.picture,
        });

        return newUser;
      });
      userId = newUserResult.id;
    }
  }

  return { userId, userJustCreated };
}

/**
 * Update user profile with data from OAuth provider if fields are empty
 *
 * @param db - The database instance
 * @param userId - The user ID
 * @param userProfile - The standardized user profile from the OAuth provider
 */
export async function updateUserProfileFromOAuth(
  db: DrizzleDB,
  userId: string,
  userProfile: ProviderUserProfile,
) {
  // Fetch the user's profile
  const userProfileForUpdate = await db.query.profilesTable.findFirst({
    where: eq(profilesTable.userId, userId),
  });

  if (userProfileForUpdate) {
    const profileUpdateData: Partial<
      { name: string | null; profilePicture: string | null }
    > = {};

    // Update name only if provider has one AND the current one is empty/null
    if (userProfile.name && !userProfileForUpdate.name) {
      profileUpdateData.name = userProfile.name;
    }

    // Update picture only if provider has one AND the current one is empty/null
    if (userProfile.picture && !userProfileForUpdate.profilePicture) {
      profileUpdateData.profilePicture = userProfile.picture;
    }

    // If there are updates to apply, update the profile
    if (Object.keys(profileUpdateData).length > 0) {
      await db
        .update(profilesTable)
        .set(profileUpdateData)
        .where(eq(profilesTable.userId, userId));
    }
  } else {
    console.error(
      `Profile not found for user ${userId} before token generation.`,
    );
  }
}

/**
 * Generate authentication tokens and set cookies
 *
 * @param c - The Hono context
 * @param db - The database instance
 * @param userId - The user ID
 * @param userJustCreated - Whether the user was just created (affects
 *                          login count)
 * @returns The URL to redirect to after successful authentication
 */
export async function setAuthTokensAndCookies(
  c: Context<CustomEnv>,
  db: DrizzleDB,
  userId: string,
  userJustCreated: boolean,
) {
  // Fetch user and profile data
  const finalUser = await db.query.authUsersTable.findFirst({
    where: eq(authUsersTable.id, userId),
  });
  const finalProfile = await db.query.profilesTable.findFirst({
    where: eq(profilesTable.userId, userId),
  });

  if (!finalUser || !finalProfile) {
    console.error(
      `Failed to find user or profile for ID ${userId} after OAuth flow.`,
    );
    throw new Error('User data retrieval failed');
  }

  // Define expiry for refresh token (7 days)
  const refreshTokenExpiresMs = 7 * 24 * 60 * 60 * 1000;
  const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenExpiresMs);

  // Generate both access and refresh tokens
  const { accessToken, refreshToken } = await generateTokens(userId);

  // Update user table with the new refresh token and expiry
  await db
    .update(authUsersTable)
    .set({
      refreshToken,
      refreshTokenExpiresAt,
    })
    .where(eq(authUsersTable.id, userId));

  // Update profile activity
  await db
    .update(profilesTable)
    .set({
      lastSuccessfulLogin: new Date(),
      loginCount: userJustCreated ? 1 : (finalProfile.loginCount ?? 0) + 1,
      lastActivityAt: new Date(),
    })
    .where(eq(profilesTable.userId, userId));

  // Set cookies
  const accessTokenCookieName = env.NODE_ENV === 'production'
    ? ACCESS_TOKEN_COOKIE_NAME_PROD
    : ACCESS_TOKEN_COOKIE_NAME_DEV;
  const refreshTokenCookieName = env.NODE_ENV === 'production'
    ? REFRESH_TOKEN_COOKIE_NAME_PROD
    : REFRESH_TOKEN_COOKIE_NAME_DEV;

  const cookieOptions = {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: env.NODE_ENV === 'production', // Only send the cookie over HTTPS in production
    sameSite: env.NODE_ENV === 'production' ? 'None' as const : 'Lax' as const,
    path: '/', // The path on the server in which the cookie will be sent to
  };

  // Set access token cookie
  setCookie(c, accessTokenCookieName, accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60, // 15 minutes in seconds
  });

  // Set refresh token cookie
  setCookie(c, refreshTokenCookieName, refreshToken, {
    ...cookieOptions,
    maxAge: refreshTokenExpiresMs / 1000, // maxAge is in seconds
  });

  // Create success redirect URL
  const successUrl = new URL(`${env.FRONTEND_URL}/account/profile`);
  return successUrl.toString();
}

/**
 * Handle OAuth callback error with appropriate redirect
 *
 * @param err - The error that occurred
 * @returns The error URL to redirect to
 */
export function handleOAuthCallbackError(err: unknown) {
  console.error('Error handling OAuth callback:', err);

  const errorUrl = new URL(env.FRONTEND_URL);
  let errorCode = 'oauth_callback_failed';

  if (err instanceof Error) {
    if (err.message.includes('Invalid state'))
      errorCode = 'oauth_invalid_state';
    else if (err.message.includes('Invalid or expired authorization code'))
      errorCode = 'oauth_invalid_code';
    else if (err.message.includes('Email not provided'))
      errorCode = 'oauth_email_missing';
  }

  errorUrl.searchParams.set('error', errorCode);
  return errorUrl.toString();
}
