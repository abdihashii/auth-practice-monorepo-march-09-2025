import type { ClassValue } from 'clsx';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a JWT token is expired
 * @param token - JWT token to check
 * @returns boolean indicating if token is expired or invalid
 */
export function isAccessTokenExpired(accessToken: string | null): boolean {
  if (!accessToken) return true;

  try {
    // Extract the payload from the JWT token (second part)
    const payload = accessToken.split('.')[1];
    if (!payload) return true;

    // Decode the base64 payload
    const decodedPayload = JSON.parse(atob(payload));

    // Check if the token has an expiration date
    if (!decodedPayload.exp) return true;

    // Check if the token is expired
    const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch {
    // Any error in parsing means the token is invalid, so return true to
    // indicate the token is expired
    return true;
  }
}
