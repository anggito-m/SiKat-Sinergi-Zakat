'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface Muzakki { id: string; nama_kk: string; nama_kepala_keluarga: string; }

export default function InfaqPage() {
  const { profile, muzakkiId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isUser = profile?.role === 'user';
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [selectedMuzakkiId, setSelectedMuzakkiId] = useState('');
  const [isManual, setIsManual] = useState(true);
  
  const [namaDonatur, setNamaDonatur] = useState('');
  const [nominal, setNominal] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const fetchMuzakki = useCallback(async () => {
    if (authLoading || !profile) return;
    if (isUser && !muzakkiId) return;

    let query = supabase.from('muzakki').select('id,nama_kk,nama_kepala_keluarga').eq('status_aktif', true);
    if (isUser && muzakkiId) {
      query = query.eq('id', muzakkiId);
    }
    const { data } = await query.order('nama_kk');
    if (data) {
      setMuzakkiList(data);
      if (isUser && data.length === 1) {
        setSelectedMuzakkiId(data[0].id);
        setIsManual(false);
      }
    }
  }, [isUser, muzakkiId, authLoading, profile]);

  const fetchHistory = useCallback(async () => {
    if (authLoading || !profile) return;
    if (isUser && !muzakkiId) return;

    let query = supabase.from('infaq_sedekah').select('*').order('created_at', { ascending: false }).limit(20);
    if (isUser && muzakkiId) {
      query = query.eq('muzakki_id', muzakkiId);
    }
    const { data } = await query;
    if (data) setHistory(data);
  }, [isUser, muzakkiId, authLoading, profile]);

  useEffect(() => { fetchMuzakki(); fetchHistory(); }, [fetchMuzakki, fetchHistory]);

  // Pre-fill from chat AI
  useEffect(() => {
    const amount = searchParams.get('amount');
    if (amount && searchParams.get('from') === 'chat') {
      setNominal(parseInt(amount) || 0);
    }
  }, [searchParams]);

  const handleSave = async () => {
    if ((isManual && !namaDonatur) || (!isManual && !selectedMuzakkiId) || nominal <= 0) return;
    setSaving(true);
    setError('');
    
    let donorName = namaDonatur;
    if (!isManual) {
      const m = muzakkiList.find(x => x.id === selectedMuzakkiId);
      donorName = m ? `${m.nama_kepala_keluarga} (${m.nama_kk})` : namaDonatur;
    }

    const { error: e } = await supabase.from('infaq_sedekah').insert([{ 
      muzakki_id: isManual ? null : selectedMuzakkiId,
      nama_donatur: donorName, 
      nominal, 
      catatan, 
      metode_pembayaran: 'tunai', 
      status: 'selesai' 
    }]);
    setSaving(false);
    if (e) {
      setError(`Gagal menyimpan: ${e.message}`);
    } else {
      setSuccess(true);
      setNamaDonatur(''); setSelectedMuzakkiId(''); setNominal(0); setCatatan('');
      fetchHistory();
    }
  };

  const handleMayar = async () => {
    if ((isManual && !namaDonatur) || (!isManual && !selectedMuzakkiId) || nominal <= 0) return;
    setSaving(true);
    setError('');

    let donorName = namaDonatur;
    if (!isManual) {
      const m = muzakkiList.find(x => x.id === selectedMuzakkiId);
      donorName = m ? `${m.nama_kepala_keluarga} (${m.nama_kk})` : namaDonatur;
    }
    
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: nominal, title: `Infaq / Sedekah - ${donorName}`, description: catatan || 'Sumbangan Infaq/Sedekah' }),
      });
      const data = await res.json();
      
      if (!res.ok || data.error) {
        setError(`Gagal membuat link pembayaran: ${data.error || 'Terjadi kesalahan'}`);
        setSaving(false);
        return;
      }
      
      if (data.payment_link) {
        const { error: e } = await supabase.from('infaq_sedekah').insert([{
          muzakki_id: isManual ? null : selectedMuzakkiId,
          nama_donatur: donorName, 
          nominal, 
          catatan, 
          metode_pembayaran: 'mayar', 
          mayar_payment_id: data.payment_id,
          mayar_invoice_url: data.payment_link,
          status: 'pending' 
        }]);
        
        if (e) setError(`Link berhasil, tetapi gagal menyimpan transaksi: ${e.message}`);
        window.open(data.payment_link, '_blank');
      } else {
        setError('Link pembayaran tidak ditemukan dalam respons.');
      }
    } catch (err: any) {
      setError(`Gagal menghubungi server pembayaran: ${err.message}`);
    }
    setSaving(false);
  };

  const [checkingId, setCheckingId] = useState<string | null>(null);

  const handleCheckStatus = async (paymentId: string) => {
    if (!paymentId) return;
    setCheckingId(paymentId);
    try {
      const res = await fetch(`/api/payment/check/${paymentId}`);
      const data = await res.json();
      if (data.success && data.status === 'selesai') {
        alert('Pembayaran Infaq telah berhasil (Selesai).');
        fetchHistory(); // Refresh
      } else {
        alert('Pembayaran masih pending di sistem Mayar.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengecek status pembayaran.');
    }
    setCheckingId(null);
  };

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  return (
    <>
      <Header title="Infaq / Sedekah" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-3xl mx-auto w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Penerimaan Infaq / Sedekah</h1>
            <p className="text-slate-500 dark:text-slate-400">Catat penerimaan infaq dan sedekah dari donatur.</p>
          </div>

          {success && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3 text-primary font-medium">
              <span className="material-symbols-outlined">check_circle</span> Infaq berhasil dicatat!
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
              <span className="material-symbols-outlined">error</span>
              {error}
              <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-base">close</span></button>
            </div>
          )}

          <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm space-y-5">
            <div className="flex flex-col gap-3">
              <div className="flex border-b border-primary/10 mb-2">
                <button onClick={() => { setIsManual(false); setSuccess(false); }} className={`flex-1 py-2 text-sm font-bold border-b-2 transition-all ${!isManual ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>Daftar Muzakki</button>
                <button onClick={() => { setIsManual(true); setSuccess(false); }} className={`flex-1 py-2 text-sm font-bold border-b-2 transition-all ${isManual ? 'border-primary text-primary' : 'border-transparent text-slate-400'}`}>Donatur Umum</button>
              </div>

              {!isManual ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pilih Muzakki</span>
                  <select value={selectedMuzakkiId} onChange={e => { setSelectedMuzakkiId(e.target.value); setSuccess(false); }} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 focus:border-primary focus:ring-primary">
                    <option value="">Cari muzakki...</option>
                    {muzakkiList.map(m => <option key={m.id} value={m.id}>{m.nama_kepala_keluarga} - {m.nama_kk}</option>)}
                  </select>
                </label>
              ) : (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nama Donatur</span>
                  <input type="text" value={namaDonatur} onChange={e => { setNamaDonatur(e.target.value); setSuccess(false); }} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 focus:border-primary focus:ring-primary" placeholder="Nama lengkap donatur / Hamba Allah..." />
                </label>
              )}
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nominal (Rp)</span>
              <input type="number" value={nominal || ''} onChange={e => setNominal(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 focus:border-primary focus:ring-primary" placeholder="0" />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Catatan (opsional)</span>
              <input type="text" value={catatan} onChange={e => setCatatan(e.target.value)} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary" placeholder="Keterangan..." />
            </label>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {!isUser && (
                <button 
                  onClick={handleSave} 
                  disabled={saving || (isManual ? !namaDonatur : !selectedMuzakkiId) || nominal <= 0} 
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold py-3.5 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">payments</span> Bayar Tunai
                </button>
              )}
              <button 
                onClick={handleMayar} 
                disabled={saving || (isManual ? !namaDonatur : !selectedMuzakkiId) || nominal <= 0} 
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-background-dark font-bold py-3.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">account_balance_wallet</span> Bayar via Mayar
              </button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white dark:bg-primary/5 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-primary/10"><h3 className="font-bold text-lg">Riwayat Infaq</h3></div>
            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-500">Belum ada riwayat infaq.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-primary/10">
                {history.map((h: any) => (
                  <div key={h.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-primary/5 transition-colors">
                    <div>
                      <p className="font-bold text-sm">{h.nama_donatur}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(h.created_at).toLocaleDateString('id-ID')}{h.catatan ? ` · ${h.catatan}` : ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-bold text-primary">{fmt(h.nominal)}</p>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${h.status === 'selesai' ? 'bg-primary/10 text-primary' : 'bg-yellow-400/10 text-yellow-500'}`}>{h.status || 'selesai'}</span>
                        {h.status === 'pending' && h.mayar_payment_id && (
                          <button onClick={() => handleCheckStatus(h.mayar_payment_id)} disabled={checkingId === h.mayar_payment_id} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors text-slate-500" title="Cek Status Webhook">
                            <span className={`material-symbols-outlined text-xs ${checkingId === h.mayar_payment_id ? 'animate-spin' : ''}`}>sync</span>
                          </button>
                        )}
                      </div>
                    </div>
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
