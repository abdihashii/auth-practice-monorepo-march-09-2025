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
const emailNotificationPreferencesSchema = z.object({
  enabled: z.boolean().default(true),
  digest: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  marketing: z.boolean().default(false),
});
const pushNotificationPreferencesSchema = z.object({
  enabled: z.boolean().default(true),
  alerts: z.boolean().default(true),
});

/**
 * Types for user preferences form data.
 */
type UserPreferences = z.infer<typeof userPreferencesSchema>;
type EmailNotificationPreferences = z.infer<typeof emailNotificationPreferencesSchema>;
type PushNotificationPreferences = z.infer<typeof pushNotificationPreferencesSchema>;

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
  const {
    handleSubmit: handleEmailNotificationSubmit,
    formState: {
      errors: emailNotificationErrors,
      isSubmitting: emailNotificationIsSubmitting,
      isDirty: emailNotificationIsDirty,
    },
    control: emailNotificationControl,
  } = useForm<EmailNotificationPreferences>({
    resolver: zodResolver(emailNotificationPreferencesSchema),
    defaultValues: {
      enabled: user?.notificationPreferences?.email?.enabled ?? true,
      digest: user?.notificationPreferences?.email?.digest as EmailNotificationPreferences['digest']
        ?? 'daily',
      marketing: user?.notificationPreferences?.email?.marketing ?? false,
    },
  });
  const {
    handleSubmit: handlePushNotificationSubmit,
    formState: {
      errors: pushNotificationErrors,
      isSubmitting: pushNotificationIsSubmitting,
      isDirty: pushNotificationIsDirty,
    },
    control: pushNotificationControl,
  } = useForm<PushNotificationPreferences>({
    resolver: zodResolver(pushNotificationPreferencesSchema),
    defaultValues: {
      enabled: user?.notificationPreferences?.push?.enabled ?? true,
      alerts: user?.notificationPreferences?.push?.alerts ?? true,
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

  /**
   * Handles the form submission for email notification preferences.
   * @param data - The form submission data.
   */
  const onEmailNotificationSubmit = async (
    data: EmailNotificationPreferences,
  ) => {
    // Ensure the user is authenticated
    if (!user?.id) {
      throw new Error('User ID is required');
    }

    // Define the type for the specific part of the DTO we're updating
    type UpdatePayload = Partial<Pick<UpdateUserDto, 'notificationPreferences'>>;

    const updatePayload: UpdatePayload = {};

    const originalEmailPreferences = {
      enabled: user.notificationPreferences?.email?.enabled ?? true,
      digest: user.notificationPreferences?.email?.digest ?? 'daily',
      marketing: user.notificationPreferences?.email?.marketing ?? false,
    };

    // Correctly compare fields instead of object reference
    const hasEmailNotificationPreferencesChanged
      = data.enabled !== originalEmailPreferences.enabled
        || data.digest !== originalEmailPreferences.digest
        || data.marketing !== originalEmailPreferences.marketing;

    // Only include settings in the payload if there are changes
    if (hasEmailNotificationPreferencesChanged) {
      // Fetch current push preferences to send the complete object
      const currentPushPreferences = user.notificationPreferences?.push ?? {
        enabled: true, // Default values if push prefs don't exist
        alerts: true,
      };

      updatePayload.notificationPreferences = {
        email: data,
        push: currentPushPreferences,
      };
    }

    try {
      // Update the user via the API only if there are actual changes
      if (Object.keys(updatePayload).length > 0) {
        // No need for complex casting if the payload structure is correct
        await updateUser(user.id, updatePayload);

        // Invalidate the user query to refresh the data on successful update
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    } catch (error) {
      console.error('Error updating email notification preferences:', error);
    }
  };

  /**
   * Placeholder for push notification form submission.
   * @param data - The form submission data.
   */
  const onPushNotificationSubmit = async (
    data: PushNotificationPreferences,
  ) => {
    // Ensure the user is authenticated
    if (!user?.id) {
      throw new Error('User ID is required');
    }

    // Define the type for the specific part of the DTO we're updating
    type UpdatePayload = Partial<Pick<UpdateUserDto, 'notificationPreferences'>>;

    const updatePayload: UpdatePayload = {};

    const originalPushPreferences = {
      enabled: user.notificationPreferences?.push?.enabled ?? true,
      alerts: user.notificationPreferences?.push?.alerts ?? true,
    };

    // Correctly compare fields instead of object reference
    const hasPushNotificationPreferencesChanged
      = data.enabled !== originalPushPreferences.enabled
        || data.alerts !== originalPushPreferences.alerts;

    // Only include settings in the payload if there are changes
    if (hasPushNotificationPreferencesChanged) {
      // Fetch current push preferences to send the complete object
      const currentEmailPreferences = user.notificationPreferences?.email ?? {
        enabled: true, // Default values if push prefs don't exist
        digest: 'daily',
        marketing: false,
      };

      updatePayload.notificationPreferences = {
        email: currentEmailPreferences,
        push: data,
      };
    }

    try {
      // Update the user via the API only if there are actual changes
      if (Object.keys(updatePayload).length > 0) {
        // No need for complex casting if the payload structure is correct
        await updateUser(user.id, updatePayload);

        // Invalidate the user query to refresh the data on successful update
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    } catch (error) {
      console.error('Error updating push notification preferences:', error);
    }
  };

  return {
    // Form state
    settingsControl,
    settingsErrors,
    settingsIsSubmitting,
    settingsIsDirty,
    emailNotificationControl,
    emailNotificationErrors,
    emailNotificationIsSubmitting,
    emailNotificationIsDirty,
    pushNotificationControl,
    pushNotificationErrors,
    pushNotificationIsSubmitting,
    pushNotificationIsDirty,

    // Form actions
    handleSettingsSubmit,
    onSettingsSubmit,
    handleEmailNotificationSubmit,
    onEmailNotificationSubmit,
    handlePushNotificationSubmit,
    onPushNotificationSubmit,
  };
}
