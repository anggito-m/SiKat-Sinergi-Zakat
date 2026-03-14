'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import LandingPage from '@/components/LandingPage';

interface Stats { totalFitrahKg: number; totalFitrahRp: number; totalMaal: number; totalInfaq: number; mustahiqCount: number; }
interface Transaction { id: string; nama: string; jenis: string; jumlah: string; metode: string; waktu: string; status: string; payment_id?: string; payment_url?: string; }

export default function Home() {
  const { user, profile, muzakkiId, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalFitrahKg: 0, totalFitrahRp: 0, totalMaal: 0, totalInfaq: 0, mustahiqCount: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  // If not logged in and not loading, show Landing Page
  if (!authLoading && !user) {
    return <LandingPage />;
  }
  
  const isUserRole = profile?.role === 'user';

  const handleCheckStatus = async (paymentId: string) => {
    if (!paymentId) return;
    setCheckingId(paymentId);
    try {
      const res = await fetch(`/api/payment/check/${paymentId}`);
      const data = await res.json();
      if (data.success && data.status === 'selesai') {
        alert('Pembayaran telah berhasil (Selesai). Status diperbarui!');
        fetchAll(); // Refresh transactions
      } else {
        alert('Pembayaran masih pending, atau belum diselesaikan di sistem Mayar.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengecek status pembayaran.');
    }
    setCheckingId(null);
  };

  const fetchAll = useCallback(async () => {
    if (authLoading || !profile) return;
    
    // Only fetch if admin/amil/supervisor OR if user and we have their muzakkiId
    if (isUserRole && !muzakkiId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    // Filter builder for user role
    const withUserFilter = (query: any) => isUserRole ? query.eq('muzakki_id', muzakkiId) : query;

    // Fitrah
    const { data: fitrah } = await withUserFilter(supabase.from('zakat_fitrah').select('nominal_beras_kg, total_setara_uang, jenis_bayar').eq('status', 'selesai'));
    let totalFitrahKg = 0;
    let totalFitrahRp = 0;
    fitrah?.forEach((r: any) => {
      if (r.jenis_bayar === 'beras') {
        totalFitrahKg += r.nominal_beras_kg || 0;
      } else {
        totalFitrahRp += r.total_setara_uang || 0;
      }
    });

    // Maal
    const { data: maal } = await withUserFilter(supabase.from('zakat_mal').select('nominal_zakat').eq('status', 'selesai'));
    const totalMaal = maal?.reduce((s: number, r: any) => s + (r.nominal_zakat || 0), 0) || 0;

    // Infaq
    const { data: infaq } = await withUserFilter(supabase.from('infaq_sedekah').select('nominal').eq('status', 'selesai'));
    const totalInfaq = infaq?.reduce((s: number, r: any) => s + (r.nominal || 0), 0) || 0;

    // Mustahiq (only fetch count for non-users)
    let mustahiqCount = 0;
    if (!isUserRole) {
      const { count } = await supabase.from('mustahiq').select('id', { count: 'exact', head: true }).eq('status_aktif', true);
      mustahiqCount = count || 0;
    }

    setStats({ totalFitrahKg, totalFitrahRp, totalMaal, totalInfaq, mustahiqCount });

    // Recent Transactions (combine fitrah + maal + infaq, take latest 5)
    // For users, it shows their recent transactions. For admins, system-wide recent.
    const txns: Transaction[] = [];
    
    // Recent Fitrah
    const { data: rFitrah } = await withUserFilter(supabase.from('zakat_fitrah').select('id, created_at, status, total_setara_uang, metode_pembayaran, mayar_payment_id, mayar_invoice_url, muzakki(nama_kepala_keluarga)')).order('created_at', { ascending: false }).limit(5);
    rFitrah?.forEach((r: any) => {
      const m = r.muzakki as any;
      txns.push({ id: r.id, nama: m?.nama_kepala_keluarga || '-', jenis: 'Zakat Fitrah', jumlah: `Rp ${(r.total_setara_uang || 0).toLocaleString('id-ID')}`, metode: r.metode_pembayaran || 'Tunai', waktu: new Date(r.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }), status: r.status || 'selesai', payment_id: r.mayar_payment_id, payment_url: r.mayar_invoice_url });
    });
    
    // Recent Maal
    const { data: rMaal } = await withUserFilter(supabase.from('zakat_mal').select('id, created_at, status, nominal_zakat, metode_pembayaran, mayar_payment_id, mayar_invoice_url, muzakki(nama_kepala_keluarga)')).order('created_at', { ascending: false }).limit(5);
    rMaal?.forEach((r: any) => {
      const m = r.muzakki as any;
      txns.push({ id: r.id, nama: m?.nama_kepala_keluarga || '-', jenis: 'Zakat Mal', jumlah: `Rp ${(r.nominal_zakat || 0).toLocaleString('id-ID')}`, metode: r.metode_pembayaran || 'Tunai', waktu: new Date(r.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }), status: r.status || 'selesai', payment_id: r.mayar_payment_id, payment_url: r.mayar_invoice_url });
    });
    
    // Recent Infaq
    const { data: rInfaq } = await withUserFilter(supabase.from('infaq_sedekah').select('id, created_at, status, nominal, mayar_payment_id, mayar_invoice_url, metode_pembayaran, nama_donatur')).order('created_at', { ascending: false }).limit(5);
    rInfaq?.forEach((r: any) => {
      txns.push({ id: r.id, nama: r.nama_donatur || 'Hamba Allah', jenis: 'Infaq / Sedekah', jumlah: `Rp ${(r.nominal || 0).toLocaleString('id-ID')}`, metode: r.metode_pembayaran || 'Tunai', waktu: new Date(r.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' }), status: r.status || 'selesai', payment_id: r.mayar_payment_id, payment_url: r.mayar_invoice_url });
    });

    txns.sort((a, b) => b.waktu.localeCompare(a.waktu));
    setTransactions(txns.slice(0, 5));
    setLoading(false);
  }, [isUserRole, muzakkiId, authLoading, profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (n: number) => n.toLocaleString('id-ID');

  let statCards = [
    { label: 'Zakat Fitrah (Beras)', value: `${fmt(stats.totalFitrahKg)} Kg`, icon: 'rice_bowl', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'dark:border-amber-500/20' },
    { label: 'Zakat Fitrah (Uang)', value: `Rp ${fmt(stats.totalFitrahRp)}`, icon: 'payments', color: 'text-primary', bg: 'bg-primary/20', border: 'dark:border-primary/10' },
    { label: 'Total Zakat Mal', value: `Rp ${fmt(stats.totalMaal)}`, icon: 'account_balance_wallet', color: 'text-primary', bg: 'bg-primary/20', border: 'dark:border-primary/10' },
    { label: 'Total Infaq/Sedekah', value: `Rp ${fmt(stats.totalInfaq)}`, icon: 'volunteer_activism', color: 'text-primary', bg: 'bg-primary/20', border: 'dark:border-primary/10' },
  ];

  if (!isUserRole) {
    statCards.push({ label: 'Mustahiq Terdaftar', value: `${stats.mustahiqCount} Keluarga`, icon: 'family_restroom', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'dark:border-blue-500/20' });
  }

  return (
    <>
      <Header title="Beranda Ringkasan" />
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {statCards.map((c, i) => (
            <div key={i} className={`bg-background-light dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 ${c.border} shadow-sm`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 ${c.bg} rounded-lg`}><span className={`material-symbols-outlined ${c.color}`}>{c.icon}</span></div>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{c.label}</h3>
              <p className="text-xl font-bold mt-1">{loading ? '...' : c.value}</p>
            </div>
          ))}
        </div>

        {/* AI Assistant Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-background-light dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-primary/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-primary/10 flex items-center justify-between">
              <h3 className="text-lg font-bold">{isUserRole ? 'Riwayat Transaksi Saya' : 'Transaksi Terbaru'}</h3>
              <a href="/riwayat-transaksi" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1 group">
                <span>Lihat Semua</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-background-dark/30 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Muzakki</th>
                    <th className="px-6 py-4 font-semibold">Jenis</th>
                    <th className="px-6 py-4 font-semibold">Jumlah</th>
                    <th className="px-6 py-4 font-semibold">Metode</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-primary/5">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500"><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Belum ada transaksi.</td></tr>
                  ) : transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold">{t.nama.charAt(0)}</div>
                          <p className="font-medium text-sm">{t.nama}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{t.jenis}</td>
                      <td className="px-6 py-4 text-sm font-bold">{t.jumlah}</td>
                      <td className="px-6 py-4 text-sm">{t.metode}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${t.status === 'selesai' ? 'bg-primary/10 text-primary' : 'bg-yellow-400/10 text-yellow-500'}`}>{t.status}</span>
                          {t.status === 'pending' && (
                            <div className="flex items-center gap-1">
                              {t.payment_url && (
                                <a href={t.payment_url} target="_blank" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-primary" title="Bayar Sekarang">
                                  <span className="material-symbols-outlined text-sm">payments</span>
                                </a>
                              )}
                              {t.payment_id && (
                                <button onClick={() => handleCheckStatus(t.payment_id!)} disabled={checkingId === t.payment_id} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500" title="Cek Status Webhook">
                                  <span className={`material-symbols-outlined text-sm ${checkingId === t.payment_id ? 'animate-spin' : ''}`}>sync</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Card */}
          <a href="/ai-chat" className="bg-primary/5 border-2 border-primary/20 p-6 rounded-xl shadow-sm relative overflow-hidden group block hover:border-primary transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-8xl text-primary">psychology</span>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary text-background-dark rounded-full"><span className="material-symbols-outlined text-sm font-bold">smart_toy</span></div>
                <h3 className="font-bold text-lg">AI Asisten Syariah</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">Tanyakan perhitungan nisab, hukum fikih zakat, atau saran alokasi penyaluran berdasarkan asnaf.</p>
              <span className="w-full py-3 bg-primary text-background-dark rounded-lg font-bold text-sm flex items-center justify-center gap-2 group-hover:brightness-95 transition-all shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-base">chat_bubble</span>
                Mulai Diskusi Baru
              </span>
            </div>
          </a>
        </div>
      </div>
    </>
  );
}
