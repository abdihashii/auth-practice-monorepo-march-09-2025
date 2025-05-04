import type {
  UpdateUserDto,
} from '@roll-your-own-auth/shared/types';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { updateUser } from '@/api/user-apis';

import { useAuthContext } from './use-auth-context';

const userPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z
    .enum(['en', 'es', 'fr', 'de', 'it', 'ja', 'zh', 'ru', 'pt', 'ar'])
    .default('en'),
  timezone: z.string().default('UTC'),
});

/**
 * Type for user preferences form data.
 */
type UserPreferences = z.infer<typeof userPreferencesSchema>;

export function usePreferences() {
  const { user } = useAuthContext();
  const {
    handleSubmit: handleSettingsSubmit,
    formState: {
      errors: settingsErrors,
      isSubmitting: settingsIsSubmitting,
      isDirty: settingsIsDirty,
    },
    control: settingsControl,
  } = useForm<UserPreferences>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: {
      theme: user?.settings?.theme ?? 'system',
      language: user?.settings?.language as UserPreferences['language']
        ?? 'en',
      timezone: user?.settings?.timezone ?? 'UTC',
    },
  });
  const queryClient = useQueryClient();

  /**
   * Handles the form submission.
   * @param data - The form submission data.
   */
  const onSettingsSubmit = async (data: UserPreferences) => {
    // Ensure the user is authenticated
    if (!user?.id) {
      throw new Error('User ID is required');
    }

    // Build the payload with only changed fields
    // Send the full settings object if any setting has changed.
    const updatePayload: Partial<Pick<UpdateUserDto, 'settings'>> = {};

    const originalSettings = {
      theme: user.settings?.theme ?? 'system',
      language: user.settings?.language ?? 'en',
      timezone: user.settings?.timezone ?? 'UTC',
    };

    // Use data from the validated form submission
    const hasSettingsChanged
      = data.theme !== originalSettings.theme
        || data.language !== originalSettings.language
        || data.timezone !== originalSettings.timezone;

    // // Check if notification preferences changed from original or if original
    // // was null/undefined
    // if (notificationPreferences !== (user.notificationPreferences ?? {})) {
    //   updatePayload.notificationPreferences
    //   = notificationPreferences || null; // Send null if empty string
    // }

    // Only include settings in the payload if there are changes
    if (hasSettingsChanged) {
      updatePayload.settings = {
        theme: data.theme,
        language: data.language,
        timezone: data.timezone,
      };
    }

    try {
      // Update the user via the API with only changed fields
      // Ensure we only call updateUser if there are actual changes
      if (Object.keys(updatePayload).length > 0) {
        // We cast here because we know if settings is present, it matches
        // UserSettings
        await updateUser(user.id, updatePayload as UpdateUserDto);

        // Invalidate the user query to refresh the data on successful update
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return {
    // Form state
    settingsControl,
    settingsErrors,
    settingsIsSubmitting,
    settingsIsDirty,

    // Form actions
    handleSettingsSubmit,
    onSettingsSubmit,
  };
}
