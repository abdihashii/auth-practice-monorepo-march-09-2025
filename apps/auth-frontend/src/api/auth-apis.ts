import type { AuthResponse } from '@roll-your-own-auth/shared/types';

import { BASE_API_URL } from '@/constants';

/**
 * Log in a user with email and password
 * @returns AuthResponse containing user data and access token
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Include cookies in the request
  });

  const response = await res.json();

  if (!res.ok) {
    const error = response.error || { message: 'Failed to login' };
    throw new Error(error.message);
  }

  const { data } = response as { data: AuthResponse };

  return data;
}

export async function register(email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
  // Double validate the password and confirm password
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  const res = await fetch(`${BASE_API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });

  const response = await res.json();

  if (!res.ok) {
    const error = response.error || { message: 'Failed to register' };
    throw new Error(error.message);
  }

  const { data } = response as { data: AuthResponse };

  return data;
}

/**
 * Get the current authenticated user
 * @returns AuthResponse if authenticated, null otherwise
 */
export async function getCurrentUser(accessToken: string): Promise<AuthResponse | null> {
  try {
    if (!accessToken) {
      return null;
    }

    const res = await fetch(`${BASE_API_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      credentials: 'include', // Important for cookies
    });

    if (!res.ok) {
      // If status is 401, user is not authenticated
      if (res.status === 401) {
        return null;
      }
      throw new Error('Failed to get current user');
    }

    const data = await res.json();

    return data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  const res = await fetch(`${BASE_API_URL}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies in the request
  });

  if (!res.ok) {
    throw new Error('Failed to logout');
  }
}

/**
 * Verify a user's email with a token
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
    const res = await fetch(`${BASE_API_URL}/api/v1/auth/verify-email/${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: data.error?.code,
          message: data.error?.message || 'Failed to verify email',
        },
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
      },
    };
  }
}

/**
 * Resend verification email to the specified email address
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
    const res = await fetch(`${BASE_API_URL}/api/v1/auth/resend-verification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const response = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: {
          code: response.error?.code,
          message: response.error?.message || 'Failed to resend verification email',
          details: response.error?.details || undefined,
        },
      };
    }

    const { data } = response as { data: { message: string } };

    return {
      success: true,
      message: data.message || 'Verification email sent successfully',
    };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
      },
    };
  }
}
