import { createContext } from 'react';

import type { User } from '@/types/auth-types';

// Define the shape of the auth context
interface AuthContextType {
  // State
  user: User | null | undefined;
  isAuthenticated: boolean;
  isAuthPending: boolean;
  isLoggingIn: boolean;
  loginError: unknown;
  isLoggingOut: boolean;
  logoutError: unknown;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
