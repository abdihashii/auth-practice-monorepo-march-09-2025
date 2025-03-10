// Third party imports
import { Hono } from "hono";

// Local imports
import { dbConnect } from "@/db";
import { usersTable } from "@/db/schema";
import { corsMiddleware } from "@/middlewares";
import { dbMiddleware } from "@/middlewares/dbMiddleware";
import type { CustomEnv } from "@/types";
import { getEnv, validateEnv } from "@/utils/env";

const app = new Hono<CustomEnv>();

// Use the cors middleware
app.use("*", corsMiddleware);

// Add request logging
app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  try {
    await next();
  } catch (err) {
    throw err; // Let error handler middleware handle it
  }
});

// Basic health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Database health check
app.get("/health/db", async (c) => {
  try {
    const env = getEnv();
    validateEnv();

    const db = await dbConnect();

    // Try to execute a simple query
    const result = await db.select().from(usersTable).limit(1);

    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        message: "Database connection successful",
      },
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          message: "Database connection failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      503
    );
  }
});

// Initialize API router with versioning
const api = new Hono<CustomEnv>();

// Apply database middleware to all API routes
api.use("*", dbMiddleware);

// Add API routes
api.get("/", (c) => {
  return c.json({ message: "Hello, from the API!" });
});

export default {
  port: 8000,
  fetch: app.fetch,
};
