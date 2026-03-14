'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nama_kk: '',
    nama_kepala_keluarga: '',
    rt: '',
    rw: '',
    jumlah_anggota: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = account, 2 = data muzakki

  const handleNext = () => {
    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_kk || !form.nama_kepala_keluarga || !form.rt || !form.rw) {
      setError('Semua data wajib diisi.');
      return;
    }
    if (form.jumlah_anggota < 1) {
      setError('Jumlah anggota minimal 1.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create auth user with all metadata for the trigger
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nama: form.nama_kk,
            role: 'user',
            nama_kepala_keluarga: form.nama_kepala_keluarga,
            rt: form.rt,
            rw: form.rw,
            jumlah_anggota: form.jumlah_anggota
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Email sudah terdaftar. Silakan login.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Success → if user is present, redirection logic
      if (authData.user) {
        // If email confirmation is off, navigate to home. 
        // If on, show message. For dev, we assume confirmation might be needed or handled.
        if (authData.session) {
          router.push('/');
        } else {
          setError('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi sebelum login.');
          setLoading(false);
          return;
        }
      }

      // Success → navigate to home
      router.push('/');
    } catch (err: any) {
      setError(`Terjadi kesalahan: ${err.message}`);
    }
    setLoading(false);
  };

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full z-0 pointer-events-none"></div>

      {/* Back Button */}
      <a href="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group z-10">
        <div className="size-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-primary/10 flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </div>
        <span className="text-sm font-bold">Kembali ke Landing Page</span>
      </a>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-4xl text-background-dark font-bold">payments</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">SiKat</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Buat Akun Baru</p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-primary/10 shadow-xl p-8">
          {/* Step Indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-slate-400'}`}>
              <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-primary text-background-dark' : 'bg-slate-200 dark:bg-slate-700'}`}>1</div>
              <span className="text-sm font-medium">Akun</span>
            </div>
            <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-slate-400'}`}>
              <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-primary text-background-dark' : 'bg-slate-200 dark:bg-slate-700'}`}>2</div>
              <span className="text-sm font-medium">Data Diri</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-5">
              <h2 className="text-xl font-bold">Informasi Akun</h2>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="email@contoh.com" />
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Minimal 6 karakter" />
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Konfirmasi Password</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                  <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Ulangi password" />
                </div>
              </label>
              <button onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 bg-primary text-background-dark font-bold py-3 rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                Lanjut
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setStep(1)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-primary/10">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                </button>
                <h2 className="text-xl font-bold">Data Muzakki</h2>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Kartu Keluarga</span>
                <input type="text" value={form.nama_kk} onChange={e => set('nama_kk', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark h-11 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Nama di KK" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Kepala Keluarga</span>
                <input type="text" value={form.nama_kepala_keluarga} onChange={e => set('nama_kepala_keluarga', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark h-11 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Nama kepala keluarga" />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">RT</span>
                  <input type="text" value={form.rt} onChange={e => set('rt', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark h-11 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="01" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">RW</span>
                  <input type="text" value={form.rw} onChange={e => set('rw', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark h-11 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="01" />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Anggota</span>
                  <input type="number" min="1" value={form.jumlah_anggota} onChange={e => set('jumlah_anggota', parseInt(e.target.value) || 1)}
                    className="w-full rounded-lg border border-slate-200 dark:border-primary/20 bg-slate-50 dark:bg-background-dark h-11 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" />
                </label>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-background-dark font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20">
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Mendaftar...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Daftar
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline">Masuk di sini</Link>
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
