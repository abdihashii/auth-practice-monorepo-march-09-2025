/* eslint-disable node/no-process-env */
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  JWT_SECRET: z.string(),
}).superRefine((input, ctx) => {
  // Ensure JWT_SECRET is strong enough in production
  if (input.NODE_ENV === "production" && input.JWT_SECRET.length < 256) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "JWT_SECRET should be at least 256 characters long in production",
      path: ["JWT_SECRET"],
    });
  }

  // Ensure proper URLs in production
  if (input.NODE_ENV === "production") {
    // Database URL should use SSL in production
    if (!input.DATABASE_URL.includes("ssl=true")
      && !input.DATABASE_URL.includes("sslmode=require")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL should use SSL in production",
        path: ["DATABASE_URL"],
      });
    }

    // Frontend URL should use HTTPS in production
    if (!input.FRONTEND_URL.startsWith("https://")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "FRONTEND_URL should use HTTPS in production",
        path: ["FRONTEND_URL"],
      });
    }
  }
});

export type env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid environment variables:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export default env;
