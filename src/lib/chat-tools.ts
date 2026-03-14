import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { supabase } from './supabase';

export const getConfig = tool(
  async () => {
    const { data, error } = await supabase.from('config').select('key, value');
    if (error) return `Error fetching config: ${error.message}`;
    if (!data || data.length === 0) return 'Tidak ada konfigurasi ditemukan.';
    return data.map((c: any) => `${c.key}: ${c.value}`).join('\n');
  },
  {
    name: 'getConfig',
    description: 'Mengambil nilai konfigurasi saat ini dari database, termasuk harga emas per gram, harga beras per kg, nisab zakat mal dalam gram emas, dan nilai 1 sha dalam kg. Gunakan tool ini ketika user menanyakan tentang referensi harga atau konfigurasi zakat.',
    schema: z.object({}),
  }
);

export const lookupMuzakki = tool(
  async ({ query }) => {
    let q = supabase.from('muzakki').select('nama_kk, nama_kepala_keluarga, rt, rw, jumlah_anggota, status_aktif');
    if (query) {
      q = q.or(`nama_kk.ilike.%${query}%,nama_kepala_keluarga.ilike.%${query}%,rt.eq.${query}`);
    }
    const { data, error } = await q.limit(20);
    if (error) return `Error: ${error.message}`;
    if (!data || data.length === 0) return `Tidak ditemukan muzakki dengan pencarian "${query}".`;
    return data.map((m: any) => `- ${m.nama_kepala_keluarga} (KK: ${m.nama_kk}) | RT ${m.rt}/RW ${m.rw} | ${m.jumlah_anggota} jiwa | ${m.status_aktif ? 'Aktif' : 'Non-aktif'}`).join('\n');
  },
  {
    name: 'lookupMuzakki',
    description: 'Mencari data muzakki (pembayar zakat) berdasarkan nama atau nomor RT. Memberikan informasi nama, KK, RT/RW, jumlah anggota keluarga, dan status aktif.',
    schema: z.object({
      query: z.string().describe('Nama muzakki atau nomor RT untuk dicari, misalnya "Ahmad" atau "01"'),
    }),
  }
);

export const getDistribusi = tool(
  async ({ rt }) => {
    let q = supabase.from('distribusi').select('*, mustahiq(nama, rt, kategori_asnaf)');
    if (rt) q = q.eq('mustahiq.rt', rt);
    const { data, error } = await q;
    if (error) return `Error: ${error.message}`;
    if (!data || data.length === 0) return rt ? `Belum ada distribusi untuk RT ${rt}.` : 'Belum ada data distribusi.';
    
    const total = data.length;
    const totalUang = data.reduce((s: number, d: any) => s + (d.jumlah_uang || 0), 0);
    const totalBeras = data.reduce((s: number, d: any) => s + (d.jumlah_beras_kg || 0), 0);
    
    let result = `Total distribusi: ${total} penerima\n`;
    result += `Total uang: Rp ${totalUang.toLocaleString('id-ID')}\n`;
    result += `Total beras: ${totalBeras} Kg\n\n`;
    result += `Detail (maks 15):\n`;
    result += data.slice(0, 15).map((d: any) => {
      const m = d.mustahiq as any;
      return `- ${m?.nama || '-'} (RT ${m?.rt || '-'}, ${m?.kategori_asnaf || '-'}): Rp ${(d.jumlah_uang || 0).toLocaleString('id-ID')} + ${d.jumlah_beras_kg || 0} Kg`;
    }).join('\n');
    return result;
  },
  {
    name: 'getDistribusi',
    description: 'Mengambil data distribusi zakat kepada mustahiq (penerima). Bisa difilter berdasarkan RT. Menampilkan total penerima, total uang, total beras, dan detail per mustahiq.',
    schema: z.object({
      rt: z.string().optional().describe('Nomor RT untuk filter (opsional), misalnya "01" atau "02"'),
    }),
  }
);

export const getLaporan = tool(
  async () => {
    // Fetch all sources in parallel
    const [fitrahRes, maalRes, infaqRes, distribusiRes] = await Promise.all([
      supabase.from('zakat_fitrah').select('total_setara_uang, nominal_beras_kg, jenis_bayar, status'),
      supabase.from('zakat_mal').select('nominal_zakat, status'),
      supabase.from('infaq_sedekah').select('nominal, status'),
      supabase.from('distribusi').select('jumlah_uang, jumlah_beras_kg'),
    ]);

    const fitrah = fitrahRes.data || [];
    const maal = maalRes.data || [];
    const infaq = infaqRes.data || [];
    const distribusi = distribusiRes.data || [];

    const fitrahSelesai = fitrah.filter((f: any) => f.status === 'selesai');
    const fitrahUang = fitrahSelesai.filter((f: any) => f.jenis_bayar === 'uang').reduce((s: number, f: any) => s + (f.total_setara_uang || 0), 0);
    const fitrahBeras = fitrahSelesai.filter((f: any) => f.jenis_bayar === 'beras').reduce((s: number, f: any) => s + (f.nominal_beras_kg || 0), 0);
    const maalTotal = maal.filter((m: any) => m.status === 'selesai').reduce((s: number, m: any) => s + (m.nominal_zakat || 0), 0);
    const infaqTotal = infaq.filter((i: any) => i.status === 'selesai').reduce((s: number, i: any) => s + (i.nominal || 0), 0);
    const distUang = distribusi.reduce((s: number, d: any) => s + (d.jumlah_uang || 0), 0);
    const distBeras = distribusi.reduce((s: number, d: any) => s + (d.jumlah_beras_kg || 0), 0);

    const totalPenerimaan = fitrahUang + maalTotal + infaqTotal;
    const pending = fitrah.filter((f: any) => f.status === 'pending').length + maal.filter((m: any) => m.status === 'pending').length + infaq.filter((i: any) => i.status === 'pending').length;

    return `=== LAPORAN RINGKAS ZAKATDESA ===
Penerimaan:
- Zakat Fitrah (Uang): Rp ${fitrahUang.toLocaleString('id-ID')} (${fitrahSelesai.filter((f: any) => f.jenis_bayar === 'uang').length} transaksi)
- Zakat Fitrah (Beras): ${fitrahBeras} Kg (${fitrahSelesai.filter((f: any) => f.jenis_bayar === 'beras').length} transaksi)
- Zakat Mal: Rp ${maalTotal.toLocaleString('id-ID')} (${maal.filter((m: any) => m.status === 'selesai').length} transaksi)
- Infaq/Sedekah: Rp ${infaqTotal.toLocaleString('id-ID')} (${infaq.filter((i: any) => i.status === 'selesai').length} transaksi)
- TOTAL UANG TERKUMPUL: Rp ${totalPenerimaan.toLocaleString('id-ID')}

Distribusi:
- Uang tersalurkan: Rp ${distUang.toLocaleString('id-ID')}
- Beras tersalurkan: ${distBeras} Kg
- Jumlah penerima: ${distribusi.length}

Sisa:
- Uang: Rp ${(totalPenerimaan - distUang).toLocaleString('id-ID')}
- Beras: ${(fitrahBeras - distBeras).toFixed(1)} Kg

Transaksi pending: ${pending}`;
  },
  {
    name: 'getLaporan',
    description: 'Mengambil laporan ringkas lengkap mencakup total penerimaan (zakat fitrah uang & beras, zakat mal, infaq), total distribusi (uang & beras), sisa dana, dan jumlah transaksi pending.',
    schema: z.object({}),
  }
);

export const allTools = [getConfig, lookupMuzakki, getDistribusi, getLaporan];
