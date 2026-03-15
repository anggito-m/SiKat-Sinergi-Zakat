'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import React from 'react';
import ThemeToggle from './ThemeToggle';

const allNavItems = [
  { href: '/', label: 'Beranda', icon: 'dashboard', roles: ['admin', 'amil', 'supervisor', 'user'] },
  { href: '/muzakki', label: 'Muzakki', icon: 'groups', roles: ['admin', 'amil', 'supervisor', 'user'] },
  { href: '/mustahiq', label: 'Mustahiq', icon: 'volunteer_activism', roles: ['admin', 'amil', 'supervisor'] },
];

const allLayananItems = [
  { href: '/zakat-fitrah', label: 'Zakat Fitrah', icon: 'savings', roles: ['admin', 'amil', 'supervisor', 'user'] },
  { href: '/zakat-mal', label: 'Zakat Mal', icon: 'account_balance', roles: ['admin', 'amil', 'supervisor', 'user'] },
  { href: '/infaq', label: 'Infaq', icon: 'favorite', roles: ['admin', 'amil', 'supervisor', 'user'] },
  { href: '/distribusi', label: 'Distribusi', icon: 'local_shipping', roles: ['admin', 'amil', 'supervisor'] },
  { href: '/riwayat-transaksi', label: 'Riwayat Transaksi', icon: 'receipt_long', roles: ['admin', 'amil', 'supervisor', 'user'] },
];

const allSistemItems = [
  { href: '/ai-chat', label: 'AI Asisten', icon: 'smart_toy', roles: ['admin', 'amil', 'supervisor', 'user'] },
  { href: '/laporan', label: 'Laporan', icon: 'bar_chart', roles: ['admin', 'supervisor'] },
  { href: '/pengaturan', label: 'Pengaturan', icon: 'settings', roles: ['admin', 'supervisor'] },
];

const adminItems = [
  { href: '/admin/users', label: 'Kelola User', icon: 'manage_accounts' },
  { href: '/admin/penugasan', label: 'Penugasan Amil', icon: 'assignment_ind' },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const role = profile?.role || 'user';

  const handleLogout = async () => {
    console.log('Logout button clicked');
    try {
      await signOut();
      console.log('Sign out successful');
      // No explicit router.replace('/login') here because AppShell 
      // already handles redirection when user is null.
    } catch(e) {
      console.error('Sign out failed:', e);
      // Fallback redirect just in case
      router.replace('/login');
    }
  };

  const filterByRole = (items: { href: string; label: string; icon: string; roles: string[] }[]) =>
    items.filter(item => item.roles.includes(role));

  const renderLink = (item: { href: string; label: string; icon: string }) => {
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
          ? 'bg-primary text-background-dark font-semibold'
          : 'hover:bg-primary/10'
          }`}
      >
        <span className={`material-symbols-outlined ${isActive ? '' : 'text-primary'}`}>{item.icon}</span>
        <span>{item.label}</span>
      </Link>
    );
  };

  const isAdmin = role === 'admin';
  const navItems = filterByRole(allNavItems);
  const layananItems = filterByRole(allLayananItems);
  const sistemItems = filterByRole(allSistemItems);

  return (
    <aside className="w-64 h-full shrink-0 bg-background-light dark:bg-background-dark border-r border-slate-200 dark:border-primary/20 flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded flex items-center justify-center text-background-dark">
            <span className="material-symbols-outlined font-bold">payments</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">SiKat</h1>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map(renderLink)}

        {layananItems.length > 0 && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Layanan</div>
            {layananItems.map(renderLink)}
          </>
        )}

        {sistemItems.length > 0 && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistem</div>
            {sistemItems.map(renderLink)}
          </>
        )}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</div>
            {adminItems.map(renderLink)}
          </>
        )}

        <div className="pt-8 pb-4 space-y-2">
          <ThemeToggle />
          <button
            id="logout-button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Keluar
          </button>
        </div>
      </nav>
      {profile && (
        <div className="p-4 border-t border-slate-200 dark:border-primary/10">
          <div className="px-2">
            <p className="text-sm font-bold truncate">{profile.nama}</p>
            <p className="text-xs text-slate-500 dark:text-primary/60 capitalize">{profile.role}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
