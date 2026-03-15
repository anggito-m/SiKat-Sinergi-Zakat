'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isLandingPage = pathname === '/';
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Redirect to login if trying to access private page while not logged in
    if (!loading && !user && !isAuthPage && !isLandingPage) {
      router.replace('/login');
    }
    // Redirect to home if trying to access login while already logged in
    if (!loading && user && isAuthPage) {
      router.replace('/');
    }
  }, [loading, user, pathname, router, isAuthPage, isLandingPage]);

  // Show full-screen spinner ONLY when truly unknown (no cache, no session yet)
  if (loading && !profile && !isLandingPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 bg-primary rounded-xl flex items-center justify-center animate-pulse shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-2xl text-background-dark">payments</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">Memuat SiKat...</p>
        </div>
      </div>
    );
  }

  // Auth pages (Login/Register) render without sidebar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Landing Page when not logged in renders without sidebar
  if (isLandingPage && !user && !loading) {
    return <>{children}</>;
  }

  // Not logged in and not loading — don't render anything (redirect will happen)
  if (!loading && !user && !isLandingPage) {
    return null;
  }

  // Authenticated (including Dashboard on /) — render full app layout
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - responsive */}
      <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header Toggle */}
        <header className="lg:hidden h-16 shrink-0 border-b border-slate-200 dark:border-primary/20 flex items-center px-4 bg-background-light dark:bg-background-dark">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="ml-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">payments</span>
            <span className="text-xl font-bold tracking-tight">SiKat</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* Internal Footer - Credit to Anggito Muhammad Amien */}
        <footer className="shrink-0 py-3 px-6 bg-white/50 dark:bg-background-dark/50 backdrop-blur-sm border-t border-slate-200 dark:border-primary/10 flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <span>© 2026 SIKAT</span>
            <div className="hidden md:block w-px h-2 bg-slate-300 dark:bg-slate-700"></div>
            <span>DEVELOPED BY <span className="text-primary">ANGGITO MUHAMMAD AMIEN</span></span>
          </div>
          <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <a href="https://github.com/anggito-m" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              GITHUB
            </a>
            <a href="https://linkedin.com/in/anggito-muhammad-amien" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
              LINKEDIN
            </a>
          </div>
        </footer>

        {/* Floating AI Button (Mobile) */}
        <a href="/ai-chat" className="fixed bottom-6 right-6 lg:hidden size-14 bg-primary text-background-dark rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 z-50">
          <span className="material-symbols-outlined text-3xl">smart_toy</span>
        </a>
      </main>
    </div>
  );
}
