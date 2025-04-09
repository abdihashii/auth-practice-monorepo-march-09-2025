import type { TokenResponse } from '@roll-your-own-auth/shared/types';

import { BASE_API_URL } from '@/constants';
import { handleLogout } from '@/services/auth-service';
import { authStorage } from '@/services/auth-storage-service';

// Flag to prevent multiple refresh requests from happening simultaneously
let isRefreshing = false;

// Queue of callbacks to run after token refresh
let refreshQueue: Array<(newToken: string) => void> = [];

/**
 * Execute queued requests after token refresh
 */
function executeQueue(newToken: string) {
  refreshQueue.forEach((callback) => callback(newToken));
  refreshQueue = [];
}

/**
 * Refresh the access token using the HTTP-only refresh token cookie
 * @returns A promise resolving to the new access token
 */
export async function refreshAccessToken(): Promise<string> {
  try {
    const response = await fetch(`${BASE_API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Important: send cookies with the request
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: HTTP ${response.status}`);
    }

    // Parse the response as JSON and extract the new access token
    const { data } = await response.json() as { data: TokenResponse };

    // Save the new access token to storage
    authStorage.saveAccessToken(data.accessToken);

    // Return the new access token
    return data.accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);

    // Log out the user completely when refresh fails
    await handleLogout({ silent: true });

    // Rethrow for upstream handling
    throw error;
  }
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
 * Fetch API wrapper with automatic token refresh
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns Promise with fetch response
 */
export async function apiClient<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  // Get the current access token
  const accessToken = authStorage.getAccessToken();

  // Set default headers
  const headers = new Headers(options.headers || {});

  // Set content-type header if not already set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add authorization header if token exists
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // Clone and extend the options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always include cookies
  };

  try {
    // Make the API request
    const response = await fetch(url, fetchOptions);

    // If successful, return the data
    if (response.ok) {
      return await parseResponseData<T>(response);
    }

    // If unauthorized and there's an access token
    if (response.status === 401 && accessToken) {
      // Clone the response to read the body multiple times if needed
      const clonedResponse = response.clone();
      const responseData = await parseResponseData<any>(clonedResponse);

      // Check if token expired
      if (responseData.error?.code === 'ACCESS_TOKEN_EXPIRED') {
        // If already refreshing, queue this request
        if (isRefreshing) {
          return new Promise<T>((resolve, reject) => {
            refreshQueue.push((newToken) => {
              // Retry with new token
              headers.set('Authorization', `Bearer ${newToken}`);
              fetch(url, { ...fetchOptions, headers })
                .then((res) => parseResponseData(res))
                .then((data) => resolve(data as T))
                .catch(reject);
            });
          });
        }

        // Set refreshing flag
        isRefreshing = true;

        try {
          // Get new token
          const newToken = await refreshAccessToken();

          // Reset refreshing flag
          isRefreshing = false;

          // Execute queued requests
          executeQueue(newToken);

          // Retry the request with new token
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryResponse = await fetch(url, { ...fetchOptions, headers });

          if (!retryResponse.ok) {
            throw new Error('Request failed after token refresh');
          }

          return await parseResponseData<T>(retryResponse);
        } catch (refreshError) {
          isRefreshing = false;
          refreshQueue = [];
          throw refreshError;
        }
      }

      // For 401 errors that aren't expired tokens
      throw new Error(responseData.error?.message || 'Unauthorized');
    }

    // For other errors, parse and throw
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
