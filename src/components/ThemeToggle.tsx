'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:bg-primary/10 text-slate-500 dark:text-slate-400 hover:text-primary ${collapsed ? 'justify-center' : ''
        }`}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      <span className="material-symbols-outlined transition-transform duration-500 hover:rotate-45">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
      {!collapsed && (
        <span className="text-sm font-medium">
          {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
        </span>
      )}
    </button>
  );
}
