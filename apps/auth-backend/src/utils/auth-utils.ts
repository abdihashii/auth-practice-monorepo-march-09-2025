// Third-party imports
import argon2 from "argon2";

/**
 * Hash a password using Argon2id (recommended by OWASP)
 * Using recommended settings from: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64MB
    timeCost: 3, // Number of iterations
    parallelism: 4,
  });
}
