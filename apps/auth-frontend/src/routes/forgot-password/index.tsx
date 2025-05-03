import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { sendForgotPasswordEmail } from '@/api/auth-apis';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/forgot-password/')({
  component: ForgotPassword,
});

const forgotPasswordEmailSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
});

function ForgotPassword() {
  const [emailSent, setEmailSent] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: {
      isSubmitting: isSubmittingEmail,
      // errors: errorsEmail,
    },
  } = useForm<z.infer<typeof forgotPasswordEmailSchema>>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmitEmail = async (
    data: z.infer<typeof forgotPasswordEmailSchema>,
  ) => {
    if (!data.email) {
      return;
    }

    const {
      success,
      message,
      error,
    } = await sendForgotPasswordEmail(data.email);

    if (!success) {
      toast.error(error?.message ?? 'An error occurred');
    } else {
      toast.success(message ?? 'Password reset email sent');
      setEmailSent(true);
      setServerMessage(message ?? 'Password reset email sent');
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
              <CardTitle className="text-2xl">Forgot Password</CardTitle>
              <CardDescription>
                Enter your email below to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!emailSent
                ? (
                    <form
                      onSubmit={handleSubmitEmail(onSubmitEmail)}
                      className="grid gap-6"
                    >
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          {...registerEmail('email')}
                          id="email"
                          type="email"
                          placeholder="test@example.com"
                          disabled={isSubmittingEmail}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full hover:cursor-pointer"
                        disabled={isSubmittingEmail}
                      >
                        {isSubmittingEmail
                          ? (
                              <>
                                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                Sending reset email...
                              </>
                            )
                          : (
                              'Reset Password'
                            )}
                      </Button>
                    </form>
                  )
                : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Check your inbox!</p>
                      {serverMessage && (
                        <p className="text-sm text-muted-foreground">
                          {serverMessage}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Didn&apos;t receive it? Check your spam folder.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        If you still don&apos;t see it,
                        {' '}
                        <span
                          className="font-semibold hover:cursor-pointer underline"
                          onClick={() => {
                            // Reset the email sent state to allow the user to
                            // send the email again
                            setEmailSent(false);
                            setServerMessage(null);
                          }}
                        >
                          try again.
                        </span>
                      </p>
                    </div>
                  )}

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
