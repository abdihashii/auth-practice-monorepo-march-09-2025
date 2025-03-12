// Local imports
import type { ApiError } from "@/types/error-types";
import type { User } from "@/types/user-types";

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

/**
 * Standard successful response format for authentication
 *
 * TODO: move to shared types package
 */
export interface AuthResponse {
  user: User;
  accessToken: string;
}
