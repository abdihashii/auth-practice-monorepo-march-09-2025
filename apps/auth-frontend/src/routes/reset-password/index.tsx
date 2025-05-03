import { zodResolver } from '@hookform/resolvers/zod';
import { passwordSchema } from '@roll-your-own-auth/shared/schemas';
import { createFileRoute, Link, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { Loader2Icon } from 'lucide-react';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { verifyForgotPasswordToken } from '@/api/auth-apis';
import { PasswordInput } from '@/components/auth/auth-form';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  PasswordRequirementsChecker,
} from '@/components/auth/password-requirements-checker';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const resetPasswordTokenSchema = z.object({
  token: z.string().min(1).optional(),
});

export const Route = createFileRoute('/reset-password/')({
  component: ResetPassword,
  validateSearch: zodValidator(resetPasswordTokenSchema),
});

const resetPasswordPasswordSchema = z.object({
  new_password: passwordSchema,
  confirm_new_password: passwordSchema,
}).refine((data) => data.new_password === data.confirm_new_password, {
  path: ['confirm_new_password'],
  message: 'Passwords do not match',
});

function ResetPassword() {
  const { token } = useSearch({ from: '/reset-password/' });
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: {
      isSubmitting: isSubmittingPassword,
      errors: errorsPassword,
    },
    watch: passwordWatch,
  } = useForm<z.infer<typeof resetPasswordPasswordSchema>>({
    resolver: zodResolver(resetPasswordPasswordSchema),
    defaultValues: {
      new_password: '',
      confirm_new_password: '',
    },
  });

  const newPassword = passwordWatch('new_password');
  const confirmNewPassword = passwordWatch('confirm_new_password');

  const passwordCheckerId = useId();

  const onSubmitPassword = async (
    data: z.infer<typeof resetPasswordPasswordSchema>,
  ) => {
    if (!token || !data.new_password || !data.confirm_new_password) {
      return;
    }

    const {
      success,
      message,
      error,
    } = await verifyForgotPasswordToken(token, data.new_password);

    if (!success) {
      toast.error(error?.message ?? 'An error occurred');
    } else {
      toast.success(message ?? 'Password reset successfully');
    }
  };

  return (
    <AuthGuard requireAuth={false}>
      <main
        className="flex min-h-svh w-full items-center justify-center p-6 md:p-10"
      >
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmitPassword(onSubmitPassword)}
                className="grid gap-6"
              >
                <PasswordInput
                  id="new_password"
                  label="New Password"
                  register={registerPassword('new_password')}
                  error={errorsPassword.new_password?.message}
                  aria-describedby={cn(
                    errorsPassword.new_password
                      ? passwordCheckerId
                      : undefined,
                    newPassword && passwordCheckerId,
                  ).trim() || undefined}
                />

                <PasswordRequirementsChecker
                  password={newPassword}
                  id={passwordCheckerId}
                />

                <PasswordInput
                  id="confirm_new_password"
                  label="Confirm New Password"
                  register={registerPassword('confirm_new_password')}
                  error={errorsPassword.confirm_new_password?.message}
                  aria-describedby={cn(
                    errorsPassword.confirm_new_password
                      ? passwordCheckerId
                      : undefined,
                    confirmNewPassword && passwordCheckerId,
                  ).trim() || undefined}
                />

                <Button
                  type="submit"
                  className="w-full hover:cursor-pointer"
                  disabled={isSubmittingPassword}
                >
                  {isSubmittingPassword
                    ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Resetting password...
                        </>
                      )
                    : (
                        'Reset Password'
                      )}
                </Button>
              </form>

              <Button
                type="button"
                variant="secondary"
                className="w-full hover:cursor-pointer mt-6"
                asChild
              >
                <Link to="/login">Back to login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
}
