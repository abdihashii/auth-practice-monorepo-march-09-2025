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
 * Type for user settings
 */
export interface UserSettings {
  theme: 'system' | 'light' | 'dark';
  language: string;
  timezone: string;
}

/**
 * Type for user notification preferences
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
 */
export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
}

/**
 * Data Transfer Object (DTO) for user update.
 * Contains only the fields that can be updated for a user.
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
