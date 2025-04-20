import type { User } from '@roll-your-own-auth/shared/types';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCurrentUser, login, register } from '@/api/auth-apis';
import { AUTH_QUERY_KEY } from '@/constants';
import { AuthContext } from '@/contexts/auth-context';
import { handleLogout } from '@/services/auth-service';
import { authStorage } from '@/services/auth-storage-service';

/**
 * Hook for authentication functionality
 */
function useAuth() {
  // QueryClient instance is used to cache, invalidate, clear, and refetch data
  const queryClient = useQueryClient();

  // Query for managing auth state - loads from localStorage in queryFn
  const { data: authData, isPending: isAuthPending } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    // Use queryFn as the source of truth for auth data from localStorage and /me endpoint
    queryFn: async () => {
      // First, try to get user data from localStorage
      const localUser = authStorage.getUserDataFromLocalStorage();

      // If we have user data in localStorage
      if (localUser) {
        try {
          // Then fetch fresh user data from `/me` endpoint to ensure it's up
          // to date
          const serverData = await getCurrentUser();

          // If server data is valid, update localStorage and use server data
          if (serverData) {
            // Always keep localStorage in sync with server data
            authStorage.saveUserDataToLocalStorage(serverData);
            return { user: serverData };
          }

          // If server returns null (unauthorized), clear localStorage and return null
          // This ensures we don't keep stale auth data when the server session is invalid
          authStorage.clearLocalStorageUserData();
          return null;
        } catch (error) {
          console.error('Error fetching user data from server:', error);
          // For network/server errors (not auth errors), fall back to localStorage
          // This prevents users from being logged out during temporary network issues
          return { user: localUser };
        }
      }

      // If no localStorage data, return null (user not authenticated)
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
      // Save user data to local storage on successful login so that we can
      // use it to populate the auth state
      authStorage.saveUserDataToLocalStorage(data.user!);

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
    // We don't need to save user data to local storage on successful registration
    // because the user is required to verify their email before they can login
    onError: (error) => {
      console.error(error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Use the centralized logout utility
      await handleLogout();
    },
    onError: () => {
      console.error('Logout failed during user-initiated logout');
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
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error,

    // Actions
    login: loginFn,
    register: registerFn,
    logout: logoutFn,
  };
}

/**
 * Provider component that wraps your app and makes auth object available to any
 * child component that calls useAuthContext().
 */
export function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use our custom hook to get auth methods and state
  const auth = useAuth();

  return <AuthContext value={auth}>{children}</AuthContext>;
}
