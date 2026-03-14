'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface UserRow {
  id: string;
  nama: string;
  email: string;
  role: 'admin' | 'amil' | 'supervisor' | 'user';
  status_aktif: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ nama: '', email: '', password: '', role: 'amil' as 'admin' | 'amil' | 'supervisor' | 'user' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Only admin can access
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/');
    }
  }, [profile, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (fetchError) {
      setError(`Gagal memuat data user: ${fetchError.message}`);
    } else if (data) {
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!form.nama || !form.email || !form.password) {
      setError('Nama, email, dan password wajib diisi.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      // 1. Create auth user via Supabase (from client - will use admin function or invite)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { nama: form.nama, role: form.role },
        }
      });

      if (authError) {
        setError(`Gagal membuat akun: ${authError.message}`);
        setSaving(false);
        return;
      }

      if (authData.user) {
        // 2. Insert into users table
        const { error: insertError } = await supabase.from('users').insert([{
          id: authData.user.id,
          nama: form.nama,
          email: form.email,
          role: form.role,
          status_aktif: true,
          created_by: profile?.id,
        }]);

        if (insertError) {
          setError(`Akun auth berhasil, tetapi gagal menyimpan profil: ${insertError.message}`);
          setSaving(false);
          return;
        }
      }

      setSaving(false);
      setShowModal(false);
      setForm({ nama: '', email: '', password: '', role: 'amil' });
      setSuccessMsg('User berhasil dibuat!');
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      setSaving(false);
    }
  };

  const toggleUserStatus = async (user: UserRow) => {
    const action = user.status_aktif ? 'menonaktifkan' : 'mengaktifkan';
    if (!window.confirm(`Apakah Anda yakin ingin ${action} user ${user.nama}?`)) return;

    const { error: updateError } = await supabase
      .from('users')
      .update({ status_aktif: !user.status_aktif })
      .eq('id', user.id);

    if (updateError) {
      setError(`Gagal ${action} user: ${updateError.message}`);
    } else {
      fetchUsers();
    }
  };

  const roleLabel = (r: string) => {
    const map: Record<string, string> = { admin: 'Admin', amil: 'Amil', supervisor: 'Supervisor', user: 'User' };
    return map[r] || r;
  };

  const roleColor = (r: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-400',
      amil: 'bg-blue-500/10 text-blue-400',
      supervisor: 'bg-purple-500/10 text-purple-400',
      user: 'bg-green-500/10 text-green-400',
    };
    return colors[r] || 'bg-slate-500/10 text-slate-400';
  };

  if (profile?.role !== 'admin') return null;

  return (
    <>
      <Header title="Kelola User" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-5xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight">Manajemen User</h1>
              <p className="text-slate-500 dark:text-slate-400">Buat dan kelola akun amil, supervisor, dan admin.</p>
            </div>
            <button onClick={() => { setShowModal(true); setError(''); }} className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Buat User Baru
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
              <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-base">close</span></button>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              {successMsg}
            </div>
          )}

          <div className="overflow-x-auto bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10 shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat data...
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                <span className="material-symbols-outlined text-4xl">person_off</span>
                <p>Belum ada user terdaftar.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-primary/10 border-b border-slate-200 dark:border-primary/20">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nama</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-primary/10">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{u.nama}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${roleColor(u.role)}`}>{roleLabel(u.role)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${u.status_aktif ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {u.status_aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => toggleUserStatus(u)} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all" title={u.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}>
                          <span className="material-symbols-outlined text-xl">{u.status_aktif ? 'person_off' : 'person'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-background-dark rounded-2xl border border-primary/20 shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-200 dark:border-primary/20 flex items-center justify-between">
              <h3 className="text-xl font-bold">Buat User Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
              )}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</span>
                <input type="text" value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary" placeholder="Nama lengkap..." />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary" placeholder="email@example.com" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary" placeholder="Minimal 6 karakter" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary">
                  <option value="amil">Amil</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </label>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-primary/20 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-primary/20 text-sm font-bold hover:bg-slate-100 dark:hover:bg-primary/10">Batal</button>
              <button onClick={handleCreateUser} disabled={saving} className="px-5 py-2.5 rounded-lg bg-primary text-background-dark text-sm font-bold hover:brightness-110 disabled:opacity-50">
                {saving ? 'Membuat...' : 'Buat User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
