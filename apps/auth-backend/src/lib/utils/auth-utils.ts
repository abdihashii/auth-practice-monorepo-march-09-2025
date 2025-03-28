import { sign } from 'hono/jwt';

import env from '@/env';

/**
 * Hash a password using Bun's built-in Argon2id implementation
 * Using recommended settings from: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 *
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: 'argon2id',
    memoryCost: 65536, // 64MB
    timeCost: 3, // Number of iterations
  });
}

/**
 * Verify a password against a hash using Bun's built-in verify function
 *
 * @param {string} password - The password to verify
 * @param {string} hash - The hashed password to verify against
 * @returns {Promise<boolean>} True if the password is valid, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await Bun.password.verify(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate JWT tokens for authentication
 *
 * @param {string} userId - The user ID (uuid) to generate tokens for
 * @returns {Promise<{ accessToken: string; refreshToken: string }>} An object containing the access token and refresh token
 */
export async function generateTokens(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const accessToken = await sign(
    { userId, exp: Math.floor(Date.now() / 1000) + 15 * 60 },
    secret,
  );
  const refreshToken = await sign(
    {
      userId,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    secret,
  );

  return { accessToken, refreshToken };
}

/**
 * Verify a Google ID token and extract user information
 *
 * @param {string} token - The Google ID token to verify
 * @param {string} clientId - The Google client ID to verify the token against
 * @returns {Promise<{
 *   email: string;
 *   name: string | null;
 *   picture: string | null;
 * }>} The user information from the verified token
 * @throws {Error} If the token is invalid or verification fails
 */
export async function verifyGoogleIdToken(token: string, clientId: string): Promise<{
  email: string;
  name: string | null;
  picture: string | null;
}> {
  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(clientId);

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid token payload');
    }

    return {
      email: payload.email,
      name: payload.name || null,
      picture: payload.picture || null,
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Failed to verify Google token');
  }
}
