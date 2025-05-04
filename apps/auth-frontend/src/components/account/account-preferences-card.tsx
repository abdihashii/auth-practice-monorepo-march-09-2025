'use client';

import { Controller } from 'react-hook-form';

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
import { usePreferencesCard } from '@/hooks/use-preferences-card';

import { Button } from '../ui/button';

export function AccountPreferencesCard() {
  const {
    // Form state
    control,
    errors,
    isSubmitting,
    isDirty,
    // Form actions
    handleSubmit,
    onSubmit,
  } = usePreferencesCard();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Account Preferences</CardTitle>
        <CardDescription>
          Manage your account preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-4"
        >
          <Controller
            control={control}
            name="theme"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  name={field.name}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                {errors.theme && (
                  <p className="text-red-500 text-sm">
                    {errors.theme.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Language */}
          <Controller
            control={control}
            name="language"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  name={field.name}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ru">Russian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
                {errors.language && (
                  <p className="text-red-500 text-sm">
                    {errors.language.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Timezone */}
          <Controller
            control={control}
            name="timezone"
            render={({ field }) => (
              <div className="flex flex-col gap-2 col-span-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  name={field.name}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent className="w-full">
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      America/Chicago
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      America/Los Angeles
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.timezone && (
                  <p className="text-red-500 text-sm">
                    {errors.timezone.message}
                  </p>
                )}
              </div>
            )}
          />

          <Button
            type="submit"
            className="col-span-2"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
