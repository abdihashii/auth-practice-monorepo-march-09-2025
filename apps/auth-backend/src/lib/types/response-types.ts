import type { ApiError } from '@roll-your-own-auth/shared/types';

import type { User } from '@/lib/types/user-types';

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
  verificationRequired?: boolean; // Flag to inform the client
}

/**
 * Internal response type for token refresh operations.
 * Returns a new access token for memory storage.
 * Note: Refresh tokens are handled via HTTP-only cookies and never exposed to JavaScript.
 */
export interface TokenResponse {
  accessToken: string;
}
