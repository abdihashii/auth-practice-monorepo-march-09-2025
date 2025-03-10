// Third-party imports
import { z } from "zod";

/**
 * Validation schema for user ID parameter
 * Ensures the ID is a valid UUID format
 */
export const idParamSchema = z.object({
  id: z.string().uuid("Invalid user ID format"),
});
