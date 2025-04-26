/* eslint-disable node/no-process-env */
import { z } from 'zod';

// Determine if this is being run at build time
const isBuildTime = process.argv.includes('--build');

// Schema with required fields for both build and runtime
const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url(),
  JWT_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  // Build time doesn't need these, but runtime does
  RESEND_API_KEY: isBuildTime ? z.string().optional() : z.string(),
  REDIS_URL: z.string().url(),
  // Only required in production runtime
  REDIS_TOKEN: z.string().optional(),
}).superRefine((input, ctx) => {
  // Skip production-specific validations at build time
  if (isBuildTime) return;

  // Ensure JWT_SECRET is strong enough in production
  if (input.NODE_ENV === 'production' && input.JWT_SECRET.length < 256) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'JWT_SECRET should be at least 256 characters long in production',
      path: ['JWT_SECRET'],
    });
  }

  // Ensure proper URLs in production
  if (input.NODE_ENV === 'production') {
    // Database URL should use SSL in production
    if (!input.DATABASE_URL.includes('ssl=true')
      && !input.DATABASE_URL.includes('sslmode=require')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL should use SSL in production',
        path: ['DATABASE_URL'],
      });
    }

    // Frontend URL should use HTTPS in production
    if (!input.FRONTEND_URL.startsWith('https://')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FRONTEND_URL should use HTTPS in production',
        path: ['FRONTEND_URL'],
      });
    }

    // Ensure Redis token is provided in production runtime
    if (!input.REDIS_TOKEN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'REDIS_TOKEN is required in production for rate limiting',
        path: ['REDIS_TOKEN'],
      });
    }
  }
});

export type Env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

// Export validated environment as a non-optional constant
export default env!;
