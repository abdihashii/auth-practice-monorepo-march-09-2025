import { LockKeyholeIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { Button } from '../ui/button';

export default function TwoFactorAuthenticationCard() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Manage your two-factor authentication settings to add an extra layer
          of security to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preferred 2FA Method Section */}
        <div>
          <h3 className="text-lg font-medium">Preferred 2FA Method</h3>
          <p className="text-sm text-muted-foreground">
            Set your preferred method to use two-factor authentication when
            signing in.
          </p>
          <Select disabled>
            <SelectTrigger className="mt-2 w-[280px]">
              <SelectValue placeholder="Select preferred method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="authenticator">Authenticator app</SelectItem>
              <SelectItem value="security_key">Security key</SelectItem>
              <SelectItem value="email">Emailed code</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            This feature is currently in development.
          </p>
        </div>

        <Separator />

        {/* Two-Factor Methods Section */}
        <div>
          <h3 className="text-lg font-medium">Two-Factor Methods</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Add and manage your available two-factor authentication methods.
          </p>
          <div className="space-y-4">
            {/* Authenticator App */}
            <div
              className="flex items-center justify-between rounded-md border p-4"
            >
              <div className="flex items-center gap-3">
                <LockKeyholeIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Authenticator app</p>
                  <p className="text-sm text-muted-foreground">
                    Use an app like Google Authenticator or Authy.
                  </p>
                </div>
              </div>
              <Button
                className="w-[90px]"
                variant="outline"
                disabled
              >
                Set up
              </Button>
            </div>

            {/* Security Keys */}
            <div
              className="flex items-center justify-between rounded-md border p-4"
            >
              <div className="flex items-center gap-3">
                <LockKeyholeIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Security keys</p>
                  <p className="text-sm text-muted-foreground">
                    Use a physical security key (e.g., YubiKey).
                  </p>
                </div>
              </div>
              <Button
                className="w-[90px]"
                variant="outline"
                disabled
              >
                Add key
              </Button>
            </div>

            {/* Emailed Code */}
            <div
              className="flex items-center justify-between rounded-md border p-4"
            >
              <div className="flex items-center gap-3">
                <LockKeyholeIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Emailed code</p>
                  <p className="text-sm text-muted-foreground">
                    Receive a code via email.
                  </p>
                </div>
              </div>
              <Button
                className="w-[90px]"
                variant="outline"
                disabled
              >
                Enable
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This feature is currently in development.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
