'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from "@/components/Header";
import { supabase } from '@/lib/supabase';
import RoleGuard from '@/components/RoleGuard';

interface Mustahiq { id: string; nama: string; kategori_asnaf: string; }

export default function DistribusiPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'amil', 'supervisor']}>
      <DistribusiContent />
    </RoleGuard>
  );
}

function DistribusiContent() {
  const [mustahiqList, setMustahiqList] = useState<Mustahiq[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [sumber, setSumber] = useState<'fitrah' | 'maal' | 'infaq'>('fitrah');
  const [jenisBantuan, setJenisBantuan] = useState<'uang' | 'beras'>('uang');
  const [nominal, setNominal] = useState(0);
  const [nominalBeras, setNominalBeras] = useState(0);
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  // Balance tracking
  const [saldoFitrah, setSaldoFitrah] = useState(0);
  const [saldoFitrahBeras, setSaldoFitrahBeras] = useState(0);
  const [saldoMaal, setSaldoMaal] = useState(0);
  const [saldoInfaq, setSaldoInfaq] = useState(0);

  const fetchData = useCallback(async () => {
    const { data: m } = await supabase.from('mustahiq').select('id,nama,kategori_asnaf').eq('status_aktif', true).order('nama');
    if (m) setMustahiqList(m);
    const { data: h } = await supabase.from('distribusi').select('*, mustahiq(nama, kategori_asnaf)').order('created_at', { ascending: false }).limit(20);
    if (h) setHistory(h);

    // Calculate balances: total received - total distributed
    const { data: fitrah } = await supabase.from('zakat_fitrah').select('total_setara_uang, nominal_beras_kg, jenis_bayar').eq('status', 'selesai');
    const totalFitrahRp = fitrah?.filter(r => r.jenis_bayar !== 'beras').reduce((s, r) => s + (r.total_setara_uang || 0), 0) || 0;
    const totalFitrahKg = fitrah?.filter(r => r.jenis_bayar === 'beras').reduce((s, r) => s + (r.nominal_beras_kg || 0), 0) || 0;
    
    const { data: maal } = await supabase.from('zakat_mal').select('nominal_zakat').eq('status', 'selesai');
    const totalMaal = maal?.reduce((s, r) => s + (r.nominal_zakat || 0), 0) || 0;
    const { data: infaq } = await supabase.from('infaq_sedekah').select('nominal').eq('status', 'selesai');
    const totalInfaq = infaq?.reduce((s, r) => s + (r.nominal || 0), 0) || 0;

    const { data: dist } = await supabase.from('distribusi').select('nominal, nominal_beras_kg, sumber_zakat, jenis_bantuan');
    
    const distFitrahRp = dist?.filter(d => d.sumber_zakat === 'fitrah' && d.jenis_bantuan !== 'beras').reduce((s, r) => s + (r.nominal || 0), 0) || 0;
    const distFitrahKg = dist?.filter(d => d.sumber_zakat === 'fitrah' && d.jenis_bantuan === 'beras').reduce((s, r) => s + (r.nominal_beras_kg || 0), 0) || 0;
    
    const distMaal = dist?.filter(d => d.sumber_zakat === 'maal').reduce((s, r) => s + (r.nominal || 0), 0) || 0;
    const distInfaq = dist?.filter(d => d.sumber_zakat === 'infaq').reduce((s, r) => s + (r.nominal || 0), 0) || 0;

    setSaldoFitrah(totalFitrahRp - distFitrahRp);
    setSaldoFitrahBeras(totalFitrahKg - distFitrahKg);
    setSaldoMaal(totalMaal - distMaal);
    setSaldoInfaq(totalInfaq - distInfaq);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedMustahiq = mustahiqList.find(m => m.id === selectedId);
  const currentBalanceRp = sumber === 'fitrah' ? saldoFitrah : sumber === 'maal' ? saldoMaal : saldoInfaq;

  useEffect(() => {
    if (sumber !== 'fitrah') setJenisBantuan('uang');
  }, [sumber]);

  const handleSave = async () => {
    if (!selectedId) return;

    // Balance validation
    if (jenisBantuan === 'uang') {
      if (nominal <= 0) return;
      if (nominal > currentBalanceRp) {
        setError(`Nominal melebihi saldo ${sumber} uang yang tersedia (Rp ${currentBalanceRp.toLocaleString('id-ID')}). Kurangi nominal atau pilih sumber dana lain.`);
        return;
      }
    } else {
      if (nominalBeras <= 0) return;
      if (nominalBeras > saldoFitrahBeras) {
        setError(`Beras melebihi stok yang tersedia (${saldoFitrahBeras.toFixed(1)} Kg).`);
        return;
      }
    }

    setSaving(true);
    setError('');
    const { error: e } = await supabase.from('distribusi').insert([{
      mustahiq_id: selectedId,
      kategori_asnaf: selectedMustahiq?.kategori_asnaf || 'fakir',
      sumber_zakat: sumber,
      jenis_bantuan: jenisBantuan,
      nominal: jenisBantuan === 'uang' ? nominal : 0,
      nominal_beras_kg: jenisBantuan === 'beras' ? nominalBeras : 0,
      catatan,
      periode: new Date().toISOString().slice(0, 7),
    }]);

    setSaving(false);
    if (e) {
      setError(`Gagal menyimpan distribusi: ${e.message}`);
    } else {
      setSuccess(true);
      setSelectedId(''); setNominal(0); setNominalBeras(0); setCatatan('');
      fetchData();
    }
  };

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const asnafLabel = (a: string) => a.charAt(0).toUpperCase() + a.slice(1);

  return (
    <>
      <Header title="Distribusi Zakat" />
      <div className="flex-1 overflow-y-auto w-full">
        <main className="px-6 py-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Distribusi Zakat ke Mustahiq</h1>
            <p className="text-slate-500 dark:text-slate-400">Catat penyaluran zakat kepada mustahiq yang terdaftar.</p>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Stok Beras Fitrah', value: `${saldoFitrahBeras.toFixed(1)} Kg`, active: sumber === 'fitrah' && jenisBantuan === 'beras', isBeras: true },
              { label: 'Saldo Uang Fitrah', value: fmt(saldoFitrah), active: sumber === 'fitrah' && jenisBantuan === 'uang' },
              { label: 'Saldo Maal', value: fmt(saldoMaal), active: sumber === 'maal' },
              { label: 'Saldo Infaq', value: fmt(saldoInfaq), active: sumber === 'infaq' },
            ].map(b => (
              <div key={b.label} className={`p-4 rounded-xl border shadow-sm transition-all ${b.active ? 'bg-primary/10 border-primary/30 scale-[1.02]' : 'bg-white dark:bg-primary/5 border-primary/10'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{b.label}</p>
                <p className={`text-xl font-black mt-1 ${b.value.includes('-') ? 'text-red-400' : (b.isBeras ? 'text-amber-500' : '')}`}>{b.value}</p>
              </div>
            ))}
          </div>

          {success && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3 text-primary font-medium">
              <span className="material-symbols-outlined">check_circle</span> Distribusi berhasil dicatat!
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
              <span className="material-symbols-outlined">error</span>
              {error}
              <button onClick={() => setError('')} className="ml-auto"><span className="material-symbols-outlined text-base">close</span></button>
            </div>
          )}

          {/* Form */}
          <div className="bg-white dark:bg-primary/5 p-6 rounded-xl border border-primary/10 shadow-sm space-y-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Pilih Mustahiq</span>
              <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setSuccess(false); setError(''); }} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 focus:border-primary focus:ring-primary">
                <option value="">Pilih penerima zakat...</option>
                {mustahiqList.map(m => <option key={m.id} value={m.id}>{m.nama} ({asnafLabel(m.kategori_asnaf)})</option>)}
              </select>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sumber Dana</span>
                <select value={sumber} onChange={e => { setSumber(e.target.value as any); setError(''); }} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 focus:border-primary focus:ring-primary">
                  <option value="fitrah">Zakat Fitrah</option>
                  <option value="maal">Zakat Maal</option>
                  <option value="infaq">Infaq/Sedekah</option>
                </select>
              </label>
              
              {/* Conditional rendering for jenis bantuan on Zakat Fitrah */}
              {sumber === 'fitrah' && (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bentuk Bantuan</span>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-primary/10">
                    <button
                      type="button"
                      onClick={() => setJenisBantuan('uang')}
                      className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${jenisBantuan === 'uang' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Uang (Rp)
                    </button>
                    <button
                      type="button"
                      onClick={() => setJenisBantuan('beras')}
                      className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${jenisBantuan === 'beras' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Beras (Kg)
                    </button>
                  </div>
                </label>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              {jenisBantuan === 'uang' ? (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nominal (Rp)</span>
                  <input type="number" value={nominal || ''} onChange={e => setNominal(parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-12 px-4 focus:border-primary focus:ring-primary text-xl font-bold" placeholder="0" />
                </label>
              ) : (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Jumlah Beras (Kg)</span>
                  <input type="number" step="0.1" value={nominalBeras || ''} onChange={e => setNominalBeras(parseFloat(e.target.value) || 0)} className="w-full rounded-lg border-amber-500/50 bg-amber-50 dark:bg-amber-900/10 h-12 px-4 focus:border-amber-500 focus:ring-amber-500 text-xl font-bold text-amber-600 dark:text-amber-500" placeholder="0" />
                </label>
              )}
            </div>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Catatan (opsional)</span>
              <input type="text" value={catatan} onChange={e => setCatatan(e.target.value)} className="w-full rounded-lg border border-primary/20 bg-white dark:bg-background-dark h-11 px-4 focus:border-primary focus:ring-primary" placeholder="Keterangan tambahan..." />
            </label>
            <button onClick={handleSave} disabled={saving || !selectedId || (jenisBantuan === 'uang' ? nominal <= 0 : nominalBeras <= 0)} className={`w-full flex items-center justify-center gap-3 text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 ${jenisBantuan === 'beras' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-primary shadow-primary/20 text-background-dark'}`}>
              <span className="material-symbols-outlined">{jenisBantuan === 'beras' ? 'rice_bowl' : 'local_shipping'}</span> {saving ? 'Menyimpan...' : 'Catat Distribusi'}
            </button>
          </div>

          {/* History */}
          <div className="bg-white dark:bg-primary/5 rounded-xl border border-primary/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-primary/10">
              <h3 className="font-bold text-lg">Riwayat Distribusi Terakhir</h3>
            </div>
            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-500">Belum ada riwayat distribusi.</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-primary/10">
                {history.map((h: any) => (
                  <div key={h.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <span className="material-symbols-outlined">{h.jenis_bantuan === 'beras' ? 'rice_bowl' : 'payments'}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{h.mustahiq?.nama || '-'}</p>
                        <p className="text-xs text-slate-500">{asnafLabel(h.kategori_asnaf)} · Bantuan {h.jenis_bantuan} · {new Date(h.created_at).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {h.jenis_bantuan === 'beras' ? (
                        <p className="font-bold text-amber-500 text-lg">{(h.nominal_beras_kg || 0).toFixed(1)} Kg</p>
                      ) : (
                        <p className="font-bold text-primary text-lg">{fmt(h.nominal || 0)}</p>
                      )}
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
