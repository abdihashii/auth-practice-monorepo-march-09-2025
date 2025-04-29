import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { deleteUser } from '@/api/user-apis';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthContext } from '@/hooks/use-auth-context';

export default function DeleteAccountWarningDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    try {
      await deleteUser(user.id);
      toast.success('Account deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['user'] });
      onClose();
    } catch (error) {
      toast.error('Failed to delete account', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete your account?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="hover:cursor-pointer"
            aria-label="Cancel delete account"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="hover:cursor-pointer bg-destructive/50 text-foreground hover:bg-destructive/60 border-none"
            onClick={handleDeleteAccount}
            aria-label="Confirm delete account"
          >
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
