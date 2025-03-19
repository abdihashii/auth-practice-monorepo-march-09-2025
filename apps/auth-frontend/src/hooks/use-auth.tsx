// Third-party imports
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Local imports
import { login, logout } from "@/api/auth-apis";
import { authStorage } from "@/services/auth-storage-service";
import type { AuthResponse, User } from "@/types/auth-types";

// Key for auth-related queries
export const AUTH_QUERY_KEY = ["auth"];

/**
 * Hook for authentication functionality
 */
export const useAuth = () => {
  // State to track if initial auth check is complete
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  // QueryClient instance is used to cache, invalidate, clear, and refetch data
  const queryClient = useQueryClient();

  // Query for managing auth state - loads from localStorage in queryFn
  const { data: authData } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    // Use queryFn as the source of truth for auth data from localStorage
    queryFn: () => {
      const token = authStorage.getToken();
      const user = authStorage.getUser();
      if (token && user) {
        return { data: { user, accessToken: token } } as AuthResponse;
      }
      return null;
    },
    // Only run once on mount - no refetching
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Mark initial auth check as complete immediately after mount
  useEffect(() => {
    setInitialCheckComplete(true);
  }, []);

  // Extract user from auth data
  const user = authData?.data;
  const isAuthenticated = !!user;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      login(credentials.email, credentials.password),
    onSuccess: (data) => {
      // Save auth data to local storage on successful login
      authStorage.saveAuth(data);

      // Update query cache with login response data
      queryClient.setQueryData(AUTH_QUERY_KEY, data);

      // Mark initial check as complete
      setInitialCheckComplete(true);
    },
    onError: (error) => {
      console.error(error);
      // Set initial check complete even on error to avoid indefinite loading states
      setInitialCheckComplete(true);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear auth data from storage on successful logout
      authStorage.clearAuth();

      // Clear query cache authData query to remove the auth data
      queryClient.setQueryData(AUTH_QUERY_KEY, null);

      // Mark initial check as complete after logout
      setInitialCheckComplete(true);
    },
  });

  // Login function that returns a promise
  const loginFn = async (email: string, password: string): Promise<void> => {
    // Call the login mutation
    await loginMutation.mutateAsync({ email, password });
  };

  // Logout function that returns a promise
  const logoutFn = async (): Promise<void> => {
    // Call the logout mutation
    await logoutMutation.mutateAsync();
  };

  return {
    // State
    user: user as User | null | undefined,
    isAuthenticated,
    isPending: !initialCheckComplete, // If the auth check is not complete, the auth state is pending
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isLoginError: loginMutation.isError,

    // Actions
    login: loginFn,
    logout: logoutFn,
  };
};
