// Local imports
import type { dbConnect } from '@/db';

/**
 * Custom environment variables for the application
 * - Variables:
 *   - db: The database connection
 *   - rateLimitEmail?: The user email to use for rate limiting
 */
export interface CustomEnv {
  Variables: {
    db: Awaited<ReturnType<typeof dbConnect>>;
    rateLimitEmail?: string;
  };
}
