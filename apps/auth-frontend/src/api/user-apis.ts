import type { ApiResponse, UpdateUserDto, UpdateUserPasswordDto } from '@roll-your-own-auth/shared/types';

import { BASE_API_URL } from '@/constants';

/**
 * Update user's profile information
 *
 * @param {string} userId - The ID of the user to update
 * @param {UpdateUserDto} user - The user data to update
 * @returns {Promise<ApiResponse<{ message: string }>>} The response from the API
 */
export async function updateUser(userId: string, user: UpdateUserDto) {
  // Validate the user data
  const { name, bio, profilePicture } = user;

  // Update the user
  const res = await fetch(`${BASE_API_URL}/api/v1/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name, bio, profilePicture }),
  });

  const response = await res.json();

  if (!res.ok) {
    const error = response.error || { message: 'Failed to update user' };
    throw new Error(error.message);
  }

  const { data } = response as { data: ApiResponse<{ message: string }> };

  return data;
}

/**
 * Update user's password
 *
 * @param {string} userId - The ID of the user to update
 * @param {UpdateUserPasswordDto} passwords - The passwords to update
 * (old_password, new_password)
 * @returns {Promise<ApiResponse<{ message: string }>>} The response from the API
 */
export async function updateUserPassword(userId: string, passwords: UpdateUserPasswordDto) {
  // Update the user's password
  const res = await fetch(`${BASE_API_URL}/api/v1/users/${userId}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(passwords),
  });

  const response = await res.json();

  if (!res.ok) {
    const error = response.error || { message: 'Failed to update user password' };
    throw new Error(error.message);
  }

  const { data } = response as { data: ApiResponse<{ message: string }> };

  return data;
}
