// Third party imports
import { Hono } from "hono";

// Local imports
import { corsMiddleware } from "@/middlewares";

const app = new Hono();

// Use the cors middleware
app.use("*", corsMiddleware);

// Basic health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default {
  port: 8000,
  fetch: app.fetch,
};
