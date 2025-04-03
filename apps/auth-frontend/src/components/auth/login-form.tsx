import type { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema } from '@roll-your-own-auth/shared/schemas';
import { Link } from '@tanstack/react-router';
import { AlertCircle, Eye, EyeOff, Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuthContext } from '@/hooks/use-auth-context';
import { cn } from '@/lib/utils';

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoggingIn } = useAuthContext();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: z.infer<typeof loginFormSchema>) {
    try {
      await login(data.email, data.password);
    } catch (error) {
      // Set form error for server-side errors
      setError('root', {
        type: 'server',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to log in. Please try again.',
      });
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* Server error message */}
              {errors.root?.message && (
                <div className="flex items-center gap-2 p-4 text-sm border border-red-500 bg-red-50 text-red-900 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <div>{errors.root.message}</div>
                </div>
              )}

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
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="flex-1">
                    Password
                  </Label>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="hover:cursor-not-allowed ">
                          <a
                            href="#"
                            className="inline-block text-sm underline-offset-4 hover:underline pointer-events-none opacity-50"
                            aria-disabled="true"
                            onClick={(e) => e.preventDefault()}
                            tabIndex={-1}
                          >
                            Forgot your password?
                          </a>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        We are still working on this feature!
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative">
                  <Input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
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
                          <EyeOff className="h-4 w-4" />
                        )
                      : (
                          <Eye className="h-4 w-4" />
                        )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-500">{errors.password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full hover:cursor-pointer" disabled={isLoggingIn}>
                {isLoggingIn
                  ? (
                      <>
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    )
                  : (
                      'Login'
                    )}
              </Button>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hover:cursor-not-allowed ">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        Login with Google
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    We are still working on this feature!
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?
              {' '}
              <Link
                to="/register"
                className="underline underline-offset-4 hover:text-primary"
              >
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
