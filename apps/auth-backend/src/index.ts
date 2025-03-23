import * as Sentry from "@sentry/bun";
import { Hono } from "hono";

import type { CustomEnv } from "@/lib/types";

import { dbConnect } from "@/db";
import { usersTable } from "@/db/schema";
import { corsMiddleware } from "@/middlewares";
import { dbMiddleware } from "@/middlewares/dbMiddleware";
import { securityMiddlewares } from "@/middlewares/securityMiddlewares";
import { authRoutes } from "@/routes/auth-routes";
import { userRoutes } from "@/routes/user-routes";

Sentry.init({
  dsn: "https://c3ff452ee3118ace1c8ab114cce5f2f3@o4508969051553792.ingest.us.sentry.io/4508969051815936",

  // Add Performance Monitoring by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const app = new Hono<CustomEnv>();

// Use the cors middleware
app.use("*", corsMiddleware);

// Apply all security middlewares
app.use("*", ...securityMiddlewares);

// Add request logging
app.use("*", async (c, next) => {
  /* eslint-disable-next-line no-console */
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
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
    const db = await dbConnect();

    // Try to execute a simple query
    await db.select().from(usersTable).limit(1);

    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        message: "Database connection successful",
      },
    });
  }
  catch (error) {
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
      503,
    );
  }
});

// Initialize API router with versioning
const api = new Hono<CustomEnv>();

// Apply database middleware to all API routes
api.use("*", dbMiddleware);

// Mount all routes to the API router
api.route("/users", userRoutes);
api.route("/auth", authRoutes);

// Mount the API router to the main app
app.route("/api/v1", api);

export default {
  port: 8000,
  fetch: app.fetch,
};
