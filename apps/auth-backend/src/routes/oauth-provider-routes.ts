import { ApiErrorCode } from '@roll-your-own-auth/shared/types';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

import type { IOAuthProvider } from '@/lib/providers/oauth-provider';
import type { CustomEnv } from '@/lib/types';

import { authUserConnections, authUsersTable, profilesTable } from '@/db/schema';
import env from '@/env';
import { ACCESS_TOKEN_COOKIE_NAME_DEV, ACCESS_TOKEN_COOKIE_NAME_PROD, OAUTH_STATE_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME_DEV, REFRESH_TOKEN_COOKIE_NAME_PROD } from '@/lib/constants';
import { GoogleOAuthAdapter } from '@/lib/providers/google-oauth-adapter';
import { createApiResponse, generateTokens } from '@/lib/utils';
import { authRateLimiter, publicRouteRlsMiddleware } from '@/middlewares';

// Instantiate the Google OAuth adapter
const googleOAuthAdapter = new GoogleOAuthAdapter();

export const oauthProviderRoutes = new Hono<CustomEnv>();

/**
 * Initiate Google OAuth flow
 * GET /api/v1/auth/google
 */
oauthProviderRoutes.get('/google', authRateLimiter, async (c) => {
  try {
    // 1. Generate state
    const state = crypto.randomUUID();

    // 2. Store state in HttpOnly cookie for CSRF protection
    setCookie(c, OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      secure: env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS
      sameSite: env.NODE_ENV === 'production' ? 'None' : 'Lax', // Prevents the cookie from being sent along with requests to other sites
      path: '/', // The cookie is only sent to requests to the root domain
      maxAge: 60 * 10, // 10 minutes in seconds
    });

    // 3. Get authorization URL from adapter
    const authorizationUrl = googleOAuthAdapter.getAuthorizationUrl(state);

    // 4. Redirect user to Google
    return c.redirect(authorizationUrl);
  } catch (err) {
    console.error('Error initiating Google OAuth:', err);
    // Redirect to frontend error page or return JSON
    // For now, redirecting to frontend base URL with an error query param
    const errorUrl = new URL(env.FRONTEND_URL);
    errorUrl.searchParams.set('error', 'oauth_init_failed');
    return c.redirect(errorUrl.toString(), 302);
  }
});

/**
 * Handle Google OAuth callback
 * GET /api/v1/auth/google/callback
 */
