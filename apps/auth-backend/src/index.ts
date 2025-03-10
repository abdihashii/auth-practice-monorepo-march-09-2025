// Third party imports
import { Hono } from "hono";

// Local imports
import { corsMiddleware } from "@/middlewares";

const app = new Hono();

// Use the cors middleware
app.use("*", corsMiddleware);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
  });
});

export default {
  port: 8000,
  fetch: app.fetch,
};
