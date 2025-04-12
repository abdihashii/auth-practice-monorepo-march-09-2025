import type { AuthResponse, User } from '@roll-your-own-auth/shared/types';

import { BASE_API_URL } from '@/constants';

import { apiClient } from './api-client';

/**
 * Log in a user with email and password
 *
 * This is a public route that doesn't require authentication, but does set
 * HTTP-only cookies upon successful login.
 *
 * @returns AuthResponse containing user data
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await apiClient<{ data: AuthResponse }>(`${BASE_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return response.data;
  } catch (error: any) {
    console.error('Login failed:', error);
    throw new Error(error.message || 'Failed to login');
  }
}

/**
 * Register a new user
 *
 * This is a public route that doesn't require authentication.
 *
 * @returns AuthResponse containing registration status
 */
export async function register(email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
  // Double validate the password and confirm password
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  try {
    const response = await apiClient<{ data: AuthResponse }>(`${BASE_API_URL}/api/v1/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return response.data;
  } catch (error: any) {
    console.error('Registration failed:', error);
    throw new Error(error.message || 'Failed to register');
  }
}

/**
 * Get the current authenticated user
 *
 * This function fetches the currently authenticated user by calling the /me endpoint.
 * Authentication is handled via HTTP-only cookies that are automatically included
 * in the request by the apiClient.
 *
 * If the user is not authenticated or the access token has expired, the apiClient
 * will automatically attempt to refresh the token before failing. If the token
 * refresh fails, the user will be logged out.
 *
 * @returns User data if authenticated, null if unauthenticated or on error
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // Use the apiClient which handles authentication via HTTP-only cookies
    // and automatically refreshes tokens if needed
    const response = await apiClient<{ data: User }>(`${BASE_API_URL}/api/v1/auth/me`, {
      method: 'GET',
    });

    return response.data;
  } catch (error) {
    // If there's an error, the user is not authenticated or something else went wrong
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Log out the current user by calling the logout endpoint.
 * This will clear the HTTP-only auth cookies.
 *
 * This is technically a public route (doesn't require valid tokens)
 * but still needs to send the cookies to clear them.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient<{ data: { message: string } }>(`${BASE_API_URL}/api/v1/auth/logout`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Failed to logout');
  }
}

/**
 * Verify a user's email with a token
 *
 * This is a public route that doesn't require authentication, but it
 * sets HTTP-only cookies upon successful email verification.
 *
 * @returns Result of email verification attempt
 */
export async function verifyEmail(token: string, signal?: AbortSignal): Promise<{
  success: boolean;
  error?: {
    code?: string;
    message: string;
  };
}> {
  try {
    // Call the API but we don't need the response data, just success/failure
    await apiClient<{ data: any }>(`${BASE_API_URL}/api/v1/auth/verify-email/${token}`, {
      method: 'POST',
      signal,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message || 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Resend verification email to the specified email address
 *
 * This is a public route that doesn't require authentication.
 *
 * @returns Result of the resend attempt
 */
export async function resendVerificationEmail(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: {
    code?: string;
    message: string;
    details?: {
      message?: string;
      name?: string;
      code?: string;
    };
  };
}> {
  try {
    const response = await apiClient<{ data: { message: string } }>(
      `${BASE_API_URL}/api/v1/auth/resend-verification-email`,
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    );

    return {
      success: true,
      message: response.data.message || 'Verification email sent successfully',
    };
  } catch (error: any) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message || 'An unexpected error occurred',
        details: error.details,
      },
    };
  }
}
