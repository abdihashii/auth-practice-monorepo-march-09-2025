// Third-party imports
import type { InferSelectModel } from 'drizzle-orm';

// Local imports
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
