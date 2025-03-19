// Local imports
import app from "@/app";
import { validateEnv } from "@/lib/utils";
import * as Sentry from "@sentry/bun";

Sentry.init({
  dsn: "https://c3ff452ee3118ace1c8ab114cce5f2f3@o4508969051553792.ingest.us.sentry.io/4508969051815936",

  // Add Performance Monitoring by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// Validate environment variables at startup
try {
  validateEnv();
  console.log("✅ Environment variables validated successfully");
} catch (error) {
  console.error(
    "❌ Environment validation failed:",
    error instanceof Error ? error.message : error
  );
  process.exit(1); // Exit the process with an error code
}

export default {
  port: 8000,
  fetch: app.fetch,
};
