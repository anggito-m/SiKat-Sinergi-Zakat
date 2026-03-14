'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface AmilUser {
  id: string;
  nama: string;
  email: string;
  role: string;
}

interface Assignment {
  id: string;
  amil_id: string;
  rt: string;
  rw: string;
  assigned_at: string;
  amil: { nama: string } | null;
}

export default function PenugasanPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [amilList, setAmilList] = useState<AmilUser[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmil, setSelectedAmil] = useState('');
  const [rt, setRt] = useState('');
  const [rw, setRw] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      router.replace('/');
    }
  }, [profile, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: amils, error: amilError } = await supabase
      .from('users')
      .select('id, nama, email, role')
      .eq('role', 'amil')
      .eq('status_aktif', true)
      .order('nama');
    if (amilError) setError(`Gagal memuat amil: ${amilError.message}`);
    if (amils) setAmilList(amils);

    const { data: assigns, error: assignError } = await supabase
      .from('amil_rt_assignments')
      .select('*, amil:users!amil_id(nama)')
      .order('assigned_at', { ascending: false });
    if (assignError) setError(`Gagal memuat penugasan: ${assignError.message}`);
    if (assigns) setAssignments(assigns as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async () => {
    if (!selectedAmil || !rt) {
      setError('Pilih amil dan masukkan RT.');
      return;
    }

    // Check for duplicate
    const exists = assignments.find(a => a.amil_id === selectedAmil && a.rt === rt);
    if (exists) {
      setError(`Amil ini sudah ditugaskan di RT ${rt}.`);
      return;
    }

    setSaving(true);
    setError('');
    const { error: insertError } = await supabase.from('amil_rt_assignments').insert([{
      amil_id: selectedAmil,
      rt,
      rw: rw || null,
      assigned_by: profile?.id,
    }]);

    if (insertError) {
      setError(`Gagal menyimpan penugasan: ${insertError.message}`);
    } else {
      setSuccessMsg('Penugasan berhasil disimpan!');
      setSelectedAmil('');
      setRt('');
      setRw('');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 3000);
    }
    setSaving(false);
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Hapus penugasan RT ini?')) return;
    const { error: delError } = await supabase.from('amil_rt_assignments').delete().eq('id', id);
    if (delError) {
      setError(`Gagal menghapus: ${delError.message}`);
    } else {
      fetchData();
    }
  };

  if (profile?.role !== 'admin') return null;

  return (
    <>
      <Header title="Penugasan Amil" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Penugasan RT untuk Amil</h1>
            <p className="text-slate-500 dark:text-slate-400">Tentukan wilayah RT yang ditugaskan kepada masing-masing amil.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
              <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-base">close</span></button>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">check_circle</span>
              {successMsg}
            </div>
          )}

          {/* Assignment Form */}
          <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              Tambah Penugasan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select value={selectedAmil} onChange={e => setSelectedAmil(e.target.value)} className="md:col-span-2 rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary">
                <option value="">Pilih Amil...</option>
                {amilList.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
              </select>
              <input type="text" value={rt} onChange={e => setRt(e.target.value)} className="rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary" placeholder="RT (mis: 01)" />
              <input type="text" value={rw} onChange={e => setRw(e.target.value)} className="rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary" placeholder="RW (opsional)" />
            </div>
            <button onClick={handleAssign} disabled={saving || !selectedAmil || !rt} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-background-dark rounded-lg font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all">
              <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
              {saving ? 'Menyimpan...' : 'Tugaskan'}
            </button>
          </div>

          {/* Assignment List */}
          <div className="bg-white dark:bg-primary/5 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-primary/10">
              <h3 className="font-bold text-lg">Daftar Penugasan Aktif</h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat...
              </div>
            ) : assignments.length === 0 ? (
              <div className="py-16 text-center text-slate-500">Belum ada penugasan RT.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-primary/10 border-b border-slate-200 dark:border-primary/20">
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Amil</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">RT</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">RW</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
                    <th className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-primary/10">
                  {assignments.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4 font-bold">{(a.amil as any)?.nama || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-xs font-bold text-primary">RT {a.rt}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{a.rw || '-'}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{new Date(a.assigned_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleRemove(a.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all" title="Hapus penugasan">
                          <span className="material-symbols-outlined text-xl">delete</span>
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
    </>
  );
}
