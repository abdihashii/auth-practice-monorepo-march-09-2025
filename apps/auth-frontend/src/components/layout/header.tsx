'use client';

import { Menu } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/hooks/use-auth-context';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthContext();

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-6">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <div className="hidden md:block">
          <h1 className="text-xl font-semibold">User Management Dashboard</h1>
        </div>

        <div className="ml-auto flex items-center space-x-4">
          {/* Search Bar -- No search support yet */}
          {/* <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-[200px] pl-8 md:w-[300px] lg:w-[400px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}

          {/* Notifications -- No notifications support yet */}
          {/* <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary"></span>
            <span className="sr-only">Notifications</span>
          </Button> */}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase()}
                    {user?.name?.charAt(1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal hov">
                <div className="flex flex-col space-y-1">
                  {user?.name && (
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                  )}
                  <p className="text-xs leading-none text-muted-foreground overflow-hidden text-ellipsis">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              {/* <DropdownMenuSeparator /> */}
              {/* <DropdownMenuItem asChild>
                <Link to="/account">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem> */}
              {/* <DropdownMenuItem asChild>
                <Link to="/account/preferences">
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem> */}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
