'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { useAuth } from '@/lib/auth-context';

interface Muzakki {
  id: string;
  nama_kk: string;
  nama_kepala_keluarga: string;
  no_kk: string;
  jumlah_anggota: number;
  rt: string;
  rw: string;
  telepon: string;
  status_aktif: boolean;
}

const emptyForm: Omit<Muzakki, 'id' | 'status_aktif'> = {
  nama_kk: '', nama_kepala_keluarga: '', no_kk: '', jumlah_anggota: 1, rt: '', rw: '', telepon: ''
};

export default function MuzakkiPage() {
  const { profile, muzakkiId, loading: authLoading } = useAuth();
  const isUser = profile?.role === 'user';
  const [data, setData] = useState<Muzakki[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRT, setFilterRT] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (authLoading || !profile) return;
    if (isUser && !muzakkiId) { setLoading(false); return; }
    
    setLoading(true);
    let query = supabase.from('muzakki').select('*').eq('status_aktif', true);
    if (isUser && muzakkiId) {
      query = query.eq('id', muzakkiId);
    }
    const { data: rows, error } = await query.order('created_at', { ascending: false });
    if (!error && rows) setData(rows);
    setLoading(false);
  }, [isUser, muzakkiId, authLoading, profile]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.nama_kk.toLowerCase().includes(q) || m.nama_kepala_keluarga.toLowerCase().includes(q) || m.no_kk.includes(q);
    const matchRT = !filterRT || m.rt === filterRT;
    return matchSearch && matchRT;
  });

  const rtOptions = [...new Set(data.map(m => m.rt).filter(Boolean))].sort();

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m: Muzakki) => {
    setEditingId(m.id);
    setForm({ nama_kk: m.nama_kk, nama_kepala_keluarga: m.nama_kepala_keluarga, no_kk: m.no_kk, jumlah_anggota: m.jumlah_anggota, rt: m.rt, rw: m.rw, telepon: m.telepon });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    let err = null;
    if (editingId) {
      const { error } = await supabase.from('muzakki').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editingId);
      err = error;
    } else {
      const { error } = await supabase.from('muzakki').insert([{ ...form, status_aktif: true }]);
      err = error;
    }
    
    if (err) {
      alert(`Gagal menyimpan: ${err.message}`);
      console.error(err);
    }
    
    setSaving(false);
    setShowModal(false);
    fetchData();
  };

  const toggleStatus = async (m: Muzakki) => {
    if (!window.confirm(`Apakah Anda yakin ingin menonaktifkan muzakki ${m.nama_kk}?`)) return;
    const { error: e } = await supabase.from('muzakki').update({ status_aktif: !m.status_aktif, updated_at: new Date().toISOString() }).eq('id', m.id);
    if (e) {
      alert(`Gagal menonaktifkan: ${e.message}`);
    }
    fetchData();
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        const mapped = rows.map(r => ({
          nama_kk: r['nama_kk'] || r['Nama KK'] || '',
          nama_kepala_keluarga: r['nama_kepala_keluarga'] || r['Kepala Keluarga'] || '',
          no_kk: r['no_kk'] || r['No KK'] || '',
          jumlah_anggota: parseInt(r['jumlah_anggota'] || r['Anggota'] || '1') || 1,
          rt: r['rt'] || r['RT'] || '',
          rw: r['rw'] || r['RW'] || '',
          telepon: r['telepon'] || r['Telepon'] || '',
          status_aktif: true,
        })).filter(r => r.nama_kk && r.nama_kepala_keluarga);
        if (mapped.length) {
          const { error: e } = await supabase.from('muzakki').insert(mapped);
          if (e) {
            alert(`Gagal import CSV: ${e.message}`);
          }
          fetchData();
        } else {
          alert('CSV tidak berisi data valid. Pastikan kolom "Nama KK" dan "Kepala Keluarga" terisi.');
        }
        if (fileRef.current) fileRef.current.value = '';
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ['Nama KK', 'Kepala Keluarga', 'No KK', 'Anggota', 'RT', 'RW', 'Telepon'];
    const sample = ['Keluarga Bpk. Budi', 'Budi Santoso', '3201012345678901', '4', '01', '02', '081234567890'];
    const csvContent = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_muzakki.csv';
    link.click();
  };

  return (
    <>
      <Header title="Database Muzakki" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-7xl mx-auto w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight">Database Muzakki</h1>
              <p className="text-slate-500 dark:text-slate-400">Kelola data pemberi zakat di wilayah tugas Anda secara efisien.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {!isUser && (
                <>
                  <button onClick={downloadTemplate} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-primary font-bold text-sm border border-slate-200 dark:border-primary/30 hover:bg-primary/20 transition-all">
                    <span className="material-symbols-outlined text-lg">download</span>
                    Template CSV
                  </button>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
                  <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-primary font-bold text-sm border border-slate-200 dark:border-primary/30 hover:bg-primary/20 transition-all">
                    <span className="material-symbols-outlined text-lg">upload_file</span>
                    Import CSV
                  </button>
                  <button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all">
                    <span className="material-symbols-outlined text-lg">person_add</span>
                    Tambah Muzakki
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Cari Nama, No. KK..." type="text"/>
              </div>
              <select value={filterRT} onChange={e => setFilterRT(e.target.value)} className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 focus:ring-2 focus:ring-primary outline-none min-w-[140px]">
                <option value="">Semua RT</option>
                {rtOptions.map(rt => <option key={rt} value={rt}>RT {rt}</option>)}
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10 shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat data...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
                <span className="material-symbols-outlined text-4xl">person_off</span>
                <p>Belum ada data muzakki. Klik &quot;Tambah Muzakki&quot; atau &quot;Import CSV&quot; untuk memulai.</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-primary/10 border-b border-slate-200 dark:border-primary/20">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nama KK</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Kepala Keluarga</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">No. KK</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Anggota</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">RT/RW</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Telepon</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-primary/10">
                    {filtered.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors group">
                        <td className="px-6 py-4"><span className="font-bold text-primary group-hover:underline">{m.nama_kk}</span></td>
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{m.nama_kepala_keluarga}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{m.no_kk}</td>
                        <td className="px-6 py-4 text-center"><span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-primary/20 text-xs font-bold">{m.jumlah_anggota}</span></td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">RT {m.rt}{m.rw ? ` / RW ${m.rw}` : ''}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{m.telepon || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-primary/20 text-slate-400 hover:text-primary transition-all" title="Edit">
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            {!isUser && (
                              <button onClick={() => toggleStatus(m)} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all" title="Nonaktifkan">
                                <span className="material-symbols-outlined text-xl">person_off</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-slate-200 dark:border-primary/20 text-sm text-slate-500">
                  Menampilkan {filtered.length} dari {data.length} Muzakki
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-background-dark rounded-2xl border border-primary/20 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-primary/20 flex items-center justify-between">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Muzakki' : 'Tambah Muzakki Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {([
                ['nama_kk', 'Nama KK', 'text'],
                ['nama_kepala_keluarga', 'Nama Kepala Keluarga', 'text'],
                ['no_kk', 'Nomor KK', 'text'],
                ['jumlah_anggota', 'Jumlah Anggota Keluarga', 'number'],
                ['rt', 'RT', 'text'],
                ['rw', 'RW', 'text'],
                ['telepon', 'Telepon', 'text'],
              ] as const).map(([key, label, type]) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))}
                    className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 focus:border-primary focus:ring-primary h-11 px-4"
                  />
                </label>
              ))}
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-primary/20 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-primary/20 text-sm font-bold hover:bg-slate-100 dark:hover:bg-primary/10 transition-all">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.nama_kk || !form.nama_kepala_keluarga} className="px-5 py-2.5 rounded-lg bg-primary text-background-dark text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
