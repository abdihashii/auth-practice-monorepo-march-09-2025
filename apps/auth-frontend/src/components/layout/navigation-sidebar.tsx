'use client';

import { Link, useLocation } from '@tanstack/react-router';
import { LockIcon, SlidersIcon, UserIcon } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function NavigationSidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  // const adminNavItems = [
  //   { href: '/dashboard', label: 'Dashboard', icon: Home },
  //   { href: '/users', label: 'Users', icon: Users },
  //   { href: '/analytics', label: 'Analytics', icon: BarChart },
  // ];

  const accountNavItems = [
    { href: '/account', label: 'Profile', icon: UserIcon },
    { href: '/account/security', label: 'Security', icon: LockIcon },
    { href: '/account/preferences', label: 'Preferences', icon: SlidersIcon },
  ];

  const sidebarClasses = cn(
    'h-full flex flex-col border-r bg-background',
  );

  return (

    <aside className={sidebarClasses}>
      <div className="flex h-16 items-center border-b px-4">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold">Roll Your Own Auth</span>
        </Link>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-6">
          {/* Admin Navigation Items */}
          {/* <div>
            <h3 className="mb-2 px-4 text-sm font-semibold text-muted-foreground">Admin</h3>
            <nav className="space-y-1">
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div> */}

          <div>
            <h3 className="mb-2 px-4 text-sm font-semibold text-muted-foreground">Account Settings</h3>
            <nav className="space-y-1">
              {accountNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium',
                    pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    item.href === '/account/delete' && 'text-destructive hover:text-destructive',
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </ScrollArea>

      {/* <div className="border-t p-4">
          <Link
            to="/help"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help & Support
          </Link>
        </div> */}
    </aside>
  );
}
