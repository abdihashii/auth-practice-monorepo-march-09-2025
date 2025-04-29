import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { updateUser, updateUserProfilePicture } from '@/api/user-apis';
import { useAuthContext } from '@/hooks/use-auth-context';

export function useProfileCard() {
  /**
   * Hooks:
   * - useAuthContext: To get the current authenticated user
   * - useQueryClient: To invalidate the user query to refresh the UI
   */
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  /**
   * State:
   * - isEditing: To track if the user is editing the profile card
   * - name: To store the user's name in the form. It's initialized to the
   *   user's name or an empty string if the user has no name.
   * - bio: To store the user's bio in the form. It's initialized to the user's
   *   bio or an empty string if the user has no bio.
   */
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Handle profile picture updates
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) {
      throw new Error('User ID is required to upload profile picture');
    }

    const file = e.target.files?.[0];
    if (!file) {
      throw new Error('No file selected');
    }

    if (file) {
      try {
        await updateUserProfilePicture(user.id, file);

        // Invalidate the user query to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['user'] });

        toast('Profile picture updated', {
          description: 'Your profile picture has been updated',
        });
      } catch (error) {
        console.error('Error updating profile picture:', error);
        toast('Error updating profile picture', {
          description: 'Please try again',
        });
      }
    }
  };

  // Handle profile picture removal
  const handleProfilePictureRemove = async () => {
  // Ensure the user is authenticated
    if (!user?.id) {
      throw new Error('User ID is required to remove profile picture');
    }

    try {
    // Call the updateUser API setting profilePicture to null
      await updateUser(user.id, { profilePicture: null });

      // Invalidate the user query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['user'] });

      toast('Profile picture removed', {
        description: 'Your profile picture has been removed',
      });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      toast('Error removing profile picture', {
        description: 'Please try again',
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Ensure the user is authenticated
    if (!user?.id) {
      throw new Error('User ID is required');
    }

    // Build the payload with only changed fields
    const updatePayload: { name?: string | null; bio?: string | null } = {};

    // Check if name changed from original or if original was null/undefined
    if (name !== (user.name ?? '')) {
      updatePayload.name = name || null; // Send null if empty string
    }

    // Check if bio changed from original or if original was null/undefined
    if (bio !== (user.bio ?? '')) {
      updatePayload.bio = bio || null; // Send null if empty string
    }

    // Add similar logic for profilePicture if implemented

    // Only submit if there are actual changes
    if (Object.keys(updatePayload).length === 0) {
      setIsEditing(false); // No changes, just exit edit mode
      return;
    }

    try {
      // Update the user via the API with only changed fields
      await updateUser(user.id, updatePayload);

      // Invalidate the user query to refresh the data on successful update
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      // Reset the editing state after submission to "close" the form
      setIsEditing(false);
    }
  };

  return {
    // State
    isEditing,
    name,
    bio,

    // Handlers
    setIsEditing,
    setName,
    setBio,
    handleProfilePictureUpload,
    handleProfilePictureRemove,
    handleSubmit,
  };
}
