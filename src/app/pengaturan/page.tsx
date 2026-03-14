'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface ConfigItem { id: string; key: string; value: string; updated_at: string; }

const CONFIG_LABELS: Record<string, string> = {
  'nisab_maal_emas_gr': 'Nisab Zakat Mal Emas (gr)',
  'harga_emas_per_gram': 'Harga Emas per Gram (Rp)',
  'harga_beras_per_kg': 'Harga Beras per Kg (Rp)',
  'nilai_sha_kg': "Nilai 1 Sha' (Kg)",
  'tahun_hijriah': 'Tahun Hijriah Aktif',
};

export default function PengaturanPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && profile && profile.role === 'amil') {
      router.replace('/');
    }
  }, [profile, authLoading, router]);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('config').select('*').order('key');
    if (data) setConfigs(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  const startEdit = (c: ConfigItem) => { setEditKey(c.key); setEditValue(c.value); };
  const cancelEdit = () => { setEditKey(null); setEditValue(''); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    setError('');
    const { error: e } = await supabase.from('config').update({ value: editValue, updated_at: new Date().toISOString() }).eq('id', id);
    setSaving(false);
    if (e) {
      setError(`Gagal menyimpan: ${e.message}`);
    } else {
      setEditKey(null);
      fetchConfigs();
    }
  };

  const fmt = (key: string, value: string) => {
    if (key === 'tahun_hijriah') return value;
    const n = parseFloat(value);
    if (isNaN(n)) return value;

    if (key.startsWith('harga_') || key.endsWith('_rp')) {
      return `Rp ${n.toLocaleString('id-ID')}`;
    }
    if (key.endsWith('_kg')) return `${n.toLocaleString('id-ID')} Kg`;
    if (key.endsWith('_gr')) return `${n.toLocaleString('id-ID')} gr`;
    return `Rp ${n.toLocaleString('id-ID')}`;
  };

  return (
    <>
      <Header title="Pengaturan" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-3xl mx-auto w-full">
          <div className="space-y-2 mb-8">
            <h1 className="text-3xl font-bold">Pengaturan Konfigurasi</h1>
            <p className="text-slate-500 dark:text-slate-400">Atur nilai nisab, harga emas, dan parameter zakat lainnya.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
              <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-base">close</span></button>
            </div>
          )}

          <div className="bg-white dark:bg-primary/5 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500"><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat...</div>
            ) : configs.length === 0 ? (
              <div className="py-20 text-center text-slate-500">Belum ada konfigurasi. Jalankan migration SQL terlebih dahulu.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-primary/10">
                {configs.map(c => (
                  <div key={c.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-sm">{CONFIG_LABELS[c.key] || c.key}</p>
                      <p className="text-xs text-slate-500 font-mono">{c.key}</p>
                    </div>
                    {editKey === c.key ? (
                      <div className="flex items-center gap-2">
                        <input value={editValue} onChange={e => setEditValue(e.target.value)} className="rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-10 px-4 w-48 focus:border-primary focus:ring-primary" />
                        <button onClick={() => saveEdit(c.id)} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-background-dark text-sm font-bold hover:brightness-110 disabled:opacity-50">Simpan</button>
                        <button onClick={cancelEdit} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-primary/20 text-sm font-bold hover:bg-slate-100 dark:hover:bg-primary/10">Batal</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-primary">{fmt(c.key, c.value)}</span>
                        <button onClick={() => startEdit(c)} className="p-2 rounded-lg hover:bg-primary/20 text-slate-400 hover:text-primary transition-all">
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
