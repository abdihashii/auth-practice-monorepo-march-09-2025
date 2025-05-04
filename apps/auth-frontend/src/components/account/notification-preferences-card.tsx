import { Controller, useWatch } from 'react-hook-form';

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { usePreferences } from '@/hooks/use-preferences';

import { Switch } from '../ui/switch';

export function NotificationPreferencesCard() {
  const {
    // Form state
    emailNotificationControl,
    emailNotificationErrors,
    emailNotificationIsSubmitting,
    emailNotificationIsDirty,
    pushNotificationControl,
    pushNotificationErrors,
    pushNotificationIsSubmitting,
    pushNotificationIsDirty,

    // Form actions
    handleEmailNotificationSubmit,
    onEmailNotificationSubmit,
    handlePushNotificationSubmit,
    onPushNotificationSubmit,
  } = usePreferences();

  // Watch the 'enabled' fields to conditionally disable other fields
  const isEmailEnabled = useWatch({
    control: emailNotificationControl,
    name: 'enabled',
  });
  const isPushEnabled = useWatch({
    control: pushNotificationControl,
    name: 'enabled',
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Email & Push Notifications</CardTitle>
        <CardDescription>
          Manage your email and push notification preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email-tab">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email-tab">Email</TabsTrigger>
            <TabsTrigger value="push-tab">Push</TabsTrigger>
          </TabsList>
          <TabsContent value="email-tab">
            <form
              onSubmit={handleEmailNotificationSubmit(onEmailNotificationSubmit)}
              className="flex flex-col gap-4"
            >
              {/* Email enabled */}
              <Controller
                control={emailNotificationControl}
                name="enabled"
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="email.enabled"
                      className="w-fit"
                    >
                      Enable email notifications
                    </Label>
                    <Switch
                      id="email.enabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    {emailNotificationErrors?.enabled && (
                      <p className="text-red-500 text-sm">
                        {emailNotificationErrors.enabled?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Email digest */}
              <Controller
                control={emailNotificationControl}
                name="digest"
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
                      disabled={!isEmailEnabled}
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
                    {emailNotificationErrors?.digest && (
                      <p className="text-red-500 text-sm">
                        {emailNotificationErrors.digest?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Email marketing */}
              <Controller
                control={emailNotificationControl}
                name="marketing"
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
                      disabled={!isEmailEnabled}
                    />
                    {emailNotificationErrors?.marketing && (
                      <p className="text-red-500 text-sm">
                        {emailNotificationErrors.marketing?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Button
                type="submit"
                disabled={emailNotificationIsSubmitting || !emailNotificationIsDirty}
              >
                {emailNotificationIsSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="push-tab">
            <form
              onSubmit={handlePushNotificationSubmit(onPushNotificationSubmit)}
              className="flex flex-col gap-4"
            >
              {/* Email enabled */}
              <Controller
                control={pushNotificationControl}
                name="enabled"
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="push.enabled"
                      className="w-fit"
                    >
                      Enable push notifications
                    </Label>
                    <Switch
                      id="push.enabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    {pushNotificationErrors?.enabled && (
                      <p className="text-red-500 text-sm">
                        {pushNotificationErrors.enabled?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Email digest */}
              <Controller
                control={pushNotificationControl}
                name="alerts"
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="push.alerts"
                      className="w-fit"
                    >
                      Alerts
                    </Label>
                    <Switch
                      id="push.alerts"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!isPushEnabled}
                    />
                    {pushNotificationErrors?.alerts && (
                      <p className="text-red-500 text-sm">
                        {pushNotificationErrors.alerts?.message}
                      </p>
                    )}
                  </div>
                )}
              />
              <Button
                type="submit"
                disabled={pushNotificationIsSubmitting || !pushNotificationIsDirty}
              >
                {pushNotificationIsSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
