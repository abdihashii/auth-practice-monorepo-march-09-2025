import { ApiErrorCode, authErrorCodesRequiringLogout } from '@roll-your-own-auth/shared/types';

import { BASE_API_URL } from '@/constants';
import { handleLogout } from '@/services/auth-service';

// Flag to prevent multiple refresh requests from happening simultaneously
let isRefreshing = false;

// Queue of callbacks to execute after a successful token refresh
// This prevents multiple API calls from each triggering their own refresh
let pendingRequests: Array<() => void> = [];

/**
 * Process all queued requests after a successful token refresh
 * This allows multiple failed requests to retry once the token is refreshed
 * without each one triggering its own refresh
 */
function processPendingRequests() {
  pendingRequests.forEach((callback) => callback());
  pendingRequests = [];
}

/**
 * Parse a response as JSON with error handling
 */
async function parseResponseData<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch (error) {
    console.error('Error parsing response data:', error);
    throw new Error('Failed to parse response data');
  }
}

/**
 * Fetch API wrapper that handles authentication and token refresh
 *
 * This function wraps the native fetch API with additional features:
 *
 * 1. Authentication:
 *    - Automatically includes credentials (HTTP-only cookies) with all requests
 *    - Sets appropriate content headers
 *
 * 2. Token refresh flow:
 *    - Detects 401 errors with ACCESS_TOKEN_EXPIRED code
 *    - Calls the refresh endpoint to get new HTTP-only cookies
 *    - Retries the original request with the refreshed token
 *
 * 3. Request queuing:
 *    - When a token refresh is in progress, subsequent requests are queued
 *    - Once refresh completes, all queued requests are automatically retried
 *    - Prevents multiple simultaneous refresh requests
 *
 * 4. Error handling:
 *    - Parses error responses consistently
 *    - Handles token refresh failures by logging the user out
 *    - Provides clear error messages from the server when available
 *
 * Usage example:
 * ```
 * try {
 *   const data = await apiClient<ResponseType>('https://api.example.com/endpoint', {
 *     method: 'POST',
 *     body: JSON.stringify({ key: 'value' })
 *   });
 *   // Handle successful response
 * } catch (error) {
 *   // Handle error
 * }
 * ```
 *
 * @param url - The URL to fetch
 * @param options - Standard fetch options (method, headers, body, etc.)
 * @returns Promise resolving to the parsed JSON response data of type T
 * @throws Error with message from the server or a default message
 */
export async function apiClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  // Set default headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Always include cookies for authentication. Access token is handled
  // server-side via HTTP-only cookies
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    // Make the API request
    const response = await fetch(url, fetchOptions);

    // If successful, return the data
    if (response.ok) {
      return await parseResponseData<T>(response);
    }

    // Handle 401 unauthorized (expired token)
    if (response.status === 401) {
      // Clone the response to read the body multiple times if needed
      const clonedResponse = response.clone();
      const responseData = await parseResponseData<any>(clonedResponse);

      // Get the error code from the response data
      const errorCode = responseData.error?.code;

      // First check if this is an expired access token that we can
      // automatically refresh
      if (errorCode === ApiErrorCode.ACCESS_TOKEN_EXPIRED) {
        // If already refreshing, queue this request to retry after refresh
        // completes
        if (isRefreshing) {
          return new Promise<T>((resolve, reject) => {
            pendingRequests.push(() => {
              fetch(url, fetchOptions)
                .then((res) => parseResponseData(res))
                .then((data) => resolve(data as T))
                .catch(reject);
            });
          });
        }

        // Set refreshing flag
        isRefreshing = true;

        try {
          // Call the refresh endpoint - server handles setting the new cookies
          // to the HTTP-only cookies.
          const refreshResponse = await fetch(`${BASE_API_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!refreshResponse.ok) {
            throw new Error(`Failed to refresh token: HTTP ${refreshResponse.status}`);
          }

          // Reset refreshing flag
          isRefreshing = false;

          // Execute queued requests
          processPendingRequests();

          // Retry the original request with the new token in cookies
          const retryResponse = await fetch(url, fetchOptions);
          if (!retryResponse.ok) {
            throw new Error('Request failed after token refresh');
          }

          return await parseResponseData<T>(retryResponse);
        } catch (refreshError) {
          // Reset the refreshing flag and clear the queue
          isRefreshing = false;
          pendingRequests = [];

          // Handle failed refresh by logging out
          console.error('Error refreshing token:', refreshError);

          // Let handleLogout manage query cache clearing and invalidation
          await handleLogout({ silent: true });

          throw refreshError;
        }
      } else if (authErrorCodesRequiringLogout.includes(errorCode)) {
        // Then check if this is an auth error requiring logout
        // Log the user out immediately
        console.error(`Auth error requiring logout: ${errorCode}`);

        // Then handle the logout API call and cleanup
        await handleLogout({ silent: true });

        throw new Error(responseData.error?.message || 'Session expired. Please log in again.');
      }

      // Other 401 errors
      throw new Error(responseData.error?.message || 'Unauthorized');
    }

    // Handle other error responses
    const errorData = await parseResponseData<any>(response);
    throw new Error(
      errorData.error?.message
      || `Request failed with status ${response.status}`,
    );
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}
