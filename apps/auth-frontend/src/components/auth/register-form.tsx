import type { z } from 'zod';

import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema } from '@roll-your-own-auth/shared';
import { Link } from '@tanstack/react-router';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof registerFormSchema>>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(data: z.infer<typeof registerFormSchema>) {
    // eslint-disable-next-line no-console
    console.log(data);
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
              <Button type="submit" className="w-full">
                Register
              </Button>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="hover:cursor-not-allowed ">
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={true}
                      >
                        Register with Google
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
