import { ApiErrorCode } from '@roll-your-own-auth/shared/types';
import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';

import type { CustomEnv } from '@/lib/types';

import env from '@/env';
import { OAUTH_STATE_COOKIE_NAME } from '@/lib/constants';
import { GoogleOAuthAdapter } from '@/lib/providers/google-oauth-adapter';
import {
  createApiResponse,
  findOrCreateOAuthUser,
  handleOAuthCallbackError,
  setAuthTokensAndCookies,
  updateUserProfileFromOAuth,
} from '@/lib/utils';
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

    try {
    // Validate presence of parameters. This check ensures stateFromCookieValue
    //  is truthy (a non-empty string).
      if (!code || !stateFromQuery || !stateFromCookieValue) {
        console.warn(
          'Missing code, state from query, or state from cookie in Google '
          + 'callback.',
        );
        throw new Error('Invalid callback request (missing parameters)');
      }

      // Get user profile from Google
      const googleUserProfile = await googleOAuthAdapter.handleCallback(
        code,
        stateFromQuery,
        stateFromCookieValue as string,
      );

      if (!googleUserProfile.email) {
        console.error('Google profile is missing email.');
        throw new Error('Email not provided by Google');
      }

      // Find or create user
      const { userId, userJustCreated } = await findOrCreateOAuthUser(
        db,
        googleUserProfile,
      );

      // Update profile with Google data if needed
      await updateUserProfileFromOAuth(db, userId, googleUserProfile);

      // Set auth tokens and cookies
      const redirectUrl = await setAuthTokensAndCookies(
        c,
        db,
        userId,
        userJustCreated,
      );

      // Redirect to frontend
      return c.redirect(redirectUrl, 302);
    } catch (err) {
      const errorUrl = handleOAuthCallbackError(err);
      return c.redirect(errorUrl, 302);
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

/**
 * Handle GitHub OAuth callback
 * GET /api/v1/auth/github/callback
 */
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
      const tokenResponse = await fetch(
        'https://github.com/login/oauth/access_token',
        {
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
        },
      );

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

      // Create a standardized user profile from GitHub data
      const githubUserProfile = {
        provider: 'github' as const,
        providerId: githubUserData.id.toString(),
        email: githubUserData.email,
        name: githubUserData.name,
        picture: githubUserData.avatar_url,
      };

      // Find or create user
      const { userId, userJustCreated } = await findOrCreateOAuthUser(
        db,
        githubUserProfile,
      );

      // Update profile with GitHub data if needed
      await updateUserProfileFromOAuth(db, userId, githubUserProfile);

      // Set auth tokens and cookies
      const redirectUrl = await setAuthTokensAndCookies(
        c,
        db,
        userId,
        userJustCreated,
      );

      // Redirect to frontend
      return c.redirect(redirectUrl, 302);
    } catch (err) {
      const errorUrl = handleOAuthCallbackError(err);
      return c.redirect(errorUrl, 302);
    }
  },
);
