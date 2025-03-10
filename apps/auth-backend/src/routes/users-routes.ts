// Third-party imports
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

// Local imports
import {
  DEFAULT_USER_DETAIL_COLUMNS,
  DEFAULT_USER_LIST_COLUMNS,
} from "@/constants";
import { usersTable } from "@/db/schema";
import type { CustomEnv, UserDetail, UserListItem } from "@/types";
import { createApiErrorResponse, createSelectObject } from "@/utils";
import { idParamSchema } from "@/validation";

export const usersRoutes = new Hono<CustomEnv>();

// Get all users
usersRoutes.get("/", async (c) => {
  try {
    const db = c.get("db");

    // Create select object using the helper function
    const selectObj = createSelectObject(usersTable, DEFAULT_USER_LIST_COLUMNS);

    // Only select the necessary columns based on default list columns
    const users = await db.select(selectObj).from(usersTable);

    return c.json({
      users: users as UserListItem[],
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    const errorResponse = createApiErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "Failed to retrieve users"
    );
    return c.json(errorResponse, 500);
  }
});

// Get a user by id
usersRoutes.get("/:id", zValidator("param", idParamSchema), async (c) => {
  try {
    const db = c.get("db");
    const { id } = c.req.param();

    // Create select object using the helper function
    const selectObj = createSelectObject(
      usersTable,
      DEFAULT_USER_DETAIL_COLUMNS
    );

    // Only select the necessary columns based on default detail columns
    const results = await db
      .select(selectObj)
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (results.length === 0) {
      const errorResponse = createApiErrorResponse(
        "NOT_FOUND",
        "User not found"
      );
      return c.json(errorResponse, 404);
    }

    return c.json(results[0] as UserDetail);
  } catch (error) {
    console.error("Error fetching user:", error);
    const errorResponse = createApiErrorResponse(
      "INTERNAL_SERVER_ERROR",
      "Failed to retrieve user"
    );
    return c.json(errorResponse, 500);
  }
});
