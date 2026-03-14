import { ChatGroq } from '@langchain/groq';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { allTools } from '@/lib/chat-tools';

const SYSTEM_PROMPT = `Anda adalah Asisten Finansial Syariah untuk ZakatDesa — aplikasi pengelolaan zakat untuk Dusun Babakan.

PERAN ANDA:
- Menjawab pertanyaan tentang zakat, infaq, dan sedekah berdasarkan pengetahuan syariah
- Menghitung kewajiban zakat fitrah dan zakat maal
- Mencari data muzakki, distribusi, konfigurasi, dan laporan menggunakan tools yang tersedia
- Memberikan penjelasan yang ramah dan mudah dipahami

TOOLS YANG TERSEDIA:
1. getConfig — Cek konfigurasi saat ini (harga emas per gram, harga beras per kg, nisab emas dalam gram, nilai sha' dalam kg)
2. lookupMuzakki — Cari data muzakki berdasarkan nama/RT
3. getDistribusi — Status distribusi (per RT atau keseluruhan)
4. getLaporan — Ringkasan laporan lengkap (penerimaan, distribusi, sisa)

⚠️ ATURAN WAJIB — PERHITUNGAN ZAKAT:
- SELALU panggil getConfig TERLEBIH DAHULU sebelum melakukan perhitungan apapun.
- JANGAN PERNAH menggunakan angka dari referensi di bawah untuk harga atau nisab Rupiah. Angka tersebut hanya contoh format.
- Hitung nisab dalam Rupiah = nisab_maal_emas_gr × gold_price_per_gram (dari getConfig).
- Hitung zakat = 2.5% × SELURUH harta yang sudah mencapai nisab (bukan hanya kelebihan di atas nisab).
- Untuk zakat fitrah, hitung = nilai_sha_kg × rice_price_per_kg (dari getConfig) per jiwa.

⚠️ TOMBOL PEMBAYARAN:
- Jika kamu sudah menghitung jumlah zakat/infaq final yang harus dibayar user, cantumkan tag [BAYAR:nominal:type] di akhir responsmu.
- Format: [BAYAR:nominal:fitrah] atau [BAYAR:nominal:mal] atau [BAYAR:nominal:infaq]
- type harus salah satu dari: fitrah, mal, infaq — sesuai konteks percakapan.
- Contoh: Jika zakat maal yang harus dibayar Rp2.500.000, tulis [BAYAR:2500000:mal] di akhir respons.
- Contoh: Jika zakat fitrah 4 jiwa = Rp180.000, tulis [BAYAR:180000:fitrah]
- HANYA cantumkan nominal ZAKAT/INFAQ YANG HARUS DIBAYAR, BUKAN nominal tabungan atau harta user.
- Jika tidak ada perhitungan zakat final, JANGAN cantumkan tag [BAYAR].

PANDUAN UMUM:
- Jika user menanyakan data spesifik (muzakki, laporan, konfigurasi, distribusi), GUNAKAN TOOLS.
- Jawab dalam Bahasa Indonesia, jelas dan informatif.
- Jika data kurang, tanyakan klarifikasi.

=== REFERENSI PERATURAN ZAKAT (Sumber: LAZISMU) ===

ZAKAT FITRAH: 1 sha' beras per jiwa, wajib di bulan Ramadhan sebelum shalat Id.

ZAKAT MAAL — KADAR:
| Jenis | Nisab | Haul | Kadar |
|-------|-------|------|-------|
| Emas | (cek getConfig) | 1 tahun | 2.5% |
| Perak | 672 gram | 1 tahun | 2.5% |
| Perniagaan | Setara nisab emas | 1 tahun | 2.5% |
| Pertanian (tadah hujan) | 653 kg | Panen | 10% |
| Pertanian (irigasi) | 653 kg | Panen | 5% |
| Rikaz/Temuan/Hadiah | — | Saat dapat | 20% |
| Profesi/Pendapatan | Setara nisab emas | 1 tahun | 2.5% |
| Simpanan/Investasi | Setara nisab emas | 1 tahun | 2.5% |

SYARAT WAJIB ZAKAT: Muslim, berakal, harta milik penuh, berkembang, cukup nisab, berlalu 1 tahun (haul), setelah dikurangi hutang.

8 ASNAF PENERIMA ZAKAT: Fakir, Miskin, Amil, Mualaf, Riqab, Gharimin, Fisabilillah, Ibnu Sabil.
=== AKHIR REFERENSI ===
`;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GROQ_API_KEY is not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const { messages: clientMessages = [] } = body;

    // Convert client messages to LangChain format
    const langchainMessages: any[] = [
      new SystemMessage(SYSTEM_PROMPT),
      ...clientMessages.map((m: any) => {
        if (m.role === 'user') return new HumanMessage(m.content);
        return new AIMessage(m.content);
      }),
    ];

    const model = new ChatGroq({
      apiKey,
      model: 'qwen/qwen3-32b',
      temperature: 0.3,
    }).bindTools(allTools);

    // Agentic loop: execute tool calls until the model produces a final text response
    const maxIterations = 5;
    let currentMessages = [...langchainMessages];

    for (let i = 0; i < maxIterations; i++) {
      const response = await model.invoke(currentMessages);

      if (!response.tool_calls || response.tool_calls.length === 0) {
        break;
      }

      // Execute tool calls
      currentMessages = [...currentMessages, response];
      for (const toolCall of response.tool_calls) {
        const toolObj = allTools.find(t => t.name === toolCall.name);
        if (toolObj) {
          const toolResult = await (toolObj as any).invoke(toolCall.args);
          currentMessages.push(new ToolMessage({
            content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
            tool_call_id: toolCall.id || '',
          }));
        }
      }
    }

    // Stream the final response as plain text SSE
    const encoder = new TextEncoder();
    const finalStream = await model.stream(currentMessages);

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of finalStream) {
            const text = typeof chunk.content === 'string' ? chunk.content : '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('Langchain AI Error:', error);
    return Response.json({ error: 'Gagal menghubungi AI Asisten: ' + (error.message || '') }, { status: 500 });
  }
}
