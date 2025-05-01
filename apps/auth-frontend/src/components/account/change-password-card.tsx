import {
  CheckCircleIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
} from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSecurity } from '@/hooks/use-security';

export default function ChangePasswordCard() {
  const {
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
    errors,
    newPasswordValue,
  } = useSecurity();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        {updatePasswordServerSuccess
          ? (
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircleIcon className="h-4 w-4" />
                  <p>Password updated successfully</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUpdatePasswordServerSuccess(false);
                    reset();
                  }}
                >
                  Change to another password
                </Button>
              </div>
            )
          : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="old_password">Old Password</Label>
                      <div className="relative">
                        <Input
                          {...register('old_password')}
                          type={showOldPassword ? 'text' : 'password'}
                          placeholder="Enter your old password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                        >
                          {showOldPassword
                            ? (
                                <EyeOffIcon className="h-4 w-4" />
                              )
                            : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                          <span className="sr-only">
                            {showOldPassword ? 'Hide password' : 'Show password'}
                          </span>
                        </Button>
                      </div>

                      {errors.old_password && (
                        <p className="text-red-500">{errors.old_password.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new_password">New Password</Label>
                      <div className="relative">
                        <Input
                          {...register('new_password')}
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Enter your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword
                            ? (
                                <EyeOffIcon className="h-4 w-4" />
                              )
                            : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                          <span className="sr-only">
                            {showNewPassword ? 'Hide password' : 'Show password'}
                          </span>
                        </Button>
                      </div>

                      {errors.new_password && (
                        <p className="text-red-500">{errors.new_password.message}</p>
                      )}
                    </div>

                    <PasswordRequirementsChecker password={newPasswordValue} />

                    <div className="grid gap-2">
                      <Label htmlFor="confirm_password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          {...register('confirm_password')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword
                            ? (
                                <EyeOffIcon className="h-4 w-4" />
                              )
                            : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                          <span className="sr-only">
                            {showConfirmPassword ? 'Hide password' : 'Show password'}
                          </span>
                        </Button>
                      </div>

                      {errors.confirm_password && (
                        <p className="text-red-500">{errors.confirm_password.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 hover:cursor-pointer"
                  >
                    <KeyRoundIcon className="h-4 w-4" />
                    {isSubmitting ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>

                {updatePasswordServerError && (
                  <div className="mt-4 text-red-500">
                    {updatePasswordServerError}
                  </div>
                )}
              </form>
            )}
      </CardContent>
    </Card>
  );
}
