// Local imports
import type { dbConnect } from '@/db';

export interface CustomEnv {
  Variables: {
    db: Awaited<ReturnType<typeof dbConnect>>;
    rateLimitEmail?: string;
  };
}
