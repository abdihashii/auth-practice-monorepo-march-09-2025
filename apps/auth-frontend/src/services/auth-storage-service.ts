import type { AuthResponse, User } from '@/types/auth-types';

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'auth_user';

/**
 * Service to handle storage of authentication data
 */
export const authStorage = {
  /**
   * Save authentication data to storage
   */
  saveAuth: (authResponse: AuthResponse): void => {
    localStorage.setItem(AUTH_TOKEN_KEY, authResponse.data.accessToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authResponse.data.user));
  },

  /**
   * Get the stored access token
   */
  getToken: (): string | null => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Get the stored user data
   */
  getUser: (): User | null => {
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  },

  /**
   * Clear all authentication data from storage
   */
  clearAuth: (): void => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  /**
   * Check if user is authenticated based on storage
   */
  isAuthenticated: (): boolean => {
    return !!authStorage.getToken();
  },
};
