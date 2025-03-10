// Local imports
import { dbConnect } from "@/db";

export type CustomEnv = {
  Variables: {
    db: Awaited<ReturnType<typeof dbConnect>>;
  };
};
