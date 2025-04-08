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

export interface AuthResponse {
  user?: User; // Present after successful authentication
  accessToken?: string; // Present after successful authentication
  emailVerificationRequired?: boolean; // Indicates if email verification is needed
  message?: string; // Optional message for the client
}
