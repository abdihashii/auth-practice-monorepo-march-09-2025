import type { ApiResponse, UpdateUserDto, UpdateUserPasswordDto } from '@roll-your-own-auth/shared/types';

import { BASE_API_URL } from '@/constants';

import { apiClient } from './api-client';

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

  // Update the user using apiClient
  const response = await apiClient<{ data: ApiResponse<{ message: string }> }>(
    `${BASE_API_URL}/api/v1/users/${userId}`,
    {
      method: 'PUT',
      body: JSON.stringify({ name, bio, profilePicture }),
    },
  );

  return response.data;
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
  // Update the user's password using apiClient
  const response = await apiClient<{ data: ApiResponse<{ message: string }> }>(
    `${BASE_API_URL}/api/v1/users/${userId}/password`,
    {
      method: 'PUT',
      body: JSON.stringify(passwords),
    },
  );

  return response.data;
}
