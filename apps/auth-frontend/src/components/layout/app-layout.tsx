'use client';

import type React from 'react';

import { useState } from 'react';

import { Header } from '@/components/layout/header';
import { NavigationSidebar } from '@/components/layout/navigation-sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Navigation Sidebar */}
      <div className="w-64 shrink-0">
        <NavigationSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Content Area */}
        <main
          className="flex-1 overflow-auto px-4 pt-4 pb-20 md:px-6 md:pt-6"
        >
          <div className="max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
