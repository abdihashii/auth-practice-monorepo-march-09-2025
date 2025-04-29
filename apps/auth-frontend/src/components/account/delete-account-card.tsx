import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import DeleteAccountWarningDialog from './delete-account-warning-dialog';

export default function DeleteAccountCard() {
  const [isDeleteWarningDialogOpen, setIsDeleteWarningDialogOpen] = useState(false);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end border-t px-6">
        <Button
          type="button"
          className="gap-2 hover:cursor-pointer hover:bg-destructive/60 text-foreground bg-destructive/50 w-[150px]"
          onClick={() => setIsDeleteWarningDialogOpen(true)}
          aria-label="Delete account"
        >
          <Trash2Icon className="h-4 w-4" />
          Delete Account
        </Button>
      </CardFooter>

      {isDeleteWarningDialogOpen && (
        <DeleteAccountWarningDialog
          isOpen={isDeleteWarningDialogOpen}
          onClose={() => setIsDeleteWarningDialogOpen(false)}
        />
      )}
    </Card>
  );
}
