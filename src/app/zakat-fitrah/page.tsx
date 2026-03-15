'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface Muzakki { id: string; nama_kk: string; nama_kepala_keluarga: string; jumlah_anggota: number; }

export default function ZakatFitrahPage() {
  const { profile, muzakkiId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isUser = profile?.role === 'user';
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [jumlahAnggota, setJumlahAnggota] = useState(0);
  const [jenisBayar, setJenisBayar] = useState<'beras' | 'uang'>('beras');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Dynamic config from DB
  const [shaKg, setShaKg] = useState(2.5); // Kg per sha' (per jiwa)
  const [hargaPerKg, setHargaPerKg] = useState(18000); // Harga beras per Kg
  const [configLoading, setConfigLoading] = useState(true);

  // Manual Overrides
  const [manualBeras, setManualBeras] = useState(0);
  const [manualUang, setManualUang] = useState(0);

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    const { data, error: e } = await supabase.from('config').select('key, value');
    if (e) {
      console.error('Failed to load config:', e);
    } else if (data) {
      const shaConfig = data.find(c => c.key === 'nilai_sha_kg');
      const hargaConfig = data.find(c => c.key === 'harga_beras_per_kg');
      if (shaConfig) setShaKg(parseFloat(shaConfig.value) || 2.5);
      if (hargaConfig) setHargaPerKg(parseInt(hargaConfig.value) || 18000);
    }
    setConfigLoading(false);
  }, []);

  const fetchMuzakki = useCallback(async () => {
    if (authLoading || !profile) return;
    if (isUser && !muzakkiId) return;

    let query = supabase.from('muzakki').select('id,nama_kk,nama_kepala_keluarga,jumlah_anggota').eq('status_aktif', true);
    if (isUser && muzakkiId) {
      query = query.eq('id', muzakkiId);
    }
    const { data } = await query.order('nama_kk');
    if (data) {
      setMuzakkiList(data);
      // Auto-select for user role
      if (isUser && data.length === 1) {
        handleSelect(data[0].id, data[0]);
      }
    }
  }, [isUser, muzakkiId, authLoading, profile]);

  useEffect(() => { fetchConfig(); fetchMuzakki(); }, [fetchConfig, fetchMuzakki]);

  // Pre-fill from chat AI
  useEffect(() => {
    const amount = searchParams.get('amount');
    if (amount && searchParams.get('from') === 'chat') {
      setManualUang(parseInt(amount) || 0);
      setJenisBayar('uang');
    }
  }, [searchParams]);

  useEffect(() => {
    setManualBeras(jumlahAnggota * shaKg);
    setManualUang(jumlahAnggota * shaKg * hargaPerKg);
  }, [jumlahAnggota, shaKg, hargaPerKg]);

  const selectedMuzakki = muzakkiList.find(m => m.id === selectedId);

  const handleSelect = (id: string, muzakkiObj?: Muzakki) => {
    setSelectedId(id);
    const m = muzakkiObj || muzakkiList.find(x => x.id === id);
    if (m) setJumlahAnggota(m.jumlah_anggota);
    setSuccess(false);
    setError('');
  };

  const handleSave = async () => {
    if (!selectedId || jumlahAnggota <= 0) return;
    setSaving(true);
    setError('');
    const { error: e } = await supabase.from('zakat_fitrah').insert([{
      muzakki_id: selectedId,
      jumlah_anggota_aktual: jumlahAnggota,
      jenis_bayar: jenisBayar,
      nominal_beras_kg: jenisBayar === 'beras' ? manualBeras : null,
      nominal_uang: jenisBayar === 'uang' ? manualUang : null,
      total_setara_uang: jenisBayar === 'beras' ? (manualBeras * hargaPerKg) : manualUang,
      metode_pembayaran: 'tunai',
      status: 'selesai',
    }]);
    setSaving(false);
    if (e) {
      setError(`Gagal menyimpan: ${e.message}`);
    } else {
      setSuccess(true);
      setSelectedId(''); setJumlahAnggota(0);
    }
  };

  const handleMayar = async () => {
    if (!selectedId || jumlahAnggota <= 0) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: manualUang, title: `Zakat Fitrah - ${selectedMuzakki?.nama_kk}`, description: `Zakat Fitrah ${jumlahAnggota} jiwa` }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(`Gagal membuat link pembayaran: ${data.error || 'Terjadi kesalahan'}`);
        setSaving(false);
        return;
      }
      if (data.payment_link) {
        const { error: e } = await supabase.from('zakat_fitrah').insert([{
          muzakki_id: selectedId, jumlah_anggota_aktual: jumlahAnggota, jenis_bayar: 'uang',
          nominal_uang: manualUang, total_setara_uang: manualUang, metode_pembayaran: 'mayar',
          mayar_payment_id: data.payment_id, mayar_invoice_url: data.payment_link, status: 'pending',
        }]);
        if (e) {
          setError(`Link berhasil dibuat, tetapi gagal menyimpan transaksi: ${e.message}`);
        }
        window.open(data.payment_link, '_blank');
      } else {
        setError('Link pembayaran tidak ditemukan dalam respons.');
      }
    } catch (err: any) {
      setError(`Gagal menghubungi server pembayaran: ${err.message}`);
    }
    setSaving(false);
  };

  return (
    <>
      <Header title="Input Zakat Fitrah" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="flex justify-center py-8 px-4 md:px-6 w-full">
          <div className="flex flex-col max-w-[800px] w-full gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold leading-tight">Input Zakat Fitrah</h1>
              <p className="text-slate-600 dark:text-primary/70">Pencatatan penerimaan zakat fitrah warga desa secara digital.</p>
            </div>

            {success && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3 text-primary font-medium">
                <span className="material-symbols-outlined">check_circle</span> Zakat Fitrah berhasil dicatat!
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
                <span className="material-symbols-outlined">error</span>
                {error}
                <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-base">close</span></button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Data Muzakki */}
              <div className="flex flex-col gap-6 bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">person_search</span>
                  <h3 className="text-lg font-bold">Data Muzakki</h3>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cari Nama Muzakki</span>
                  <div className="relative">
                    <select value={selectedId} onChange={e => handleSelect(e.target.value)} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 appearance-none focus:border-primary focus:ring-primary">
                      <option value="">Pilih dari database warga...</option>
                      {muzakkiList.map(m => <option key={m.id} value={m.id}>{m.nama_kepala_keluarga} - {m.nama_kk} (KK: {m.jumlah_anggota} Orang)</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-slate-400">expand_more</span>
                  </div>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Jumlah Anggota Keluarga (Jiwa)</span>
                  <input type="number" value={jumlahAnggota || ''} onChange={e => setJumlahAnggota(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 focus:border-primary focus:ring-primary" placeholder="Contoh: 4" />
                </label>
              </div>

              {/* Right: Config */}
              <div className="flex flex-col gap-6 bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary">settings_suggest</span>
                  <h3 className="text-lg font-bold">Konfigurasi Fitrah</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">1 Sha&apos; (per jiwa)</span>
                    <span className="text-lg font-bold">{configLoading ? '...' : `${shaKg} Kg`}</span>
                    <span className="text-[10px] text-slate-500">beras/makanan pokok</span>
                  </div>
                  <div className="flex flex-col p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Harga Beras</span>
                    <span className="text-lg font-bold">{configLoading ? '...' : `Rp ${hargaPerKg.toLocaleString('id-ID')}`}</span>
                    <span className="text-[10px] text-slate-500">per Kg</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pilih Tipe Pembayaran</span>
                  <div className="flex bg-primary/10 p-1 rounded-lg">
                    <button onClick={() => setJenisBayar('beras')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-semibold transition-all ${jenisBayar === 'beras' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-primary/20'}`}>
                      <span className="material-symbols-outlined text-sm">bakery_dining</span> Beras (Kg)
                    </button>
                    <button onClick={() => setJenisBayar('uang')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-semibold transition-all ${jenisBayar === 'uang' ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-primary/20'}`}>
                      <span className="material-symbols-outlined text-sm">payments</span> Uang (Rp)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Input */}
            <div className="bg-primary/5 dark:bg-primary/5 border-2 border-primary/20 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-4">
              <span className="text-sm font-medium text-primary uppercase tracking-[0.2em] font-bold">Total Zakat Fitrah</span>
              
              <div className="w-full max-w-[350px]">
                {jenisBayar === 'beras' ? (
                  <div className="flex items-center bg-white dark:bg-background-dark border-2 border-primary rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/20 transition-all shadow-sm">
                    <input 
                      type="number" 
                      step="0.1"
                      value={manualBeras || ''} 
                      onChange={(e) => setManualBeras(parseFloat(e.target.value) || 0)}
                      className="w-full text-center text-5xl font-black py-4 outline-none bg-transparent text-slate-800 dark:text-white"
                    />
                    <span className="text-2xl font-bold text-primary px-4 bg-primary/10 h-full flex items-center border-l-2 border-primary">Kg</span>
                  </div>
                ) : (
                  <div className="flex items-center bg-white dark:bg-background-dark border-2 border-primary rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/20 transition-all shadow-sm">
                    <span className="text-2xl font-bold text-primary px-4 bg-primary/10 h-full flex items-center border-r-2 border-primary">Rp</span>
                    <input 
                      type="number" 
                      value={manualUang || ''} 
                      onChange={(e) => setManualUang(parseInt(e.target.value) || 0)}
                      className="w-full text-center text-4xl sm:text-5xl font-black py-4 outline-none bg-transparent text-slate-800 dark:text-white"
                    />
                  </div>
                )}
              </div>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                Dihitung otomatis ({jumlahAnggota} org × {jenisBayar === 'beras' ? `${shaKg} kg` : `Rp ${(shaKg * hargaPerKg).toLocaleString('id-ID')}`}).<br/>
                <span className="italic text-xs">Anda dapat mengubah angka di atas secara manual jika donatur membayar lebih dari seharusnya.</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 mt-4 mb-10">
              {!isUser && (
                <>
                  <button onClick={handleSave} disabled={saving || !selectedId || jumlahAnggota <= 0} className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-background-dark font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50">
                    <span className="material-symbols-outlined">verified</span>
                    {saving ? 'Menyimpan...' : 'Terima Pembayaran'}
                  </button>
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-primary/20"></div>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">atau bayar digital</span>
                    <div className="flex-1 h-px bg-primary/20"></div>
                  </div>
                </>
              )}
              <button onClick={handleMayar} disabled={saving || !selectedId || jumlahAnggota <= 0} className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 font-bold py-4 rounded-xl shadow-sm transition-all group disabled:opacity-50">
                <span className="material-symbols-outlined text-primary">payments</span>
                Bayar via Mayar — Rp {manualUang.toLocaleString('id-ID')}
                <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
