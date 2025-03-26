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

export interface AuthResponse {
  user: User;
  accessToken: string;
}