oauthProviderRoutes.get(
  '/google/callback',
  authRateLimiter,
  publicRouteRlsMiddleware,
  async (c) => {
    const db = c.get('db');
    const stateFromCookieValue = getCookie(c, OAUTH_STATE_COOKIE_NAME);
    const code = c.req.query('code');
    const stateFromQuery = c.req.query('state');

    // Clear the state cookie immediately after reading it
    deleteCookie(c, OAUTH_STATE_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'None' : 'Lax',
    });

    const errorUrl = new URL(env.FRONTEND_URL);

    try {
    // Validate presence of parameters. This check ensures stateFromCookieValue is truthy (a non-empty string).
      if (!code || !stateFromQuery || !stateFromCookieValue) {
        console.warn('Missing code, state from query, or state from cookie in Google callback.');
        throw new Error('Invalid callback request (missing parameters)');
      }

      // stateFromCookieValue is now guaranteed to be a string due to the check above.
      // Explicitly cast to string to satisfy the linter.
      const googleUserProfile = await googleOAuthAdapter.handleCallback(
        code,
        stateFromQuery,
        stateFromCookieValue as string,
      );

      if (!googleUserProfile.email) {
        console.error('Google profile is missing email.');
        throw new Error('Email not provided by Google');
      }

      // --- Find or Create User Logic --- //
      let userId: string;
      let userJustCreated = false;

      // Check if a connection already exists for this Google user
      const connection = await db.query.authUserConnections.findFirst({
        where: and(
          eq(authUserConnections.provider, googleUserProfile.provider as IOAuthProvider['providerName']),
          eq(authUserConnections.providerUserId, googleUserProfile.providerId),
        ),
      });

      if (connection) {
      // Connection exists, use the associated userId
        userId = connection.userId;
      } else {
        // No existing connection in auth.user_connections table, check if user
        //  exists by email
        const existingUserByEmail = await db.query.authUsersTable.findFirst({
          where: eq(authUsersTable.email, googleUserProfile.email),
          with: { connections: true }, // Include connections to check if Google is already linked
        });

        if (existingUserByEmail) {
        // User exists with this email, link the Google account
          userId = existingUserByEmail.id;

          // Double-check if Google connection was somehow missed (should be rare)
          const googleConnectionExists = existingUserByEmail
            .connections
            .some((conn) => conn.provider === 'google');
          if (!googleConnectionExists) {
            await db.insert(authUserConnections).values({
              userId,
              provider: googleUserProfile.provider as IOAuthProvider['providerName'],
              providerUserId: googleUserProfile.providerId,
            });
          } else {
            console.warn(
              `User ${userId} already had a Google connection, but it wasn't found initially.`,
            );
          }
        } else {
          // No user found by connection or email, create a new user and profile
          userJustCreated = true;
          const newUserResult = await db.transaction(async (tx) => {
            const [newUser] = await tx.insert(authUsersTable).values({
              email: googleUserProfile.email!,
              emailVerified: true, // Email is verified by Google
            // hashedPassword remains null
            }).returning();

            if (!newUser) throw new Error('Failed to create user in transaction');

            await tx.insert(authUserConnections).values({
              userId: newUser.id,
              provider: googleUserProfile.provider as IOAuthProvider['providerName'],
              providerUserId: googleUserProfile.providerId,
            });

            // Create profile with Google data if available
            await tx.insert(profilesTable).values({
              userId: newUser.id,
              email: newUser.email,
              name: googleUserProfile.name, // Use Google name directly here
              profilePicture: googleUserProfile.picture, // Use Google picture directly here
            // Add other defaults if needed
            });

            return newUser;
          });
          userId = newUserResult.id;
        }
      }
      // --- END FIND OR CREATE USER LOGIC --- //

      // --- ADD PROFILE UPDATE LOGIC HERE (Runs every time) --- //
      // Fetch the user's profile regardless of how they were identified
      const userProfileForUpdate = await db.query.profilesTable.findFirst({
        where: eq(profilesTable.userId, userId),
      });

      if (userProfileForUpdate) {
        const profileUpdateData: Partial<{ name: string | null; profilePicture: string | null }> = {};

        // Update name only if Google provides one AND the current one is empty/null
        if (googleUserProfile.name && !userProfileForUpdate.name) {
          profileUpdateData.name = googleUserProfile.name;
        }

        // Update picture only if Google provides one AND the current one is empty/null
        if (googleUserProfile.picture && !userProfileForUpdate.profilePicture) {
          profileUpdateData.profilePicture = googleUserProfile.picture;
        }

        // If there are updates to apply, update the profile
        if (Object.keys(profileUpdateData).length > 0) {
          await db
            .update(profilesTable)
            .set(profileUpdateData)
            .where(eq(profilesTable.userId, userId));
        }
      } else {
      // This case should ideally not happen if user creation/linking worked
        console.error(`Profile not found for user ${userId} before token generation.`);
      }
      // --- END PROFILE UPDATE LOGIC --- //

      // --- User Found/Created/Linked - Proceed with Login --- //
      // Fetch the final user and profile data (needed for cookie setting and response)
      // Could optimize this slightly if userJustCreated is true, but safer to refetch
      const finalUser = await db.query.authUsersTable.findFirst({
        where: eq(authUsersTable.id, userId),
      });
      const finalProfile = await db.query.profilesTable.findFirst({
        where: eq(profilesTable.userId, userId),
      });

      if (!finalUser || !finalProfile) {
        console.error(`Failed to find user or profile for ID ${userId} after OAuth flow.`);
        throw new Error('User data retrieval failed');
      }

      // Define expiry for refresh token (e.g., 7 days)
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
        // Consider updating lastTokenInvalidation here if needed by your logic
        })
        .where(eq(authUsersTable.id, userId));

      // Update profile activity (login count only if newly created)
      await db
        .update(profilesTable)
        .set({
          lastSuccessfulLogin: new Date(),
          loginCount: userJustCreated ? 1 : (finalProfile.loginCount ?? 0) + 1,
          lastActivityAt: new Date(),
        })
        .where(eq(profilesTable.userId, userId));

      // Set access token cookie
      const accessTokenCookieName = env.NODE_ENV === 'production' ? ACCESS_TOKEN_COOKIE_NAME_PROD : ACCESS_TOKEN_COOKIE_NAME_DEV;
      const refreshTokenCookieName = env.NODE_ENV === 'production' ? REFRESH_TOKEN_COOKIE_NAME_PROD : REFRESH_TOKEN_COOKIE_NAME_DEV;
      const cookieOptions = {
        httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
        secure: env.NODE_ENV === 'production', // Only send the cookie over HTTPS in production
        sameSite: env.NODE_ENV === 'production' ? 'None' as const : 'Lax' as const, // Strict same-site policy in production
        path: '/', // The cookie is available on all paths
      };

      setCookie(c, accessTokenCookieName, accessToken, {
        ...cookieOptions, // Use a shared cookie options object
        maxAge: 15 * 60, // 15 minutes in seconds
      });

      // Set refresh token cookie
      setCookie(c, refreshTokenCookieName, refreshToken, {
        ...cookieOptions, // Use a shared cookie options object
        maxAge: refreshTokenExpiresMs / 1000, // maxAge is in seconds
      });

      // Redirect user to frontend (e.g., account page)
      const successUrl = new URL(`${env.FRONTEND_URL}/account`);
      // Optionally add query params like ?login=success or ?welcome=true
      // successUrl.searchParams.set('login_method', 'google');
      return c.redirect(successUrl.toString(), 302);
    } catch (err) {
      console.error('Error handling Google OAuth callback:', err);
      // Handle specific errors from adapter or DB
      let errorCode = 'oauth_callback_failed';
      if (err instanceof Error) {
        if (err.message.includes('Invalid state')) errorCode = 'oauth_invalid_state';
        else if (err.message.includes('Invalid or expired authorization code')) errorCode = 'oauth_invalid_code';
        else if (err.message.includes('Email not provided')) errorCode = 'oauth_email_missing';
      }
      errorUrl.searchParams.set('error', errorCode);
      return c.redirect(errorUrl.toString(), 302);
    }
  },
);

