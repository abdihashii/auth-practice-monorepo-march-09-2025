'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

import { updateUser } from '@/api/user-apis';
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

export function ProfileCard() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Local state for form fields
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');

  // Handle profile picture updates
  const handleProfilePictureUpload = () => {
    // TODO: Implement file upload logic

    // eslint-disable-next-line no-console
    console.log('Upload profile picture');
  };

  // Handle profile picture removal
  const handleProfilePictureRemove = () => {
    // TODO: Implement removal logic

    // eslint-disable-next-line no-console
    console.log('Remove profile picture');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Ensure the user is authenticated
    if (!user?.id) {
      throw new Error('User ID is required');
    }

    try {
      // Update the user via the API
      await updateUser(user.id, { name, bio });

      // Invalidate the user query to refresh the data on successful update
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      // Reset the editing state after submission to "close" the form
      setIsEditing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Manage your personal information and how it appears on your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src="/placeholder.svg?height=96&width=96"
                    alt={user?.name || 'User'}
                  />
                  <AvatarFallback className="text-lg">
                    {user?.name
                      ? `${user.name.charAt(0).toUpperCase()}${user.name
                        .charAt(1)
                        .toUpperCase()}`
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full"
                    onClick={handleProfilePictureUpload}
                  >
                    <Upload className="h-4 w-4" />
                    <span className="sr-only">Upload profile picture</span>
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8 rounded-full"
                    onClick={handleProfilePictureRemove}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove profile picture</span>
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a photo to make your account more personalized
                </p>
              </div>
            </div>

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
                      <div className="py-2">{user?.name || 'Not set'}</div>
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
                      <div className="py-2">{bio || 'No bio set'}</div>
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
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          )}
        </form>
      </CardContent>
      {!isEditing && (
        <CardFooter className="flex justify-end border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
