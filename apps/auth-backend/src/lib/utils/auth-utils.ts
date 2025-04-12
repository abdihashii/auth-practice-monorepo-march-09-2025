import { sign, verify } from 'hono/jwt';

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
 * Compare a plain text password against a hashed password
 *
 * @param {string} passwordOne - The plain text password from user input
 * @param {string} passwordTwo - The hashed password from the database
 * @returns {Promise<boolean>} True if the password is valid, false otherwise
 */
export async function comparePasswords(passwordOne: string, passwordTwo: string): Promise<boolean> {
  return await verifyPassword(passwordOne, passwordTwo);
}

/**
 * Generate an access token for a user with a 15 minute expiration.
 *
 * @param {string} userId - The user ID (uuid) to generate tokens for
 * @param {string} secret - The secret key to use for generating the token
 * @returns {Promise<string>} The access token
 * @throws {Error} If token generation fails
 */
export async function generateAccessToken(userId: string, secret: string) {
  try {
    return await sign(
      { userId, exp: Math.floor(Date.now() / 1000) + 15 * 60 },
      secret,
    );
  } catch (error) {
    throw new Error(`Failed to generate access token: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Generate a refresh token for a user with a 7 day expiration.
 *
 * @param {string} userId - The user ID (uuid) to generate tokens for
 * @param {string} secret - The secret key to use for generating the token
 * @returns {Promise<string>} The refresh token
 * @throws {Error} If token generation fails
 */
export async function generateRefreshToken(userId: string, secret: string) {
  try {
    return await sign(
      {
        userId,
        type: 'refresh',
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      },
      secret,
    );
  } catch (error) {
    throw new Error(`Failed to generate refresh token: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}

/**
 * Generate JWT tokens for authentication
 *
 * @param {string} userId - The user ID (uuid) to generate tokens for
 * @returns {Promise<{ accessToken: string; refreshToken: string }>} An object containing the access token and refresh token
 * @throws {Error} With specific error messages that can be mapped to ApiErrorCode
 */
export async function generateTokens(userId: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  const accessToken = await generateAccessToken(userId, secret);
  const refreshToken = await generateRefreshToken(userId, secret);

  return { accessToken, refreshToken };
}

/**
 * Generates a random UUID verification token with a 24 hour expiration
 * time
 *
 * @returns {Promise<{ verificationToken: string; verificationTokenExpiry: Date }>} The verification token and expiration date
 */
export async function generateVerificationToken() {
  const verificationToken = crypto.randomUUID();
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { verificationToken, verificationTokenExpiry };
}

/**
 * Refresh the access token using the refresh token and the JWT_SECRET
 * environment variable to verify the refresh token then generate a new access
 * token.
 *
 * @param {string} refreshToken - The refresh token to use for refreshing the access token
 * @returns {Promise<string>} The new access token
 * @throws {Error} If JWT_SECRET is missing, refresh token is invalid or expired
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    // Verify the refresh token
    const decoded = await verify(refreshToken, secret) as {
      userId: string;
      type: string;
      exp: number;
    };

    if (!decoded || !decoded.userId || decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    // Check if refresh token is expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Refresh token expired');
    }

    // Generate a new access token
    const accessToken = await generateAccessToken(decoded.userId, secret);

    return accessToken;
  } catch (error) {
    // Propagate the error with a clear message
    throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
