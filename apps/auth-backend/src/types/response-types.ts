import type { ApiError } from "./error-types";

/**
 * Standard successful response format for single resources
 */
export interface SingleResourceResponse<T> {
  data: T;
}

/**
 * Standard successful response format for collections of resources
 */
export interface CollectionResponse<T> {
  data: T[];
}

/**
 * Union type for all possible API response formats
 */
export type ApiResponse<T> =
  | SingleResourceResponse<T>
  | CollectionResponse<T>
  | ApiError;
