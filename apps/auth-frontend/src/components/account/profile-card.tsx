'use client';

import {
  PencilIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthContext } from '@/hooks/use-auth-context';
import { useProfileCard } from '@/hooks/use-profile-card';

export function ProfileCard() {
  const { user } = useAuthContext();
  const {
    // State
    isEditing,
    name,
    bio,

    // Handlers
    handleSubmit,
    handleProfilePictureUpload,
    handleProfilePictureRemove,
    setIsEditing,
    setName,
    setBio,
  } = useProfileCard();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Manage your personal information and how it appears on your account
        </CardDescription>

        {/* Profile Picture */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative group">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={user?.profilePicture ?? ''}
                alt={user?.name ?? 'User'}
              />
              <AvatarFallback className="text-lg">
                {user?.name
                  ? `${user.name.charAt(0).toUpperCase()}${user.name
                    .charAt(1)
                    .toUpperCase()}`
                  : 'U'}
              </AvatarFallback>
            </Avatar>
            <div
              className="absolute inset-0 flex items-center justify-center gap-1 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              {/*
                    Input is hidden from the user but is used to trigger the
                    file input when the button is clicked. This is a workaround
                    to allow us to upload a file when the user clicks the
                    button instead of using the default file input.
                  */}
              <input
                type="file"
                id="profile-picture-input"
                className="hidden"
                onChange={handleProfilePictureUpload}
              />
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full hover:cursor-pointer"
                onClick={() => {
                  const input = document.getElementById('profile-picture-input') as HTMLInputElement;
                  input.click();
                }}
                aria-label="Upload profile picture"
              >
                <UploadIcon className="h-4 w-4" />
                <span className="sr-only">Upload profile picture</span>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:cursor-pointer hover:bg-destructive/60 text-foreground bg-destructive/50"
                    aria-label="Remove profile picture"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    <span className="sr-only">Remove profile picture</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to remove your profile picture?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="hover:cursor-pointer"
                      aria-label="Cancel remove profile picture"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="hover:cursor-pointer bg-destructive/50 text-foreground hover:bg-destructive/60 border-none"
                      onClick={handleProfilePictureRemove}
                      aria-label="Confirm remove profile picture"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium">Profile Picture</h3>
            <p className="text-sm text-muted-foreground">
              Upload a photo to make your account more personalized
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Visual separator */}
      <hr />

      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">

            {/* Visual separator */}
            {/* <hr className="my-6" /> */}

            {/* User Information */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                {isEditing
                  ? (
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                      />
                    )
                  : (
                      <div className="py-2">{user?.name ?? 'Not set'}</div>
                    )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="py-2">{user?.email}</div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing
                  ? (
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Write a short bio about yourself"
                        className="min-h-24"
                      />
                    )
                  : (
                      <div className="py-2">{bio ?? 'No bio set'}</div>
                    )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          {isEditing && (
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  // Reset local state to original user values
                  setName(user?.name ?? '');
                  setBio(user?.bio ?? '');
                  setIsEditing(false); // Exit edit mode
                }}
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button type="submit" aria-label="Save changes">Save Changes</Button>
            </div>
          )}
        </form>
      </CardContent>
      {!isEditing && (
        <CardFooter className="flex justify-end border-t">
          <Button
            type="button"
            variant="outline"
            className="gap-2 hover:cursor-pointer w-[150px]"
            onClick={() => setIsEditing(true)}
            aria-label="Edit profile"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
