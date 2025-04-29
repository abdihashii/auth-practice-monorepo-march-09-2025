import { Button } from '../ui/button';
import {
  Card,
  // CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';

export default function DeleteAccountCard() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      {/* <CardContent>
        <p>
          Deleting your account will remove all of your data from our servers.
          This action is irreversible.
        </p>
      </CardContent> */}
      <CardFooter className="flex justify-end border-t px-6">
        <Button variant="destructive">Delete Account</Button>
      </CardFooter>
    </Card>
  );
}
