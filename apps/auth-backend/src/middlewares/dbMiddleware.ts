// Third-party imports
import type { MiddlewareHandler } from "hono";

// Local imports
import { dbConnect } from "@/db";
import type { CustomEnv } from "@/types";

// Create the middleware handler with proper typing
export const dbMiddleware: MiddlewareHandler<CustomEnv> = async (c, next) => {
  try {
    // Connect to the database
    const db = await dbConnect();

    // Set the database connection in the context
    c.set("db", db);

    // Call the next middleware
    await next();
  } catch (error) {
    return c.json({ error: "Failed to connect to database" }, 500);
  }
};
