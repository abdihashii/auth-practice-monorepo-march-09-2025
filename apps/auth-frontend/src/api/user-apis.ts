import type { ApiResponse, UpdateUserDto } from '@roll-your-own-auth/shared/types';

import { BASE_API_URL } from '@/constants';

/**
 * Update user's profile information
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
