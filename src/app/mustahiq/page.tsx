'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import RoleGuard from '@/components/RoleGuard';

const ASNAF_OPTIONS = ['fakir', 'miskin', 'amil', 'mualaf', 'riqab', 'gharim', 'fisabilillah', 'ibnu_sabil'] as const;
type Asnaf = typeof ASNAF_OPTIONS[number];

interface Mustahiq {
  id: string;
  nama: string;
  no_kk: string;
  jumlah_anggota: number;
  rt: string;
  rw: string;
  kategori_asnaf: Asnaf;
  alamat: string;
  telepon: string;
  status_aktif: boolean;
}

const emptyForm = { nama: '', no_kk: '', jumlah_anggota: 1, rt: '', rw: '', kategori_asnaf: 'fakir' as Asnaf, alamat: '', telepon: '' };

export default function MustahiqPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'amil', 'supervisor']}>
      <MustahiqContent />
    </RoleGuard>
  );
}

function MustahiqContent() {
  const [data, setData] = useState<Mustahiq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAsnaf, setFilterAsnaf] = useState('');
  const [filterRT, setFilterRT] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from('mustahiq').select('*').eq('status_aktif', true).order('created_at', { ascending: false });
    if (rows) setData(rows);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.nama.toLowerCase().includes(q) || m.no_kk?.includes(q);
    const matchAsnaf = !filterAsnaf || m.kategori_asnaf === filterAsnaf;
    const matchRT = !filterRT || m.rt === filterRT;
    return matchSearch && matchAsnaf && matchRT;
  });

  const rtOptions = [...new Set(data.map(m => m.rt).filter(Boolean))].sort();

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (m: Mustahiq) => {
    setEditingId(m.id);
    setForm({ nama: m.nama, no_kk: m.no_kk, jumlah_anggota: m.jumlah_anggota, rt: m.rt, rw: m.rw, kategori_asnaf: m.kategori_asnaf, alamat: m.alamat, telepon: m.telepon });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    let err = null;
    if (editingId) {
      const { error: e } = await supabase.from('mustahiq').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editingId);
      err = e;
    } else {
      const { error: e } = await supabase.from('mustahiq').insert([{ ...form, status_aktif: true }]);
      err = e;
    }
    if (err) {
      setError(`Gagal menyimpan: ${err.message}`);
      console.error(err);
    } else {
      setShowModal(false);
    }
    setSaving(false);
    fetchData();
  };

  const toggleStatus = async (m: Mustahiq) => {
    if (!window.confirm(`Apakah Anda yakin ingin menonaktifkan mustahiq ${m.nama}?`)) return;
    const { error: e } = await supabase.from('mustahiq').update({ status_aktif: false, updated_at: new Date().toISOString() }).eq('id', m.id);
    if (e) {
      setError(`Gagal menonaktifkan: ${e.message}`);
    }
    fetchData();
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        const mapped = rows.map(r => ({
          nama: r['nama'] || r['Nama'] || '',
          no_kk: r['no_kk'] || r['No KK'] || '',
          jumlah_anggota: parseInt(r['jumlah_anggota'] || r['Anggota'] || '1') || 1,
          rt: r['rt'] || r['RT'] || '',
          rw: r['rw'] || r['RW'] || '',
          kategori_asnaf: (r['kategori_asnaf'] || r['Asnaf'] || 'fakir').toLowerCase() as Asnaf,
          alamat: r['alamat'] || r['Alamat'] || '',
          telepon: r['telepon'] || r['Telepon'] || '',
          status_aktif: true,
        })).filter(r => r.nama);
        if (mapped.length) {
          const { error: e } = await supabase.from('mustahiq').insert(mapped);
          if (e) {
            setError(`Gagal import CSV: ${e.message}`);
          }
          fetchData();
        } else {
          setError('CSV tidak berisi data valid. Pastikan kolom "Nama" terisi.');
        }
        if (fileRef.current) fileRef.current.value = '';
      }
    });
  };

  const downloadTemplate = () => {
    const headers = ['Nama', 'No KK', 'Anggota', 'RT', 'RW', 'Alamat', 'Asnaf', 'Telepon'];
    const sample = ['Ibu Aminah', '3201012345678901', '3', '01', '02', 'Semingkal', 'miskin', '081234567890'];
    const csvContent = [headers.join(','), sample.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_mustahiq.csv';
    link.click();
  };

  const asnafLabel = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);
  const asnafColor = (a: string) => {
    const colors: Record<string, string> = { fakir: 'bg-red-500/10 text-red-400', miskin: 'bg-orange-500/10 text-orange-400', amil: 'bg-blue-500/10 text-blue-400', mualaf: 'bg-purple-500/10 text-purple-400', riqab: 'bg-pink-500/10 text-pink-400', gharim: 'bg-yellow-500/10 text-yellow-400', fisabilillah: 'bg-green-500/10 text-green-400', ibnu_sabil: 'bg-cyan-500/10 text-cyan-400' };
    return colors[a] || 'bg-slate-500/10 text-slate-400';
  };

  return (
    <>
      <Header title="Database Mustahiq" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-7xl mx-auto w-full">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
              <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-base">close</span></button>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-black tracking-tight">Database Mustahiq</h1>
              <p className="text-slate-500 dark:text-slate-400">Kelola data penerima zakat berdasarkan 8 golongan asnaf.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={downloadTemplate} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-primary font-bold text-sm border border-slate-200 dark:border-primary/30 hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-lg">download</span> Template CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-slate-100 dark:bg-primary/10 text-slate-700 dark:text-primary font-bold text-sm border border-slate-200 dark:border-primary/30 hover:bg-primary/20 transition-all">
                <span className="material-symbols-outlined text-lg">upload_file</span> Import CSV
              </button>
              <button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-lg h-10 px-6 bg-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-lg">person_add</span> Tambah Mustahiq
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Cari nama atau No. KK..." />
              </div>
              <select value={filterAsnaf} onChange={e => setFilterAsnaf(e.target.value)} className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 focus:ring-2 focus:ring-primary outline-none min-w-[160px]">
                <option value="">Semua Asnaf</option>
                {ASNAF_OPTIONS.map(a => <option key={a} value={a}>{asnafLabel(a)}</option>)}
              </select>
              <select value={filterRT} onChange={e => setFilterRT(e.target.value)} className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 focus:ring-2 focus:ring-primary outline-none min-w-[120px]">
                <option value="">Semua RT</option>
                {rtOptions.map(rt => <option key={rt} value={rt}>RT {rt}</option>)}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10 shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-500"><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat data...</div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2"><span className="material-symbols-outlined text-4xl">person_off</span><p>Belum ada data mustahiq.</p></div>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-primary/10 border-b border-slate-200 dark:border-primary/20">
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Nama</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">No. KK</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Anggota</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">RT/RW</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Asnaf</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Telepon</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-primary/10">
                    {filtered.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors group">
                        <td className="px-6 py-4"><span className="font-bold text-primary group-hover:underline">{m.nama}</span></td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-sm">{m.no_kk || '-'}</td>
                        <td className="px-6 py-4 text-center"><span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-primary/20 text-xs font-bold">{m.jumlah_anggota}</span></td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">RT {m.rt}{m.rw ? ` / RW ${m.rw}` : ''}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${asnafColor(m.kategori_asnaf)}`}>{asnafLabel(m.kategori_asnaf)}</span></td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{m.telepon || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-primary/20 text-slate-400 hover:text-primary transition-all"><span className="material-symbols-outlined text-xl">edit</span></button>
                            <button onClick={() => toggleStatus(m)} className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"><span className="material-symbols-outlined text-xl">person_off</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-slate-200 dark:border-primary/20 text-sm text-slate-500">Menampilkan {filtered.length} dari {data.length} Mustahiq</div>
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
              <h3 className="text-xl font-bold">{editingId ? 'Edit Mustahiq' : 'Tambah Mustahiq Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              {([['nama', 'Nama', 'text'], ['no_kk', 'No. KK', 'text'], ['jumlah_anggota', 'Jumlah Anggota', 'number'], ['rt', 'RT', 'text'], ['rw', 'RW', 'text'], ['alamat', 'Alamat', 'text'], ['telepon', 'Telepon', 'text']] as const).map(([key, label, type]) => (
                <label key={key} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value }))} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary" />
                </label>
              ))}
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kategori Asnaf</span>
                <select value={form.kategori_asnaf} onChange={e => setForm(p => ({ ...p, kategori_asnaf: e.target.value as Asnaf }))} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary">
                  {ASNAF_OPTIONS.map(a => <option key={a} value={a}>{asnafLabel(a)}</option>)}
                </select>
              </label>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-primary/20 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-primary/20 text-sm font-bold hover:bg-slate-100 dark:hover:bg-primary/10">Batal</button>
              <button onClick={handleSave} disabled={saving || !form.nama} className="px-5 py-2.5 rounded-lg bg-primary text-background-dark text-sm font-bold hover:brightness-110 disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
