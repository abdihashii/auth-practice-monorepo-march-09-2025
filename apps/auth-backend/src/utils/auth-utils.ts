// Third-party imports
import argon2 from "argon2";
import { sign } from "hono/jwt";

/**
 * Hash a password using Argon2id (recommended by OWASP)
 * Using recommended settings from: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 *
 * @param password - The password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3, // Number of iterations
    parallelism: 4,
  });
}

/**
 * Generate JWT tokens for authentication
 * @param userId - The user ID (uuid) to generate tokens for
 * @returns An object containing the access token and refresh token
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
