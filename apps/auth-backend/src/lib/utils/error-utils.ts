import type { ApiError, ApiErrorCode } from '@roll-your-own-auth/types';

/**
 * Creates an API error response that's used in createApiResponse which is a
 * standardized API response that can be either success or error
 *
 * @param {string} code - The error code
 * @param {string} message - The error message
 * @param {Record<string, unknown>} details - The error details
 * @returns {ApiError} The API error response
 */
export function createApiErrorResponse(
  code: string = 'INTERNAL_SERVER_ERROR',
  message: string,
  details?: Record<string, unknown>,
): ApiError {
  return {
    error: {
      code: code as ApiErrorCode,
      message,
      ...(details && { details }),
    },
  };
}
