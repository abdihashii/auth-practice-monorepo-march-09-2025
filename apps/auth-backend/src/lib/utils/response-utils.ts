// Local imports
import type {
  ApiResponse,
  CollectionResponse,
  SingleResourceResponse,
} from "@/lib/types";
import { ApiErrorCode } from "@/lib/types";
import { createApiErrorResponse } from "@/lib/utils/error-utils";

/**
 * Creates a standardized response for a single resource
 *
 * @param {T} data - The resource data to include in the response
 * @returns {SingleResourceResponse<T>} A properly formatted single resource response
 */
function createSingleResourceResponse<T>(data: T): SingleResourceResponse<T> {
  return {
    data,
  };
}

/**
 * Creates a standardized response for a collection of resources
 *
 * @param {T[]} data - The array of resources to include in the response
 * @returns {CollectionResponse<T>} A properly formatted collection response
 */
function createCollectionResponse<T>(data: T[]): CollectionResponse<T> {
  return {
    data,
  };
}

/**
 * Creates a standardized API response that can be either success or error
 *
 * @param {Object} options - Configuration object for the response
 * @param {T | T[]} options.data - Optional data to include in a success response. Can be a single resource or an array of resources.
 * @param {Object} options.error - Optional error details to include in an error response
 * @param {ApiErrorCode} options.error.code - The error code
 * @param {string} options.error.message - The error message
 * @param {Record<string, unknown>} options.error.details - Optional additional details about the error
 *
 * @returns {ApiResponse<T>} A properly formatted API response (success or error)
 *
 * @example
 * // Success response with a single resource
 * createApiResponse({ data: user })
 *
 * @example
 * // Success response with a collection
 * createApiResponse({ data: users })
 *
 * @example
 * // Error response
 * createApiResponse({
 *   error: {
 *     code: "NOT_FOUND",
 *     message: "User not found"
 *   }
 * })
 */
export function createApiResponse<T>(options: {
  data?: T | T[];
  error?: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}): ApiResponse<T> {
  // If error is provided, return an error response
  if (options.error) {
    return createApiErrorResponse(
      options.error.code as ApiErrorCode,
      options.error.message,
      options.error.details
    );
  }

  // If data is an array, return a collection response
  if (Array.isArray(options.data)) {
    return createCollectionResponse(options.data);
  }

  // Otherwise, return a single resource response
  return createSingleResourceResponse(options.data as T);
}
