'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';

export default function Header({ title }: { title: string }) {
  const { profile, assignedRTs, loading } = useAuth();

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-primary/20 flex items-center justify-between px-8 bg-background-light dark:bg-background-dark">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        {/* RT Assignment Badge for Amil */}
        {profile?.role === 'amil' && assignedRTs.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
            <span className="material-symbols-outlined text-primary text-sm">location_on</span>
            <span className="text-xs font-medium text-primary">RT: {assignedRTs.join(', ')}</span>
          </div>
        )}
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-primary/20 pl-6">
          {loading || !profile ? (
            <>
              <div className="text-right space-y-1.5">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse ml-auto"></div>
              </div>
              <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
            </>
          ) : (
            <>
              <div className="text-right">
                <p className="text-sm font-bold">{profile.nama}</p>
                <p className="text-xs text-slate-500 dark:text-primary/60 capitalize">
                  {profile.role}
                  {profile.role === 'amil' && assignedRTs.length > 0 ? ` · RT ${assignedRTs.join(', ')}` : ''}
                </p>
              </div>
              <div className="size-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-sm font-bold text-primary">
                {profile.nama.charAt(0).toUpperCase()}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
