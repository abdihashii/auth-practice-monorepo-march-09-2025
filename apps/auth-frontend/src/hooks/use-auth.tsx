import type { User } from '@roll-your-own-auth/shared/types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { useNavigate } from '@tanstack/react-router';

import { login, logout, register } from '@/api/auth-apis';
import { authStorage } from '@/services/auth-storage-service';

// Key for auth-related queries
export const AUTH_QUERY_KEY = ['auth'];

/**
 * Hook for authentication functionality
 */
export function useAuth() {
  // Get the navigate function from the router
  // const navigate = useNavigate();

  // QueryClient instance is used to cache, invalidate, clear, and refetch data
  const queryClient = useQueryClient();

  // Query for managing auth state - loads from localStorage in queryFn
  const { data: authData, isPending: isAuthPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    // Use queryFn as the source of truth for auth data from localStorage
    queryFn: () => {
      const token = authStorage.getToken();
      const user = authStorage.getUser();
      if (token && user) {
        return { user, accessToken: token };
      }
      return null;
    },
    // Only run once on mount - no refetching
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Extract user from auth data
  const user = authData?.user;
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
    },
    onError: (error) => {
      console.error(error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string; confirmPassword: string }) =>
      register(credentials.email, credentials.password, credentials.confirmPassword),
    onSuccess: () => {
      // Navigate to verify email page
      // navigate('/verify-email');
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
  };

  // Register function that returns a promise
  const registerFn = async (email: string, password: string, confirmPassword: string): Promise<void> => {
    // Call the register mutation
    await registerMutation.mutateAsync({ email, password, confirmPassword });
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
    isAuthPending,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error,

    // Actions
    login: loginFn,
    register: registerFn,
    logout: logoutFn,
  };
}
