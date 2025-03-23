// Local imports
import type { dbConnect } from "@/db";

export type CustomEnv = {
  Variables: {
    db: Awaited<ReturnType<typeof dbConnect>>;
  };
};
