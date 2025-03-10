import type { ApiError } from "@/types";

export function createApiErrorResponse(
  code: string = "INTERNAL_SERVER_ERROR",
  message: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}
