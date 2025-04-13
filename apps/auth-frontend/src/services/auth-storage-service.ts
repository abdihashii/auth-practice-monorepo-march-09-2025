import type { User } from '@roll-your-own-auth/shared/types';

const AUTH_USER_KEY = 'auth_user';

/**
 * Service to handle storage of authentication data
 */
export const authStorage = {
  /**
   * Save user data to storage
   */
  saveUserDataToLocalStorage: (user: User): void => {
    if (!user) {
      throw new Error('User data is required');
    }

    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  /**
   * Get the stored user data
   */
  getUserDataFromLocalStorage: (): User | null => {
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
  clearLocalStorageUserData: (): void => {
    localStorage.removeItem(AUTH_USER_KEY);
  },
};
