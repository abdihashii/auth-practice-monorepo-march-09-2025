import type { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema } from '@roll-your-own-auth/shared/schemas';
import { Link } from '@tanstack/react-router';
import { CheckCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  AuthForm,
  AuthLink,
  PasswordInput,
} from '@/components/auth/auth-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BASE_API_URL } from '@/constants';
import { useAuthContext } from '@/hooks/use-auth-context';
import { cn } from '@/lib/utils';

interface RegisterFormProps {
  className?: string;
}

export function RegisterForm({
  className,
}: RegisterFormProps) {
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register: registerAuth, isRegistering } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Watch the email field to use in the success message
  const email = watch('email');

  async function onSubmit(data: z.infer<typeof registerFormSchema>) {
    try {
      await registerAuth(data.email, data.password, data.confirmPassword);
      setRegistrationSuccess(true);
    } catch (error) {
      // Use react-hook-form's setError to set a root error
      setError('root', {
        type: 'manual',
        message: error instanceof Error
          ? error.message
          : 'Failed to register. Please try again.',
      });
    }
  }

  const socialAuth = (
    <a
      href={`${BASE_API_URL}/api/v1/auth/google`}
      className="block w-full"
    >
      <Button
        type="button"
        variant="outline"
        className="w-full hover:cursor-pointer"
      >
        Register with Google
      </Button>
    </a>
  );

  if (registrationSuccess) {
    return (
      <div className={cn('flex flex-col gap-6', className)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <CheckCircleIcon className="mr-2 h-6 w-6 text-green-500" />
              Registration Successful
            </CardTitle>
            <CardDescription>
              Please verify your email to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <p>
                We've sent a verification email to
                {' '}
                <strong>{email}</strong>
                .
                Please check your inbox and click the verification link to activate your account.
              </p>
              <p className="text-sm text-muted-foreground">
                If you don't see the email, please check your spam folder or request a new verification email.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full hover:cursor-pointer"
              onClick={() => {
                // Reset registration success state to show form again
                setRegistrationSuccess(false);
              }}
            >
              Register a different account
            </Button>
            <div className="text-center text-sm">
              Already have an account?
              {' '}
              <Link
                to="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <AuthForm
      className={className}
      title="Register"
      description="Enter your email below to register for an account"
      error={errors.root?.message}
      isSubmitting={isRegistering}
      onSubmit={handleSubmit(onSubmit)}
      submitText="Register"
      loadingText="Registering..."
      footer={(
        <AuthLink
          text="Already have an account?"
          to="/login"
          linkText="Login"
        />
      )}
    >
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          {...register('email')}
          id="email"
          type="email"
          placeholder="test@example.com"
        />
        {errors.email && (
          <p className="text-red-500">{errors.email.message}</p>
        )}
      </div>

      <PasswordInput
        id="password"
        label="Password"
        register={register('password')}
        error={errors.password?.message}
      />

      <PasswordInput
        id="confirmPassword"
        label="Confirm Password"
        register={register('confirmPassword')}
        error={errors.confirmPassword?.message}
      />

      {socialAuth}
    </AuthForm>
  );
}
