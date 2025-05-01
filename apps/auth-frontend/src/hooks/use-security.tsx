import type { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { updatePasswordSchema } from '@roll-your-own-auth/shared/schemas';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { updateUserPassword } from '@/api/user-apis';
import { useAuthContext } from '@/hooks/use-auth-context';

export function useSecurity() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatePasswordServerError, setUpdatePasswordServerError] = useState<string | null>(null);
  const [updatePasswordServerSuccess, setUpdatePasswordServerSuccess] = useState<boolean>(false);

  const { user } = useAuthContext();
  const { register, handleSubmit, reset, watch, formState: {
    errors,
  } } = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const newPasswordValue = watch('new_password');

  const onSubmit = async (data: z.infer<typeof updatePasswordSchema>) => {
    setIsSubmitting(true);

    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      // Update the user's password
      await updateUserPassword(user.id, {
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });

      setUpdatePasswordServerSuccess(true);

      // Reset form after successful submission
      reset();
    } catch (error) {
      console.error('Error changing password:', error);
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        try {
          // Attempt to parse the error message as JSON (expecting ZodError structure)
          const parsedError = JSON.parse(error.message);
          if (parsedError && parsedError.error?.issues?.[0]?.message) {
            // Use the message from the first Zod issue
            errorMessage = parsedError.error.issues[0].message;
          } else if (parsedError.error?.message) {
            // Fallback to the general error message if issues aren't present
            errorMessage = parsedError.error.message;
          } else {
            // If parsing succeeds but structure is unexpected, use the original message
            errorMessage = error.message;
          }
        } catch {
          // If parsing fails, it's likely not a JSON error message, use the original message
          // We don't need to use parseError, so we can ignore it.
          errorMessage = error.message;
        }
      }
      setUpdatePasswordServerError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // State
    showOldPassword,
    showNewPassword,
    showConfirmPassword,
    isSubmitting,
    updatePasswordServerError,
    updatePasswordServerSuccess,

    // Handlers
    onSubmit,
    setShowOldPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    setUpdatePasswordServerSuccess,

    // Form
    register,
    handleSubmit,
    reset,
    newPasswordValue,
    errors,
  };
}