/**
 * Handle GitHub OAuth flow
 * GET /api/v1/auth/github
 */
oauthProviderRoutes.get('/github', authRateLimiter, async (c) => {
  try {
    const githubAuthUrl = 'https://github.com/login/oauth/authorize';

    return c
      .redirect(
        `${githubAuthUrl}?client_id=${env.GITHUB_CLIENT_ID}&scope=read:user&redirect_uri=${env.GITHUB_REDIRECT_URI}`,
      );
  } catch (err) {
    console.error('Error initiating GitHub OAuth:', err);
    // Redirect to frontend error page or return JSON
    // For now, redirecting to frontend base URL with an error query param
    const errorUrl = new URL(env.FRONTEND_URL);
    errorUrl.searchParams.set('error', 'oauth_init_failed');
    return c.redirect(errorUrl.toString(), 302);
  }
});

oauthProviderRoutes.get(
  '/github/callback',
  authRateLimiter,
  publicRouteRlsMiddleware,
  async (c) => {
    const db = c.get('db');
    const errorUrl = new URL(env.FRONTEND_URL);

    const code = c.req.query('code');
    if (!code) {
      console.warn('Missing code in GitHub callback.');
      return c.redirect(
        `${errorUrl}/error?error=missing_code`,
        302,
      );
    }

    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      if (!tokenResponse.ok) {
        console.error('GitHub token response not ok:', tokenResponse.status);
        const errorText = await tokenResponse.text();
        return c.json(createApiResponse({
          error: {
            code: ApiErrorCode.INTERNAL_SERVER_ERROR,
            message: `GitHub token response not ok: ${errorText}`,
          },
        }), 500);
      }

      const data = await tokenResponse.json();
      const githubAccessToken = data.access_token;

      // Get user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${githubAccessToken}`,
        },
      });

      const githubUserData = await userResponse.json();

      // --- Find or Create User Logic --- //
      let userId: string;
      let userJustCreated = false;

      // Check if a connection already exists for this GitHub user
      const connection = await db.query.authUserConnections.findFirst({
        where: and(
          eq(authUserConnections.provider, 'github'),
          eq(authUserConnections.providerUserId, githubUserData.id),
        ),
      });

      if (connection) {
        // Connection exists, use the associated userId
        userId = connection.userId;
      } else {
        // First check if the user made their email public. A user can set this
        // in their GitHub profile settings. If null, we can't link the account
        // and we should continue to the next step, i.e. create a new user.
        if (!githubUserData.email) {
          console.error('GitHub user has no email address.');
        }

        // No existing connection in auth.user_connections table, check if user
        //  exists by email
        const existingUserByEmail = await db.query.authUsersTable.findFirst({
          where: eq(authUsersTable.email, githubUserData.email),
          with: { connections: true }, // Include connections to check if GitHub is already linked
        });

        if (existingUserByEmail) {
          // User exists with this email, link the GitHub account
          userId = existingUserByEmail.id;

          // Double-check if GitHub connection was somehow missed (should be rare)
          const githubConnectionExists = existingUserByEmail
            .connections
            .some((conn) => conn.provider === 'github');
          if (!githubConnectionExists) {
            await db.insert(authUserConnections).values({
              userId,
              provider: 'github',
              providerUserId: githubUserData.id,
            });
          } else {
            console.warn(
              `User ${userId} already had a GitHub connection, but it wasn't
              found initially.`,
            );
          }
        } else {
          // No user found by connection or email, create a new user and profile
          userJustCreated = true;
          const newUserResult = await db.transaction(async (tx) => {
            const [newUser] = await tx.insert(authUsersTable).values({
              email: githubUserData.email!,
              emailVerified: true, // Email is verified by Google
            // hashedPassword remains null
            }).returning();

            if (!newUser) throw new Error('Failed to create user in transaction');

            await tx.insert(authUserConnections).values({
              userId: newUser.id,
              provider: 'github',
              providerUserId: githubUserData.id,
            });

            // Create profile with Google data if available
            await tx.insert(profilesTable).values({
              userId: newUser.id,
              email: newUser.email,
              name: githubUserData.name, // Use GitHub name directly here
              profilePicture: githubUserData.avatar_url, // Use GitHub avatar directly here
              // Add other defaults if needed
            });

            return newUser;
          });
          userId = newUserResult.id;
        }
      }
      // --- END FIND OR CREATE USER LOGIC --- //

      // --- ADD PROFILE UPDATE LOGIC HERE (Runs every time) --- //
      // Fetch the user's profile regardless of how they were identified
      const userProfileForUpdate = await db.query.profilesTable.findFirst({
        where: eq(profilesTable.userId, userId),
      });

      if (userProfileForUpdate) {
        const profileUpdateData: Partial<
          { name: string | null; profilePicture: string | null }
        > = {};

        // Update name only if GitHub provides one AND the current one is empty/null
        if (githubUserData.name && !userProfileForUpdate.name) {
          profileUpdateData.name = githubUserData.name;
        }

        // Update picture only if GitHub provides one AND the current one is empty/null
        if (
          githubUserData.avatar_url && !userProfileForUpdate.profilePicture
        ) {
          profileUpdateData.profilePicture = githubUserData.avatar_url;
        }

        // If there are updates to apply, update the profile
        if (Object.keys(profileUpdateData).length > 0) {
          await db
            .update(profilesTable)
            .set(profileUpdateData)
            .where(eq(profilesTable.userId, userId));
        }
      } else {
      // This case should ideally not happen if user creation/linking worked
        console.error(
          `Profile not found for user ${userId} before token generation.`,
        );
      }
      // --- END PROFILE UPDATE LOGIC --- //

      // --- User Found/Created/Linked - Proceed with Login --- //
      // Fetch the final user and profile data (needed for cookie setting and response)
      // Could optimize this slightly if userJustCreated is true, but safer to refetch
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

      // Define expiry for refresh token (e.g., 7 days)
      const refreshTokenExpiresMs = 7 * 24 * 60 * 60 * 1000;
      const refreshTokenExpiresAt = new Date(
        Date.now() + refreshTokenExpiresMs,
      );

      // Generate both access and refresh tokens
      const { accessToken, refreshToken } = await generateTokens(userId);

      // Update user table with the new refresh token and expiry
      await db
        .update(authUsersTable)
        .set({
          refreshToken,
          refreshTokenExpiresAt,
        // Consider updating lastTokenInvalidation here if needed by your logic
        })
        .where(eq(authUsersTable.id, userId));

      // Update profile activity (login count only if newly created)
      await db
        .update(profilesTable)
        .set({
          lastSuccessfulLogin: new Date(),
          loginCount: userJustCreated ? 1 : (finalProfile.loginCount ?? 0) + 1,
          lastActivityAt: new Date(),
        })
        .where(eq(profilesTable.userId, userId));

      // Set access token cookie
      const accessTokenCookieName = env.NODE_ENV === 'production'
        ? ACCESS_TOKEN_COOKIE_NAME_PROD
        : ACCESS_TOKEN_COOKIE_NAME_DEV;
      const refreshTokenCookieName = env.NODE_ENV === 'production'
        ? REFRESH_TOKEN_COOKIE_NAME_PROD
        : REFRESH_TOKEN_COOKIE_NAME_DEV;
      const cookieOptions = {
        httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
        secure: env.NODE_ENV === 'production', // Only send the cookie over HTTPS in production
        sameSite: env.NODE_ENV === 'production' ? 'None' as const : 'Lax' as const, // Strict same-site policy in production
        path: '/', // The cookie is available on all paths
      };

      setCookie(c, accessTokenCookieName, accessToken, {
        ...cookieOptions, // Use a shared cookie options object
        maxAge: 15 * 60, // 15 minutes in seconds
      });

      // Set refresh token cookie
      setCookie(c, refreshTokenCookieName, refreshToken, {
        ...cookieOptions, // Use a shared cookie options object
        maxAge: refreshTokenExpiresMs / 1000, // maxAge is in seconds
      });

      // Redirect user to frontend (e.g., account page)
      const successUrl = new URL(`${env.FRONTEND_URL}/account`);
      // Optionally add query params like ?login=success or ?welcome=true
      // successUrl.searchParams.set('login_method', 'google');
      return c.redirect(successUrl.toString(), 302);
    } catch (err) {
      console.error('Error handling GitHub OAuth callback:', err);
      return c.json(createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: 'GitHub OAuth callback failed',
        },
      }), 500);
    }
  },
);
