import { logout as logoutApi } from '@/api/auth-apis';
import { AUTH_QUERY_KEY } from '@/hooks/use-auth';
import { queryClient } from '@/lib/react-query';
import { authStorage } from '@/services/auth-storage-service';

/**
 * Handles complete user logout process:
 * 1. Calls the logout API endpoint
 * 2. Clears auth data from storage
 * 3. Updates React Query state by setting the value to null
 *
 * Can be called from anywhere in the application.
 */
export async function handleLogout(options = { silent: false }): Promise<void> {
  try {
    // Call the logout API endpoint to clear the HTTP-only refresh token cookie
    await logoutApi();
  } catch (error) {
    if (!options.silent) {
      console.error('Error calling logout API:', error);
    }
    // Continue with client-side logout in the finally block even if API call
    // fails
  } finally {
    // Clear auth data from storage
    authStorage.clearAuth();

    // Update React Query state
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
  }
}
