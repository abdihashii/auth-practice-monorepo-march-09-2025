import type { CollectionResponse, SingleResourceResponse } from "@/types";

/**
 * Creates a standardized response for a single resource
 * @param data The resource data to include in the response
 * @returns A properly formatted single resource response
 */
export function createSingleResourceResponse<T>(
  data: T
): SingleResourceResponse<T> {
  return {
    data,
  };
}

/**
 * Creates a standardized response for a collection of resources
 * @param data The array of resources to include in the response
 * @returns A properly formatted collection response
 */
export function createCollectionResponse<T>(data: T[]): CollectionResponse<T> {
  return {
    data,
  };
}
