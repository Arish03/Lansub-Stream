'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

import { useAuth } from '@/lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { token, isLoading } = useAuth();
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/landing';

  if (isAuthPage) {
    return <main className="w-full min-h-screen">{children}</main>;
  }

  // If verifying session or unauthenticated on protected routes, show clean loader while auth redirects
  if (isLoading || !token) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 animate-pulse">
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
