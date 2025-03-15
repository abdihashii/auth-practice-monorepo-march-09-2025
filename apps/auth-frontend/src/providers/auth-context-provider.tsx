// React
import type { RefetchOptions } from "@tanstack/react-query";
import { createContext, useContext } from "react";

// Local components
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types/auth-types";

// Define the shape of the auth context
interface AuthContextType {
  // State
  user: User | null | undefined;
  isAuthenticated: boolean;
  isPending: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  error: unknown;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: (options?: RefetchOptions) => Promise<unknown>;
}

// Create the auth context with undefined as initial value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider component that wraps your app and makes auth object available to any
 * child component that calls useAuthContext().
 */
export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Use our custom hook to get auth methods and state
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * Hook for components to get the auth object and re-render when it changes.
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }

  return context;
};
