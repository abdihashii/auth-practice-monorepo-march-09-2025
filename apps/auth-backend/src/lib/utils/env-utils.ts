type EnvVars = {
  DATABASE_URL: string;
  NODE_ENV: string;
  // FRONTEND_URL: string; // Used for CORS
  JWT_SECRET: string;
};

/**
 * Gets environment variables from process.env
 *
 * @returns {EnvVars} Environment variables
 */
export function getEnv(): EnvVars {
  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    NODE_ENV: process.env.NODE_ENV!,
    // FRONTEND_URL: process.env.FRONTEND_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
  };
}

/**
 * Validates that all required environment variables are present
 *
 * @throws {Error} if any required variables are missing
 */
export function validateEnv(): void {
  const required = [
    "DATABASE_URL",
    "NODE_ENV",
    // "FRONTEND_URL",
    "JWT_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", "
      )}. Please check your .env file.`
    );
  }
}
