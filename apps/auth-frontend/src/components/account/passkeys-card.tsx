import { KeyRoundIcon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PasskeysCard() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Passkeys</CardTitle>
        <CardDescription>
          Manage your passkeys
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <KeyRoundIcon className="h-6 w-6 text-muted-foreground" />
          <div className="flex flex-col">
            <p className="text-sm text-muted-foreground">
              Passkeys offer a secure, passwordless way to sign in.
            </p>
            <p className="text-sm text-muted-foreground">
              This feature is currently in development.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
