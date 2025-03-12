// Third-party imports
import type { InferSelectModel } from "drizzle-orm";

// Local imports
import { usersTable } from "@/db/schema";

/**
 * Type representing the full database schema of a user row
 */
export type UserSchema = InferSelectModel<typeof usersTable>;

/**
 * Type for basic user information shown in lists
 */
export type UserListItem = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  isActive: boolean;
};

/**
 * Type for detailed user information shown in single user view
 */
export type UserDetail = UserListItem & {
  emailVerified: boolean;
  lastActivityAt: Date | null;
  settings: Record<string, unknown>;
};

/**
 * Type with all possible selectable user fields
 * This allows for flexible field selection while maintaining type safety
 */
export type SelectableUserColumns = {
  [K in keyof typeof usersTable]?: boolean;
};

/**
 * Data Transfer Object (DTO) for user registration.
 * Contains only the essential fields needed to create a new user account.
 * Additional user data can be updated after registration.
 *
 * TODO: move to shared types package
 */
export interface CreateUserDto {
  email: string;
  password: string /** Will be hashed server-side */;
  name?: string;
}
