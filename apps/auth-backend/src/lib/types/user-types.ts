// Third-party imports
import type { InferSelectModel } from 'drizzle-orm';

// Local imports
import type { usersTable } from '@/db/schema';

/**
 * Type representing the full database schema of a user row
 */
export type UserSchema = InferSelectModel<typeof usersTable>;

/**
 * Type for basic user information shown in lists
 */
export interface UserListItem {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  profilePicture: string | null;
  createdAt: Date;
  isActive: boolean;
}

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
 * Type for user settings
 *
 * TODO: move to shared types package
 */
export interface UserSettings {
  theme: 'system' | 'light' | 'dark';
  language: string;
  timezone: string;
}

/**
 * Type for user notification preferences
 *
 * TODO: move to shared types package
 */
export interface NotificationPreferences {
  email: {
    enabled: boolean;
    digest: 'never' | 'daily' | 'weekly' | 'monthly';
    marketing: boolean;
  };
  push: {
    enabled: boolean;
    alerts: boolean;
  };
}

/**
 * Represents a user in the system.
 * This is the safe user type that excludes sensitive information like passwords and tokens.
 * Used for client-side rendering and API responses.
 *
 * TODO: move to shared types package
 */
export interface User {
  // Core user information
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;

  // Email verification
  emailVerified: boolean;

  // Account status & management
  isActive: boolean;
  deletedAt: string | null;

  // User preferences & settings
  settings: UserSettings;
  notificationPreferences: NotificationPreferences;

  // Activity tracking
  lastActivityAt: string | null;
  lastSuccessfulLogin: string | null;
  loginCount: number;
}

/**
 * Data Transfer Object (DTO) for user registration.
 * Contains only the essential fields needed to create a new user account.
 * Additional user data can be updated after registration.
 *
 * TODO: move to shared types package
 */
export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

/**
 * Data Transfer Object (DTO) for user update.
 * Contains only the fields that can be updated for a user.
 *
 * TODO: move to shared types package
 */
export interface UpdateUserDto {
  // Core user information
  name?: string;
  bio?: string;
  profilePicture?: string;

  // User preferences & settings
  settings?: UserSettings;
  notificationPreferences?: NotificationPreferences;
}
