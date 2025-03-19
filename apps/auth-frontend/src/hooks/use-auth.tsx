// Third-party imports
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

// Local imports
import { getCurrentUser, login, logout } from "@/api/auth-apis";
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

  // Query for getting the current authenticated user
  const {
    data: authData,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => getCurrentUser(authStorage.getToken() || ""),
    // Initialize with data from localStorage if available
    initialData: () => {
      const token = authStorage.getToken();
      const user = authStorage.getUser();
      if (token && user) {
        return { data: { user, accessToken: token } } as AuthResponse;
      }
      return undefined;
    },
    enabled: !!authStorage.getToken(),
    // Don't refetch on window focus to avoid unnecessary requests
    refetchOnWindowFocus: false,
  });

  // Mark when initial auth check is complete
  useEffect(() => {
    // If the authData query is not loading or there is no access token in localStorage,
    // mark the initial check as complete. Otherwise, the auth check will continue to run.
    if (!isLoading || !authStorage.getToken()) {
      setInitialCheckComplete(true);
    }
  }, [isLoading]);

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

      // Update query cache authData query to include the new auth data
      queryClient.setQueryData(AUTH_QUERY_KEY, data);
    },
    onError: (error) => {
      console.error(error);
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
    },
  });

  // Login function that returns a promise
  const loginFn = async (email: string, password: string): Promise<void> => {
    // Call the login mutation
    await loginMutation.mutateAsync({ email, password });

    // Explicitly mark the auth check as complete after login
    setInitialCheckComplete(true);
  };

  // Logout function that returns a promise
  const logoutFn = async (): Promise<void> => {
    // Call the logout mutation
    await logoutMutation.mutateAsync();

    // Explicitly mark the auth check as complete after logout
    setInitialCheckComplete(true);
  };

  // Helper method to refresh auth state - useful for token refresh scenarios
  const refreshAuthState = useCallback(async () => {
    // Basically refetch the authData query to refresh the auth state
    await refetchUser();
  }, [refetchUser]);

  return {
    // State
    user: user as User | null | undefined,
    isAuthenticated,
    isPending: isLoading && !initialCheckComplete, // If the auth check is not complete, the auth state is pending
    isLoading,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    error,

    // Actions
    login: loginFn,
    logout: logoutFn,
    refetchUser,
    refreshAuthState,
  };
};
