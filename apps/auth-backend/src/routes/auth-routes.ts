// Third-party imports
import { Hono } from "hono";

// Local imports
import type { CustomEnv } from "@/types";
import { generateTokens, hashPassword } from "@/utils";
import { usersTable } from "@/db/schema";

export const authRoutes = new Hono<CustomEnv>();

/**
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
    const body = await c.req.json();
    const { email, password } = body;

    // Hash user password
    const hashedPassword = await hashPassword(password);

    // Get JWT secret
    const { accessToken, refreshToken } = await generateTokens(email);

    const newUser = {
      email,
      hashedPassword,
      accessToken,
      refreshToken,
    };

    // Add user to users table
    await db.insert(usersTable).values(newUser);

    return c.json(
      {
        email,
        message: `Successfully added ${email} to db!`,
        accessToken,
        refreshToken,
      },
      200
    );
  } catch (err) {}
});
