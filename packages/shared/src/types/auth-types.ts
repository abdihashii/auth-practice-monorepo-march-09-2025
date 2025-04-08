import type { User } from './user-types';

export interface AuthResponse {
  user?: User; // Present after successful authentication
  accessToken?: string; // Present after successful authentication
  emailVerificationRequired?: boolean; // Indicates if email verification is needed
  message?: string; // Optional message for the client
}
