'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import { formatRupiah, parseRupiah } from '@/helper/ribuan';
import { useAuth } from '@/lib/auth-context';

interface Muzakki { id: string; nama_kk: string; nama_kepala_keluarga: string; }

export default function ZakatMaalPage() {
  const { profile, muzakkiId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const isUser = profile?.role === 'user';
  const [activeTab, setActiveTab] = useState<'form' | 'kalkulator'>('form');

  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [selectedId, setSelectedId] = useState('');

  // Kalkulator States
  const [penghasilan, setPenghasilan] = useState(0);
  const [tabungan, setTabungan] = useState(0);
  const [emasGram, setEmasGram] = useState(0);
  const [investasi, setInvestasi] = useState(0);
  const [perdagangan, setPerdagangan] = useState(0);

  // Form States (Direct Nominal)
  const [directNominal, setDirectNominal] = useState(0);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Dynamic config from DB
  const [nisabEmasGr, setNisabEmasGr] = useState(85);
  const [hargaEmasPerGram, setHargaEmasPerGram] = useState(1000000);
  const [tahunHijriah, setTahunHijriah] = useState('1447');
  const [configLoading, setConfigLoading] = useState(true);
  const KADAR = 0.025;

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    const { data, error: e } = await supabase.from('config').select('key, value');
    if (e) {
      console.error('Failed to load config:', e);
    } else if (data) {
      const nisabEmasConfig = data.find(c => c.key === 'nisab_maal_emas_gr');
      const hargaEmasConfig = data.find(c => c.key === 'harga_emas_per_gram');
      const tahunConfig = data.find(c => c.key === 'tahun_hijriah');
      if (nisabEmasConfig) setNisabEmasGr(parseFloat(nisabEmasConfig.value) || 85);
      if (hargaEmasConfig) setHargaEmasPerGram(parseInt(hargaEmasConfig.value) || 1000000);
      if (tahunConfig) setTahunHijriah(tahunConfig.value || '1447');
    }
    setConfigLoading(false);
  }, []);

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
        setSelectedId(data[0].id);
      }
    }
  }, [isUser, muzakkiId, authLoading, profile]);

  useEffect(() => { fetchConfig(); fetchMuzakki(); }, [fetchConfig, fetchMuzakki]);

  // Pre-fill from chat AI
  useEffect(() => {
    const amount = searchParams.get('amount');
    if (amount && searchParams.get('from') === 'chat') {
      setDirectNominal(parseInt(amount) || 0);
      setActiveTab('form');
    }
  }, [searchParams]);

  // Kalkulator Logic
  const totalHarta = penghasilan + tabungan + (emasGram * hargaEmasPerGram) + investasi + perdagangan;
  const nisabRp = nisabEmasGr * hargaEmasPerGram;
  const melewatiNisab = totalHarta >= nisabRp;
  const calcNominalZakat = melewatiNisab ? totalHarta * KADAR : 0;

  // Final Nominal to Save/Pay based on active tab
  const finalNominalZakat = activeTab === 'form' ? directNominal : calcNominalZakat;

  const handleSave = async () => {
    if (!selectedId || finalNominalZakat <= 0) return;
    if (activeTab === 'kalkulator' && !melewatiNisab) return;

    setSaving(true);
    setError('');
    const { error: e } = await supabase.from('zakat_mal').insert([{
      muzakki_id: selectedId,
      tahun_hijriah: tahunHijriah,
      penghasilan_tahunan: activeTab === 'kalkulator' ? penghasilan : 0,
      tabungan: activeTab === 'kalkulator' ? tabungan : 0,
      emas_gram: activeTab === 'kalkulator' ? emasGram : 0,
      nilai_investasi: activeTab === 'kalkulator' ? investasi : 0,
      nilai_perdagangan: activeTab === 'kalkulator' ? perdagangan : 0,
      total_harta: activeTab === 'kalkulator' ? totalHarta : 0,
      nisab_referensi: nisabRp,
      nominal_zakat: finalNominalZakat,
      metode_pembayaran: 'tunai',
      status: 'selesai',
    }]);

    setSaving(false);
    if (e) {
      setError(`Gagal menyimpan: ${e.message}`);
    } else {
      setSuccess(true);
      setSelectedId(''); setPenghasilan(0); setTabungan(0); setEmasGram(0); setInvestasi(0); setPerdagangan(0); setDirectNominal(0);
    }
  };

  const handleMayar = async () => {
    if (!selectedId || finalNominalZakat <= 0) return;
    if (activeTab === 'kalkulator' && !melewatiNisab) return;

    setSaving(true);
    setError('');
    try {
      const selectedMuzakki = muzakkiList.find(m => m.id === selectedId);
      const res = await fetch('/api/payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: finalNominalZakat, title: `Zakat Maal - ${selectedMuzakki?.nama_kk}`, description: `Zakat Maal 2.5%` }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(`Gagal membuat link pembayaran: ${data.error || 'Terjadi kesalahan'}`);
        setSaving(false);
        return;
      }
      if (data.payment_link) {
        const { error: e } = await supabase.from('zakat_mal').insert([{
          muzakki_id: selectedId,
          tahun_hijriah: tahunHijriah,
          penghasilan_tahunan: activeTab === 'kalkulator' ? penghasilan : 0,
          tabungan: activeTab === 'kalkulator' ? tabungan : 0,
          emas_gram: activeTab === 'kalkulator' ? emasGram : 0,
          nilai_investasi: activeTab === 'kalkulator' ? investasi : 0,
          nilai_perdagangan: activeTab === 'kalkulator' ? perdagangan : 0,
          total_harta: activeTab === 'kalkulator' ? totalHarta : 0,
          nisab_referensi: nisabRp,
          nominal_zakat: finalNominalZakat,
          metode_pembayaran: 'mayar',
          mayar_payment_id: data.payment_id,
          mayar_invoice_url: data.payment_link,
          status: 'pending',
        }]);
        if (e) setError(`Link berhasil, tetapi gagal menyimpan transaksi: ${e.message}`);
        window.open(data.payment_link, '_blank');
      } else {
        setError('Link pembayaran tidak ditemukan.');
      }
    } catch (err: any) {
      setError(`Gagal menghubungi server pembayaran: ${err.message}`);
    }
    setSaving(false);
  };

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  const fields = [
    { label: 'Penghasilan Tahunan', value: penghasilan, set: setPenghasilan, icon: 'work' },
    { label: 'Tabungan', value: tabungan, set: setTabungan, icon: 'savings' },
    { label: 'Emas (gram)', value: emasGram, set: setEmasGram, icon: 'diamond', isGram: true },
    { label: 'Nilai Investasi', value: investasi, set: setInvestasi, icon: 'trending_up' },
    { label: 'Nilai Perdagangan', value: perdagangan, set: setPerdagangan, icon: 'storefront' },
  ];

  const disableActions = saving || !selectedId || finalNominalZakat <= 0 || (activeTab === 'kalkulator' && !melewatiNisab);

  return (
    <>
      <Header title="Input Zakat Maal" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="flex justify-center py-8 px-4 md:px-6 w-full">
          <div className="flex flex-col max-w-[800px] w-full gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold leading-tight">Input Zakat Maal / Harta Benda</h1>
              <p className="text-slate-600 dark:text-primary/70">Pencatatan pembayaran atau perhitungan zakat 2.5% untuk harta yang telah mencapai nisab.</p>
            </div>

            {success && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3 text-primary font-medium">
                <span className="material-symbols-outlined">check_circle</span> Zakat Maal berhasil dicatat!
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
                <span className="material-symbols-outlined">error</span>
                {error}
                <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-base">close</span></button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-primary/5 rounded-xl border border-slate-200 dark:border-primary/10 shadow-sm relative z-10">
              <button
                onClick={() => { setActiveTab('form'); setSuccess(false); setError(''); }}
                className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'form' ? 'bg-white dark:bg-primary shadow-sm text-primary dark:text-background-dark' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">edit_document</span> Form Pembayaran
              </button>
              <button
                onClick={() => { setActiveTab('kalkulator'); setSuccess(false); setError(''); }}
                className={`flex-1 py-3 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'kalkulator' ? 'bg-white dark:bg-primary shadow-sm text-primary dark:text-background-dark' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">calculate</span> Kalkulator
              </button>
            </div>

            {/* Muzakki Selection - Common for both tabs */}
            <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pilih Muzakki</span>
                <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setSuccess(false); setError(''); }} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 focus:border-primary focus:ring-primary">
                  <option value="">Pilih dari database warga...</option>
                  {muzakkiList.map(m => <option key={m.id} value={m.id}>{m.nama_kepala_keluarga} - {m.nama_kk}</option>)}
                </select>
              </label>
            </div>

            <div className="transition-all duration-300">
              {/* Tab: Form Pembayaran (Direct Nominal) */}
              {activeTab === 'form' && (
                <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">payments</span>
                    <h3 className="text-lg font-bold">Nominal Pembayaran</h3>
                  </div>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Nominal Zakat Maal (Rp)</span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">Rp</span>
                      <input
                        type="text"
                        value={formatRupiah(directNominal)}
                        onChange={(e) => setDirectNominal(parseRupiah(e.target.value))}
                        className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 pl-12 pr-4 text-lg font-bold focus:border-primary focus:ring-primary"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Masukkan nominal pembayaran secara langsung jika sudah diketahui nilainya atau dari hasil perhitungan AI Asisten.</p>
                  </label>
                </div>
              )}

              {/* Tab: Kalkulator */}
              {activeTab === 'kalkulator' && (
                <div className="space-y-8">
                  {/* Harta Fields */}
                  <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary">account_balance</span>
                      <h3 className="text-lg font-bold">Rincian Harta</h3>
                    </div>
                    {fields.map(f => (
                      <label key={f.label} className="flex flex-col gap-1.5">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-base">{f.icon}</span> {f.label}
                        </span>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{f.isGram ? 'gram' : 'Rp'}</span>
                          <input type="number" value={f.value || ''} onChange={e => f.set(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 pl-14 pr-4 focus:border-primary focus:ring-primary" placeholder="0" />
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Nisab Check & Result */}
                  <div className={`border-2 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 transition-colors ${melewatiNisab ? 'bg-primary/20 dark:bg-primary/10 border-primary' : 'bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-3xl ${melewatiNisab ? 'text-primary' : 'text-slate-400'}`}>
                        {melewatiNisab ? 'check_circle' : 'info'}
                      </span>
                      <div>
                        <p className="text-sm font-medium uppercase tracking-wider text-slate-500">Total Harta: {fmt(totalHarta)}</p>
                        <p className="text-sm text-slate-500">Nisab: {configLoading ? '...' : `${fmt(nisabRp)} (${nisabEmasGr}g emas)`}</p>
                      </div>
                    </div>
                    {melewatiNisab ? (
                      <>
                        <span className="text-sm font-medium text-primary uppercase tracking-[0.2em]">Zakat Maal Terutang (2.5%)</span>
                        <h2 className="text-4xl font-black">{fmt(calcNominalZakat)}</h2>
                      </>
                    ) : (
                      <p className="text-slate-500 text-sm italic">Harta belum mencapai nisab. Tidak wajib Zakat Maal.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Common Actions */}
            {((activeTab === 'form' && directNominal > 0) || (activeTab === 'kalkulator' && melewatiNisab)) && (
              <div className="flex flex-col gap-4 mb-10 transition-opacity duration-300">
                {!isUser && (
                  <>
                    <button onClick={handleSave} disabled={disableActions} className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-background-dark font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                      <span className="material-symbols-outlined">verified</span> {saving ? 'Menyimpan...' : 'Konfirmasi & Simpan'}
                    </button>
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-primary/20"></div>
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">atau bayar digital</span>
                      <div className="flex-1 h-px bg-primary/20"></div>
                    </div>
                  </>
                )}
                <button onClick={handleMayar} disabled={disableActions} className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 font-bold py-4 rounded-xl shadow-sm transition-all group disabled:opacity-50">
                  <span className="material-symbols-outlined text-primary">payments</span>
                  Bayar via Mayar — {fmt(finalNominalZakat)}
                  <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
