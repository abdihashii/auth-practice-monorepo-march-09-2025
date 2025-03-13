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
import {
  ApiErrorCode,
  type CustomEnv,
  type UserDetail,
  type UserListItem,
} from "@/types";
import { createApiResponse, createSelectObject } from "@/utils";
import { idParamSchema } from "@/validation";

export const userRoutes = new Hono<CustomEnv>();

// Get all users
userRoutes.get("/", async (c) => {
  try {
    const db = c.get("db");

    // Create select object using the helper function
    const selectObj = createSelectObject(usersTable, DEFAULT_USER_LIST_COLUMNS);

    // Only select the necessary columns based on default list columns
    const users = await db.select(selectObj).from(usersTable);

    // Return standardized response using the unified utility
    return c.json(
      createApiResponse({
        data: users as UserListItem[],
      }),
      200
    );
  } catch (error) {
    console.error("Error fetching users:", error);

    // Return error response using the unified utility
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: "Failed to retrieve users",
        },
      }),
      500
    );
  }
});

// Get a user by id
userRoutes.get("/:id", zValidator("param", idParamSchema), async (c) => {
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
      // Return not found error using the unified utility
      return c.json(
        createApiResponse({
          error: {
            code: ApiErrorCode.NOT_FOUND,
            message: "User not found",
          },
        }),
        404
      );
    }

    // Return standardized success response using the unified utility
    return c.json(
      createApiResponse({
        data: results[0] as UserDetail,
      }),
      200
    );
  } catch (error) {
    console.error("Error fetching user:", error);

    // Return error response using the unified utility
    return c.json(
      createApiResponse({
        error: {
          code: ApiErrorCode.INTERNAL_SERVER_ERROR,
          message: "Failed to retrieve user",
        },
      }),
      500
    );
  }
});
