'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Email atau password salah. Silakan coba lagi.');
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Email belum diverifikasi. Periksa kotak masuk Anda.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Navigate instantly without full page reload
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>

      {/* Back Button */}
      <a href="/" className="absolute top-8 left-4 sm:left-8 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group z-10">
        <div className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/10 flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </div>
        <span className="text-sm font-bold">
          Kembali<span className="hidden sm:inline"> ke Landing Page</span>
        </span>
      </a>

      <div className="w-full max-w-md relative z-10 flex flex-col pt-32 sm:pt-0">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-4xl text-background-dark font-bold">payments</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">SiKat</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Sinergi Zakat</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-primary/10 shadow-xl p-8">
          <h2 className="text-xl font-bold mb-6">Masuk ke Dashboard</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="admin@zakatdesa.id"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-background-dark font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Memproses...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          Belum punya akun?{' '}
          <a href="/register" className="text-primary font-bold hover:underline">Daftar di sini</a>
        </p>
        <div className="text-center mt-6 py-4 border-t border-slate-200 dark:border-primary/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
            SiKat &copy; 2026 &middot; Dusun Babakan
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
            Developed by <span className="text-primary">Anggito Muhammad Amien</span>
          </p>
          <div className="flex justify-center gap-3 mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <a href="https://github.com/anggito-m" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">Github</a>
            <span className="opacity-30">&middot;</span>
            <a href="https://linkedin.com/in/anggito-muhammad-amien" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">LinkedIn</a>
          </div>
        </div>
      </div>
    </div>
  );
}
