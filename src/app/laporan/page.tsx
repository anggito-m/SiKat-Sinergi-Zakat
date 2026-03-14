'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import RoleGuard from '@/components/RoleGuard';

interface Summary {
  fitrahBerasKg: number;
  fitrahBerasCount: number;
  fitrahTunaiRp: number;
  fitrahTunaiCount: number;
  fitrahMayarRp: number;
  fitrahMayarCount: number;
  maalTunaiRp: number;
  maalTunaiCount: number;
  maalMayarRp: number;
  maalMayarCount: number;
  infaqTunaiRp: number;
  infaqTunaiCount: number;
  infaqMayarRp: number;
  infaqMayarCount: number;

  totalFitrahRp: number;
  totalMaal: number;
  totalInfaq: number;
  totalDistribusiRp: number;
  distribusiBerasKg: number;
  distribusiBerasCount: number;
  muzakkiCount: number;
  mustahiqCount: number;
  fitrahCount: number;
  maalCount: number;
  infaqCount: number;
  distribusiCount: number;
}

interface DistribusiByRT {
  rt: string;
  total: number;
  totalKg: number;
  count: number;
}

export default function LaporanPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
      <LaporanContent />
    </RoleGuard>
  );
}

function LaporanContent() {
  const [summary, setSummary] = useState<Summary>({
    fitrahBerasKg: 0, fitrahBerasCount: 0,
    fitrahTunaiRp: 0, fitrahTunaiCount: 0, fitrahMayarRp: 0, fitrahMayarCount: 0,
    maalTunaiRp: 0, maalTunaiCount: 0, maalMayarRp: 0, maalMayarCount: 0,
    infaqTunaiRp: 0, infaqTunaiCount: 0, infaqMayarRp: 0, infaqMayarCount: 0,
    totalFitrahRp: 0, totalMaal: 0, totalInfaq: 0, 
    totalDistribusiRp: 0, distribusiBerasKg: 0, distribusiBerasCount: 0,
    muzakkiCount: 0, mustahiqCount: 0, fitrahCount: 0, maalCount: 0, infaqCount: 0, distribusiCount: 0,
  });
  const [distribusiByRT, setDistribusiByRT] = useState<DistribusiByRT[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);

    // Fetch all summary data in parallel
    const [fitrahRes, maalRes, infaqRes, distribusiRes, muzakkiRes, mustahiqRes] = await Promise.all([
      supabase.from('zakat_fitrah').select('nominal_beras_kg, total_setara_uang, jenis_bayar, metode_pembayaran').eq('status', 'selesai'),
      supabase.from('zakat_mal').select('nominal_zakat, metode_pembayaran').eq('status', 'selesai'),
      supabase.from('infaq_sedekah').select('nominal, metode_pembayaran').eq('status', 'selesai'),
      supabase.from('distribusi').select('nominal, nominal_beras_kg, jenis_bantuan, mustahiq(rt)'),
      supabase.from('muzakki').select('id', { count: 'exact', head: true }).eq('status_aktif', true),
      supabase.from('mustahiq').select('id', { count: 'exact', head: true }).eq('status_aktif', true),
    ]);

    const fitrah = fitrahRes.data || [];
    const maal = maalRes.data || [];
    const infaq = infaqRes.data || [];
    const distribusi = distribusiRes.data || [];

    // Fitrah Breakdown
    let fitrahBerasKg = 0, fitrahBerasCount = 0;
    let fitrahTunaiRp = 0, fitrahTunaiCount = 0;
    let fitrahMayarRp = 0, fitrahMayarCount = 0;
    
    fitrah.forEach(f => {
      if (f.jenis_bayar === 'beras') {
        fitrahBerasKg += f.nominal_beras_kg || 0;
        fitrahBerasCount++;
      } else {
        if (f.metode_pembayaran === 'mayar') {
          fitrahMayarRp += f.total_setara_uang || 0;
          fitrahMayarCount++;
        } else {
          fitrahTunaiRp += f.total_setara_uang || 0;
          fitrahTunaiCount++;
        }
      }
    });

    const totalFitrahRp = fitrahTunaiRp + fitrahMayarRp;

    // Maal Breakdown
    let maalTunaiRp = 0, maalTunaiCount = 0;
    let maalMayarRp = 0, maalMayarCount = 0;
    
    maal.forEach(m => {
      if (m.metode_pembayaran === 'mayar') {
        maalMayarRp += m.nominal_zakat || 0;
        maalMayarCount++;
      } else {
        maalTunaiRp += m.nominal_zakat || 0;
        maalTunaiCount++;
      }
    });

    const totalMaal = maalTunaiRp + maalMayarRp;

    // Infaq Breakdown
    let infaqTunaiRp = 0, infaqTunaiCount = 0;
    let infaqMayarRp = 0, infaqMayarCount = 0;
    
    infaq.forEach(i => {
      if (i.metode_pembayaran === 'mayar') {
        infaqMayarRp += i.nominal || 0;
        infaqMayarCount++;
      } else {
        infaqTunaiRp += i.nominal || 0;
        infaqTunaiCount++;
      }
    });

    const totalInfaq = infaqTunaiRp + infaqMayarRp;
    
    // Distribusi Breakdown
    let totalDistribusiRp = 0;
    let distribusiBerasKg = 0;
    let distribusiBerasCount = 0;

    distribusi.forEach(d => {
      if (d.jenis_bantuan === 'beras') {
        distribusiBerasKg += d.nominal_beras_kg || 0;
        distribusiBerasCount++;
      } else {
        totalDistribusiRp += d.nominal || 0;
      }
    });

    setSummary({
      fitrahBerasKg, fitrahBerasCount,
      fitrahTunaiRp, fitrahTunaiCount,
      fitrahMayarRp, fitrahMayarCount,
      maalTunaiRp, maalTunaiCount,
      maalMayarRp, maalMayarCount,
      infaqTunaiRp, infaqTunaiCount,
      infaqMayarRp, infaqMayarCount,
      totalFitrahRp, totalMaal, totalInfaq, 
      totalDistribusiRp, distribusiBerasKg, distribusiBerasCount,
      muzakkiCount: muzakkiRes.count || 0,
      mustahiqCount: mustahiqRes.count || 0,
      fitrahCount: fitrah.length,
      maalCount: maal.length,
      infaqCount: infaq.length,
      distribusiCount: distribusi.length,
    });

    // Group distribusi by RT
    const rtMap: Record<string, { totalRp: number; totalKg: number; count: number }> = {};
    distribusi.forEach(d => {
      const rt = (d.mustahiq as any)?.rt || 'Lainnya';
      if (!rtMap[rt]) rtMap[rt] = { totalRp: 0, totalKg: 0, count: 0 };
      if (d.jenis_bantuan === 'beras') {
        rtMap[rt].totalKg += d.nominal_beras_kg || 0;
      } else {
        rtMap[rt].totalRp += d.nominal || 0;
      }
      rtMap[rt].count += 1;
    });
    setDistribusiByRT(
      Object.entries(rtMap).map(([rt, v]) => ({ 
        rt, 
        total: v.totalRp, 
        ...v 
      })).sort((a, b) => b.total - a.total)
    );

    setLoading(false);
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const totalPenerimaan = summary.totalFitrahRp + summary.totalMaal + summary.totalInfaq;
  const saldoBelumDisalurkan = totalPenerimaan - summary.totalDistribusiRp;
  const sisaStokBeras = summary.fitrahBerasKg - summary.distribusiBerasKg;

  const mainStatCards = [
    { 
      label: 'Stok Beras Tersisa', 
      value: `${sisaStokBeras.toFixed(1)} Kg`, 
      icon: 'rice_bowl', 
      color: sisaStokBeras >= 0 ? 'text-amber-500' : 'text-red-500', 
      bg: 'bg-amber-500/10', 
      sub: `Terkumpul: ${summary.fitrahBerasKg.toFixed(1)} Kg · Disalurkan: ${summary.distribusiBerasKg.toFixed(1)} Kg`,
      isMain: true
    },
    { 
      label: 'Saldo Tersisa (Uang)', 
      value: fmt(saldoBelumDisalurkan), 
      icon: 'payments', 
      color: saldoBelumDisalurkan >= 0 ? 'text-primary' : 'text-red-400', 
      bg: 'bg-primary/20', 
      sub: `Total Terima: ${fmt(totalPenerimaan)} · Total Keluar: ${fmt(summary.totalDistribusiRp)}`,
      isMain: true
    }
  ];

  const subStatCards = [
    { label: 'Fitrah (Uang)', value: fmt(summary.totalFitrahRp), icon: 'eco', color: 'text-primary' },
    { label: 'Zakat Mal', value: fmt(summary.totalMaal), icon: 'account_balance', color: 'text-primary' },
    { label: 'Infaq / Sedekah', value: fmt(summary.totalInfaq), icon: 'volunteer_activism', color: 'text-primary' },
    { label: 'Total Penerimaan', value: fmt(totalPenerimaan), icon: 'add_chart', color: 'text-emerald-500' },
  ];

  return (
    <>
      <Header title="Laporan" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-6xl mx-auto w-full space-y-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Laporan Ringkasan</h1>
            <p className="text-slate-500 dark:text-slate-400">Analisis saldo dan distribusi dana zakat secara *real-time*.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> Memuat laporan...
            </div>
          ) : (
            <>
              {/* Main Balanced Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {mainStatCards.map((c, i) => (
                  <div key={i} className={`bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-primary/10 shadow-sm flex items-center gap-6 relative overflow-hidden`}>
                     <div className={`p-4 ${c.bg} rounded-2xl shadow-inner`}><span className={`material-symbols-outlined text-4xl ${c.color}`}>{c.icon}</span></div>
                     <div className="flex flex-col gap-1">
                        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">{c.label}</h3>
                        <p className="text-4xl font-black">{c.value}</p>
                        <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-primary/5">
                           <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase leading-none">{c.sub}</p>
                        </div>
                     </div>
                  </div>
                ))}
              </div>

              {/* Sub Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {subStatCards.map((c, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900/30 p-5 rounded-xl border border-slate-100 dark:border-primary/5 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                       <span className="material-symbols-outlined text-base">{c.icon}</span>
                       <span className="text-[10px] font-bold uppercase tracking-wider">{c.label}</span>
                    </div>
                    <p className="text-lg font-bold">{c.value}</p>
                  </div>
                ))}
              </div>

              {/* Detailed Penerimaan */}
              <div className="bg-white dark:bg-primary/5 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-primary/10">
                  <h3 className="font-bold text-lg">Rincian Penerimaan</h3>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-primary/10">
                  {/* Fitrah */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary"><span className="material-symbols-outlined">eco</span></div>
                        <div>
                          <p className="font-bold text-sm">Zakat Fitrah</p>
                          <p className="text-xs text-slate-500">{summary.fitrahCount} transaksi</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg">{fmt(summary.totalFitrahRp)}</p>
                    </div>
                    <div className="pl-12 space-y-2">
                       <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                         <span>Beras ({summary.fitrahBerasCount}x)</span>
                         <span className="font-medium">{summary.fitrahBerasKg.toFixed(1)} Kg</span>
                       </div>
                       <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                         <span>Uang Tunai ({summary.fitrahTunaiCount}x)</span>
                         <span className="font-medium">{fmt(summary.fitrahTunaiRp)}</span>
                       </div>
                       <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                         <span>Uang via Mayar ({summary.fitrahMayarCount}x)</span>
                         <span className="font-medium">{fmt(summary.fitrahMayarRp)}</span>
                       </div>
                    </div>
                  </div>

                  {/* Maal */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary"><span className="material-symbols-outlined">account_balance</span></div>
                        <div>
                          <p className="font-bold text-sm">Zakat Maal</p>
                          <p className="text-xs text-slate-500">{summary.maalCount} transaksi</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg">{fmt(summary.totalMaal)}</p>
                    </div>
                    <div className="pl-12 space-y-2">
                       <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                         <span>Tunai ({summary.maalTunaiCount}x)</span>
                         <span className="font-medium">{fmt(summary.maalTunaiRp)}</span>
                       </div>
                       <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                         <span>via Mayar ({summary.maalMayarCount}x)</span>
                         <span className="font-medium">{fmt(summary.maalMayarRp)}</span>
                       </div>
                    </div>
                  </div>

                  {/* Infaq */}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg text-primary"><span className="material-symbols-outlined">favorite</span></div>
                        <div>
                          <p className="font-bold text-sm">Infaq / Sedekah</p>
                          <p className="text-xs text-slate-500">{summary.infaqCount} transaksi</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg">{fmt(summary.totalInfaq)}</p>
                    </div>
                    <div className="pl-12 space-y-2">
                       <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                         <span>Tunai ({summary.infaqTunaiCount}x)</span>
                         <span className="font-medium">{fmt(summary.infaqTunaiRp)}</span>
                       </div>
                       <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                         <span>via Mayar ({summary.infaqMayarCount}x)</span>
                         <span className="font-medium">{fmt(summary.infaqMayarRp)}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">groups</span>
                    <h3 className="font-bold text-lg">Database</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Muzakki Aktif</span>
                      <span className="font-bold text-lg">{summary.muzakkiCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Mustahiq Aktif</span>
                      <span className="font-bold text-lg">{summary.mustahiqCount}</span>
                    </div>
                  </div>
                </div>

                {/* Distribusi by RT */}
                <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <h3 className="font-bold text-lg">Distribusi per RT</h3>
                  </div>
                  {distribusiByRT.length === 0 ? (
                    <p className="text-sm text-slate-500">Belum ada data distribusi.</p>
                  ) : (
                    <div className="space-y-3">
                      {distribusiByRT.map(a => {
                        const pct = summary.totalDistribusiRp > 0 ? (a.total / summary.totalDistribusiRp * 100) : 0;
                        return (
                          <div key={a.rt}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">RT {a.rt}</span>
                              <div className="text-right">
                                <span className="font-bold block">{fmt(a.total)}</span>
                                {a.totalKg > 0 && (
                                  <span className="text-amber-500 font-bold block">+ {a.totalKg.toFixed(1)} Kg Beras</span>
                                )}
                              </div>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
