import type { OAuthProvider } from '@roll-your-own-auth/shared/types';
import type { InferSelectModel } from 'drizzle-orm';

import type { authUsersTable } from '@/db/schema';
/**
 * Type representing the full database schema of a user row
 */
export type UserSchema = InferSelectModel<typeof authUsersTable>;

/**
 * Type with all possible selectable user fields
 * This allows for flexible field selection while maintaining type safety
 */
export type SelectableUserColumns = {
  [K in keyof typeof authUsersTable]?: boolean;
};

/**
 * Standardized user profile structure obtained from an OAuth provider.
 */
export interface ProviderUserProfile {
  provider: OAuthProvider; // e.g., 'google', 'github'
  providerId: string; // The unique ID from the provider (e.g., Google's 'sub')
  email: string | null;
  name?: string | null;
  picture?: string | null;
  // Include other standardized fields as needed
}
