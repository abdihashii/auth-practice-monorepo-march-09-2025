// Third-party imports
import { sign } from "hono/jwt";

/**
 * Hash a password using Bun's built-in Argon2id implementation
 * Using recommended settings from: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 *
 * @param {string} password - The password to hash
 * @returns {Promise<string>} The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "argon2id",
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
  hash: string
): Promise<boolean> {
  try {
    return await Bun.password.verify(password, hash);
  } catch (error) {
    console.error("Password verification error:", error);
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
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const accessToken = await sign(
    { userId, exp: Math.floor(Date.now() / 1000) + 15 * 60 },
    secret
  );
  const refreshToken = await sign(
    {
      userId,
      type: "refresh",
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    secret
  );

  return { accessToken, refreshToken };
}
