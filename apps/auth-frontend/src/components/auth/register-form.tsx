import type { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema } from '@roll-your-own-auth/shared/schemas';
import { Link } from '@tanstack/react-router';
import { CheckCircleIcon, EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { register: registerAuth, isRegistering } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Watch the email field
  const email = watch('email');

  async function onSubmit(data: z.infer<typeof registerFormSchema>) {
    try {
      await registerAuth(data.email, data.password, data.confirmPassword);
      setRegistrationSuccess(true);
    } catch (error) {
      // Set form error for server-side errors
      setError('root', {
        type: 'server',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to register. Please try again.',
      });
    }
  }

  if (registrationSuccess) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
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
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Register</CardTitle>
          <CardDescription>
            Enter your email below to register for an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...register('email')}
                  id="email"
                  type="email"
                  placeholder="test@example.com"
                  required
                />
                {errors.email && (
                  <p className="text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent bg-transparent hover:cursor-pointer text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? (
                          <EyeOffIcon className="h-4 w-4" />
                        )
                      : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-500">{errors.password.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent bg-transparent hover:cursor-pointer text-muted-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword
                      ? (
                          <EyeOffIcon className="h-4 w-4" />
                        )
                      : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>
              {errors.root && (
                <p className="text-red-500 text-center">{errors.root.message}</p>
              )}
              <Button type="submit" className="w-full hover:cursor-pointer" disabled={isRegistering}>
                {isRegistering
                  ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    )
                  : (
                      'Register'
                    )}
              </Button>
              {/*
                * Use an anchor tag for direct navigation to the Google OAuth
                * login page
                */}
              <a href={`${BASE_API_URL}/api/v1/auth/google`} className="block w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full hover:cursor-pointer"
                >
                  Register with Google
                </Button>
              </a>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?
              {' '}
              <Link
                to="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
