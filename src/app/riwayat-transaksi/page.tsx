'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/lib/auth-context';

interface Transaction {
  id: string;
  nama: string;
  rt: string;
  jenis: string;
  jumlah: string;
  metode: string;
  waktu: string;
  status: string;
  payment_id?: string;
  payment_url?: string;
  timestamp: Date;
}

export default function RiwayatTransaksiPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'amil', 'supervisor', 'user']}>
      <RiwayatContent />
    </RoleGuard>
  );
}

function RiwayatContent() {
  const { profile, muzakkiId, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState('');

  const isUserRole = profile?.role === 'user';
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [filterMetode, setFilterMetode] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterRT, setFilterRT] = useState('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAll = useCallback(async () => {
    if (authLoading || !profile) return;

    // Only fetch if admin/amil/supervisor OR if user and we have their muzakkiId
    if (isUserRole && !muzakkiId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const txns: Transaction[] = [];

    // Filter builder for user role
    const withUserFilter = (query: any) => isUserRole ? query.eq('muzakki_id', muzakkiId) : query;

    const { data: rFitrah } = await withUserFilter(supabase.from('zakat_fitrah').select('*, muzakki(nama_kepala_keluarga, rt)')).order('created_at', { ascending: false });
    rFitrah?.forEach((r: any) => {
      const m = r.muzakki as any;
      const t = { id: r.id, nama: m?.nama_kepala_keluarga || '-', rt: m?.rt || '-', jenis: 'Zakat Fitrah', metode: r.metode_pembayaran || 'Tunai', waktu: new Date(r.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }), status: r.status || 'selesai', payment_id: r.mayar_payment_id, payment_url: r.mayar_invoice_url, timestamp: new Date(r.created_at) };
      (t as any).jumlah = r.jenis_bayar === 'beras' ? `${r.nominal_beras_kg} Kg Beras` : `Rp ${(r.total_setara_uang || 0).toLocaleString('id-ID')}`;
      txns.push(t as Transaction);
    });

    const { data: rMaal } = await withUserFilter(supabase.from('zakat_mal').select('*, muzakki(nama_kepala_keluarga, rt)')).order('created_at', { ascending: false });
    rMaal?.forEach((r: any) => {
      const m = r.muzakki as any;
      txns.push({ id: r.id, nama: m?.nama_kepala_keluarga || '-', rt: m?.rt || '-', jenis: 'Zakat Mal', jumlah: `Rp ${(r.nominal_zakat || 0).toLocaleString('id-ID')}`, metode: r.metode_pembayaran || 'Tunai', waktu: new Date(r.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }), status: r.status || 'selesai', payment_id: r.mayar_payment_id, payment_url: r.mayar_invoice_url, timestamp: new Date(r.created_at) });
    });

    const { data: rInfaq } = await withUserFilter(supabase.from('infaq_sedekah').select('*, muzakki(rt)')).order('created_at', { ascending: false });
    rInfaq?.forEach((r: any) => {
      const m = r.muzakki as any;
      txns.push({ id: r.id, nama: r.nama_donatur || 'Hamba Allah', rt: m?.rt || '-', jenis: 'Infaq / Sedekah', jumlah: `Rp ${(r.nominal || 0).toLocaleString('id-ID')}`, metode: r.metode_pembayaran || 'Tunai', waktu: new Date(r.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' }), status: r.status || 'selesai', payment_id: r.mayar_payment_id, payment_url: r.mayar_invoice_url, timestamp: new Date(r.created_at) });
    });

    // Sort globally by descending time
    txns.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setTransactions(txns);
    setFilteredTransactions(txns);
    setLoading(false);
  }, [authLoading, profile, isUserRole, muzakkiId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Apply Client-Side Filters
  useEffect(() => {
    let result = transactions;
    if (search) {
      result = result.filter(t => t.nama.toLowerCase().includes(search.toLowerCase()) || t.jumlah.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()));
    }
    if (filterJenis !== 'Semua') result = result.filter(t => t.jenis.includes(filterJenis));
    if (filterMetode !== 'Semua') result = result.filter(t => t.metode === filterMetode);
    if (filterStatus !== 'Semua') result = result.filter(t => t.status === filterStatus);
    if (filterRT !== 'Semua') result = result.filter(t => t.rt === filterRT);
    
    // Date filtering (inclusive)
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(t => t.timestamp >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => t.timestamp <= end);
    }
    
    setFilteredTransactions(result);
  }, [search, filterJenis, filterMetode, filterStatus, filterRT, startDate, endDate, transactions]);

  const handleCheckMayar = async (paymentId: string) => {
    if (!paymentId) return;
    setCheckingId(paymentId);
    try {
      const res = await fetch(`/api/payment/check/${paymentId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Status Mayar: ${data.status}\n${data.message}`);
      fetchAll();
    } catch (err: any) {
      alert(`Gagal mengecek status: ${err.message}`);
    } finally {
      setCheckingId('');
    }
  };

  const exportCSV = () => {
    const headers = ['ID Transaksi', 'Nama', 'RT', 'Waktu', 'Jenis', 'Metode', 'Jumlah', 'Status'];
    const rows = filteredTransactions.map(t => [t.id, t.nama, t.rt, t.waktu, t.jenis, t.metode, t.jumlah, t.status]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `riwayat_transaksi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Riwayat Transaksi ZakatDesa", 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Nama', 'RT', 'Waktu', 'Jenis', 'Metode', 'Jumlah', 'Status']],
      body: filteredTransactions.map(t => [t.nama, t.rt, t.waktu, t.jenis, t.metode, t.jumlah, t.status]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [4, 120, 87] } // Primary green color
    });

    doc.save(`riwayat_transaksi_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <Header title="Riwayat Transaksi" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Semua Transaksi</h1>
              <p className="text-slate-500 dark:text-slate-400">Pencarian dan penyaringan riwayat lengkap transaksi.</p>
            </div>
            <div className="flex gap-2">
              {!isUserRole && (
                <>
                  <button onClick={exportCSV} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined">csv</span> Unduh CSV
                  </button>
                  <button onClick={exportPDF} className="bg-primary hover:bg-primary-dark text-background-dark px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-colors">
                    <span className="material-symbols-outlined">picture_as_pdf</span> Cetak PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col gap-4">
            {/* Top row - Search & Types */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, ID, atau nominal..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-primary/20 bg-transparent focus:ring-primary focus:border-primary" />
              </div>
              
              <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="py-2 px-3 rounded-lg border border-primary/20 bg-transparent focus:ring-primary focus:border-primary">
                <option value="Semua">Semua Zakat</option>
                <option value="Fitrah">Zakat Fitrah</option>
                <option value="Mal">Zakat Mal</option>
                <option value="Infaq">Infaq/Sedekah</option>
              </select>

              <select value={filterMetode} onChange={e => setFilterMetode(e.target.value)} className="py-2 px-3 rounded-lg border border-primary/20 bg-transparent focus:ring-primary focus:border-primary">
                <option value="Semua">Semua Metode</option>
                <option value="Tunai">Tunai</option>
                <option value="Mayar">Mayar (Transfer)</option>
              </select>

              {!isUserRole && (
                <select value={filterRT} onChange={e => setFilterRT(e.target.value)} className="py-2 px-3 rounded-lg border border-primary/20 bg-transparent focus:ring-primary focus:border-primary">
                  <option value="Semua">Semua RT</option>
                  <option value="01">RT 01</option>
                  <option value="02">RT 02</option>
                  <option value="03">RT 03</option>
                  <option value="04">RT 04</option>
                  <option value="05">RT 05</option>
                </select>
              )}

              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="py-2 px-3 rounded-lg border border-primary/20 bg-transparent focus:ring-primary focus:border-primary">
                <option value="Semua">Semua Status</option>
                <option value="selesai">Selesai</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Bottom row - Date Range */}
            <div className="flex flex-wrap gap-4 items-center border-t border-slate-100 dark:border-primary/10 pt-4">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Rentang Waktu:</span>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-primary/20">
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  className="py-1 px-2 rounded bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300"
                  title="Tanggal Mulai"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  className="py-1 px-2 rounded bg-transparent border-none text-sm focus:ring-0 text-slate-700 dark:text-slate-300"
                  title="Tanggal Akhir"
                />
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors"
                    title="Hapus Filter Tanggal"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-primary/5 rounded-xl shadow-sm border border-slate-200 dark:border-primary/10 overflow-hidden">
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-primary/10">
                    <th className="p-4 font-bold text-sm text-slate-500">Waktu</th>
                    <th className="p-4 font-bold text-sm text-slate-500">Muzakki / Donatur</th>
                    <th className="p-4 font-bold text-sm text-slate-500">RT</th>
                    <th className="p-4 font-bold text-sm text-slate-500">Jenis</th>
                    <th className="p-4 font-bold text-sm text-slate-500">Metode & Status</th>
                    <th className="p-4 font-bold text-sm text-slate-500 text-right">Jumlah</th>
                    <th className="p-4 font-bold text-sm text-slate-500 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-500">Memuat data transaksi...</td></tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-500">Tidak ada riwayat transaksi yang cocok.</td></tr>
                  ) : (
                    filteredTransactions.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 text-sm">{t.waktu}</td>
                        <td className="p-4 font-bold text-sm">{t.nama}</td>
                        <td className="p-4 text-sm font-medium">{t.rt}</td>
                        <td className="p-4 text-sm">
                          <span className={`px-2 py-1 rounded inline-block text-xs font-bold ${
                            t.jenis.includes('Fitrah') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500' :
                            t.jenis.includes('Mal') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500'
                          }`}>
                            {t.jenis}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-sm font-medium">{t.metode}</span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${
                              t.status === 'selesai' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                            }`}>{t.status.toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-bold text-primary">{t.jumlah}</td>
                        <td className="p-4 text-right">
                          {t.status === 'pending' && (
                            <div className="flex items-center gap-1 justify-end">
                              {t.payment_url && (
                                <a
                                  href={t.payment_url}
                                  target="_blank"
                                  className="bg-primary hover:bg-primary-dark text-background-dark text-xs px-3 py-1.5 rounded font-bold transition-colors inline-flex items-center gap-1"
                                  title="Buka halaman pembayaran Mayar"
                                >
                                  <span className="material-symbols-outlined text-[14px]">payments</span>
                                  Bayar
                                </a>
                              )}
                              {t.payment_id && (
                                <button
                                  onClick={() => handleCheckMayar(t.payment_id!)}
                                  disabled={checkingId === t.payment_id}
                                  className="bg-primary/10 hover:bg-primary/20 text-primary text-xs px-3 py-1.5 rounded font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                                  title="Tarik status tebaru dari Mayar"
                                >
                                  <span className={`material-symbols-outlined text-[14px] ${checkingId === t.payment_id ? 'animate-spin' : ''}`}>sync</span>
                                  Cek
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-primary/10 bg-slate-50 dark:bg-slate-800/30 text-sm text-slate-500 flex justify-between items-center">
              <span>Menampilkan {filteredTransactions.length} transaksi</span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
