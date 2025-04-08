import type { ApiError, User } from '@roll-your-own-auth/shared/types';

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
  user?: User; // Present after successful authentication
  accessToken?: string; // Present after successful authentication
  emailVerificationRequired?: boolean; // Indicates if email verification is needed
  message?: string; // Optional message for the client
}

/**
 * Internal response type for token refresh operations.
 * Returns a new access token for memory storage.
 * Note: Refresh tokens are handled via HTTP-only cookies and never exposed to JavaScript.
 */
export interface TokenResponse {
  accessToken: string;
}
