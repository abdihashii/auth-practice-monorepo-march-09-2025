import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello, from auth-backend 🚀");
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
  });
});

export default {
  port: 1234,
  fetch: app.fetch,
};
