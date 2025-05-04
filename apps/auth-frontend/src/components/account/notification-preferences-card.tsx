import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePreferences } from '@/hooks/use-preferences';

import { Switch } from '../ui/switch';

export function NotificationPreferencesCard() {
  const {
    // Form state
    notificationControl: control,
    notificationErrors: errors,
    notificationIsSubmitting: isSubmitting,
    notificationIsDirty: isDirty,

    // Form actions
    handleNotificationSubmit: handleSubmit,
    onNotificationSubmit: onSubmit,
  } = usePreferences();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage your account preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {/* Email enabled */}
          <Controller
            control={control}
            name="email.enabled"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="email.enabled"
                  className="w-fit"
                >
                  Email
                </Label>
                <Switch
                  id="email.enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                {errors.email?.enabled && (
                  <p className="text-red-500 text-sm">
                    {errors.email?.enabled?.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Email digest */}
          <Controller
            control={control}
            name="email.digest"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="email.digest"
                  className="w-fit"
                >
                  Digest
                </Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  name={field.name}
                >
                  <SelectTrigger id="email.digest" className="w-full">
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {errors.email?.digest && (
                  <p className="text-red-500 text-sm">
                    {errors.email?.digest?.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Email marketing */}
          <Controller
            control={control}
            name="email.marketing"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="email.marketing"
                  className="w-fit"
                >
                  Marketing
                </Label>
                <Switch
                  id="email.marketing"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                {errors.email?.marketing && (
                  <p className="text-red-500 text-sm">
                    {errors.email?.marketing?.message}
                  </p>
                )}
              </div>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
