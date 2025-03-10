// Third-party imports
import { Hono } from "hono";

// Local imports
import { usersTable } from "@/db/schema";
import type { CustomEnv } from "@/types";

export const usersRoutes = new Hono<CustomEnv>();

// Get all users
usersRoutes.get("/", async (c) => {
  const db = c.get("db");
  const users = await db.select().from(usersTable);
  return c.json(users);
});
