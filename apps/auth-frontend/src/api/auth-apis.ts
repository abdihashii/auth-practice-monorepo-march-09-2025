import { BASE_API_URL } from "@/constants";
import type { AuthResponse } from "@/types/auth-types";

/**
 * Log in a user with email and password
 * @returns AuthResponse containing user data and access token
 */
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const res = await fetch(`${BASE_API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include", // Include cookies in the request
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to login");
  }

  return res.json();
};

/**
 * Get the current authenticated user
 * @returns AuthResponse if authenticated, null otherwise
 */
export const getCurrentUser = async (
  accessToken: string
): Promise<AuthResponse | null> => {
  try {
    if (!accessToken) {
      return null;
    }

    const res = await fetch(`${BASE_API_URL}/api/v1/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: "include", // Important for cookies
    });

    if (!res.ok) {
      // If status is 401, user is not authenticated
      if (res.status === 401) {
        return null;
      }
      throw new Error("Failed to get current user");
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

/**
 * Log out the current user
 */
export const logout = async (): Promise<void> => {
  const res = await fetch(`${BASE_API_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies in the request
  });

  if (!res.ok) {
    throw new Error("Failed to logout");
  }
};
