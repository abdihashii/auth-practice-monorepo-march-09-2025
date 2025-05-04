import type {
  ApiResponse,
  UpdateUserDto,
  UpdateUserPasswordDto,
} from '@roll-your-own-auth/shared/types';

import { BASE_API_URL } from '@/constants';

import { apiClient } from './api-client';

const USER_API_URL = `${BASE_API_URL}/api/v1/users`;

/**
 * Update user's profile information
 *
 * @param {string} userId - The ID of the user to update
 * @param {UpdateUserDto} user - The user data to update
 * @returns {Promise<ApiResponse<{ message: string }>>} The response from the
 * API
 */
export async function updateUser(userId: string, user: UpdateUserDto) {
  // Validate the user data
  const {
    name,
    bio,
    profilePicture,
    settings,
    notificationPreferences,
  } = user;

  // Update the user using apiClient
  const response = await apiClient<{ data: ApiResponse<{ message: string }> }>(
    `${USER_API_URL}/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        name,
        bio,
        profilePicture,
        settings,
        notificationPreferences,
      }),
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
export async function updateUserPassword(
  userId: string,
  passwords: UpdateUserPasswordDto,
) {
  // Update the user's password using apiClient
  const response = await apiClient<{ data: ApiResponse<{ message: string }> }>(
    `${USER_API_URL}/${userId}/password`,
    {
      method: 'PUT',
      body: JSON.stringify(passwords),
    },
  );

  return response.data;
}

/**
 * Update user's profile picture
 *
 * @param {string} userId - The ID of the user to update
 * @param {File} file - The file to update the profile picture with
 * @returns {Promise<ApiResponse<{ message: string }>>} The response from the API
 */
export async function updateUserProfilePicture(userId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient<{ data: ApiResponse<{ message: string }> }>(
    `${USER_API_URL}/${userId}/profile-picture`,
    {
      method: 'POST',
      body: formData,
    },
  );

  return response.data;
}

export async function deleteUser(userId: string) {
  const response = await apiClient<{ data: ApiResponse<{ message: string }> }>(
    `${USER_API_URL}/${userId}`,
    {
      method: 'DELETE',
    },
  );

  return response.data;
}
