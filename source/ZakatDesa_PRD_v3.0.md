🌙

**SISTEM MANAJEMEN ZAKAT DESA**

dengan Asisten Finansial Syariah Berbasis AI

Product Requirements Document (PRD) · v1.0

Dibuat untuk: Vibecoding Competition Ramadhan 2026 --- Mayar

Tanggal: Maret 2026 \| Deadline Submit: 15 Maret 2026

**SEKSI 1**

**Executive Summary**

**1.1 Problem Statement**

Pengelolaan zakat di tingkat desa di Indonesia masih bersifat manual,
tidak transparan, dan rentan terhadap kesalahan perhitungan. Amil zakat
desa kerap mencatat penerimaan dan penyaluran menggunakan buku tulis
atau spreadsheet sederhana, sehingga sulit diaudit dan
dipertanggungjawabkan kepada mustahiq maupun donatur. Di sisi lain,
muzakki (pembayar zakat) tidak memiliki alat bantu yang mudah untuk
menghitung kewajiban zakat mereka secara akurat sesuai fikih Islam.

Kompetisi Vibecoding Ramadhan 2026 dari Mayar menantang pengembang untuk
membangun solusi yang bermakna menggunakan AI. Solusi ini menjawab
kebutuhan nyata komunitas Muslim Indonesia di tingkat akar rumput.

**1.2 Proposed Solution**

ZakatDesa adalah aplikasi web manajemen zakat berbasis AI yang dirancang
untuk LAZIS dan masyarakat umum. Aplikasi ini menggabungkan empat
kapabilitas utama:

-   Database Muzakki & Mustahiq: LAZIS dapat mengimpor dan mengelola
    data muzakki (per KK + jumlah anggota keluarga) serta data mustahiq
    yang sudah dimiliki. Menjadi fondasi auto-kalkulasi dan distribusi.

-   Manajemen zakat terstruktur: pencatatan Zakat Fitrah (auto-kalkulasi
    dari data KK), Zakat mal/Harta Benda (form khusus), Infaq/Sedekah,
    dan distribusi ke mustahiq.

-   Asisten Finansial Syariah berbasis AI: pengguna bertanya dalam
    bahasa natural (misal: \"Gaji saya 8 juta, tabungan 50 juta, berapa
    zakat saya?\") dan AI menghitung serta menjelaskan secara otomatis.

-   Integrasi Mayar Payment: setelah nominal dihitung, tombol \"Bayar
    Sekarang\" mengarahkan ke Mayar Payment Link atau Donation Form
    sehingga dana tersalur langsung dan terverifikasi.

**1.3 Success Criteria (KPI)**

  ---------------------- --------------- ---------------------------------
  **KPI**                **Target**      **Cara Ukur**

  Akurasi Kalkulasi      ≥ 97% kasus uji Benchmark 100 skenario Zakat mal
  Zakat AI               standar fikih   & fitrah

  Waktu Respons AI       ≤ 3 detik per   Median latency di jaringan 4G
                         query           Indonesia

  Auto-kalkulasi Fitrah  100% akurasi vs Verifikasi: jumlah KK × anggota ×
  dari DB                input manual    nilai satuan

  Konversi Pembayaran    ≥ 40% sesi yang Klik \"Bayar Sekarang\" / total
  Mayar                  memunculkan     kalkulasi selesai
                         nominal         

  Waktu Input Amil (per  \< 1 menit      Tes usability dengan 5 amil LAZIS
  KK)                    dengan data DB  nyata
                         tersedia        

  Uptime Aplikasi        ≥ 99% selama    Monitoring via UptimeRobot atau
                         periode         setara
                         kompetisi &     
                         demo            
  ---------------------- --------------- ---------------------------------

**SEKSI 2**

**User Experience & Functionality**

**2.1 User Personas**

  ---------------- ------------------------------------------------------
  **Nama**         Pak Haji Rohman --- Amil / Operator LAZIS

  **Profil**       Pengurus LAZIS berusia 50 tahun, berpengalaman
                   mengelola zakat tradisional, sudah memiliki data
                   muzakki dan mustahiq dalam bentuk buku/spreadsheet.
                   Ingin digitalisasi yang tidak mengubah alur kerja yang
                   sudah familiar.

  **Kebutuhan      Import data KK yang sudah ada, input penerimaan zakat
  Utama**          cepat dengan auto-kalkulasi, laporan rapi untuk
                   dilaporkan ke pengurus LAZIS dan takmir masjid.
  ---------------- ------------------------------------------------------

  ---------------- ------------------------------------------------------
  **Nama**         Siti Rahmawati --- Muzakki (Pembayar Zakat)

  **Profil**       Karyawan swasta berusia 32 tahun, terdaftar sebagai
                   muzakki di LAZIS. Ingin tahu kewajiban zakatnya tanpa
                   harus buka buku fikih dan bisa bayar langsung dari HP.

  **Kebutuhan      Kalkulator zakat instan (fitrah & maal), jawaban dalam
  Utama**          Bahasa Indonesia yang mudah dipahami, tombol bayar
                   langsung ke Mayar.
  ---------------- ------------------------------------------------------

  ---------------- ------------------------------------------------------
  **Nama**         Ustaz Fadhil --- Supervisor / Ketua LAZIS

  **Profil**       Memahami fikih zakat, bertanggung jawab atas akurasi
                   distribusi ke 8 asnaf dan pelaporan ke jamaah.

  **Kebutuhan      Dashboard ringkasan, manajemen database mustahiq,
  Utama**          konfirmasi bahwa perhitungan sesuai nisab & haul yang
                   berlaku.
  ---------------- ------------------------------------------------------

**2.2 User Stories & Acceptance Criteria**

+--------------------------+-------------------------------------------+
| **User Story**           | **Acceptance Criteria**                   |
+--------------------------+-------------------------------------------+
| **US-01 Sebagai amil,    | -   Halaman daftar muzakki: tampil nama   |
| saya ingin mengelola     |     KK, nama kepala keluarga, jumlah      |
| database muzakki (per    |     anggota keluarga, RT/RW.              |
| KK) yang dimiliki        |                                           |
| LAZIS.**                 | -   Amil dapat menambah, mengedit, dan    |
|                          |     menonaktifkan data muzakki.           |
|                          |                                           |
|                          | -   Import massal via file CSV/Excel dari |
|                          |     data LAZIS yang sudah ada.            |
|                          |                                           |
|                          | -   Pencarian muzakki by nama atau nomor  |
|                          |     KK menghasilkan hasil dalam \< 1      |
|                          |     detik.                                |
|                          |                                           |
|                          | -   Histori transaksi zakat setiap        |
|                          |     muzakki dapat dilihat dari halaman    |
|                          |     profilnya.                            |
+--------------------------+-------------------------------------------+
| **US-02 Sebagai amil,    | -   Halaman daftar mustahiq: tampil nama, |
| saya ingin mengelola     |     no KK, jumlah anggota keluarga,       |
| database mustahiq yang   |     RT/RW, kategori asnaf (8 golongan),   |
| dimiliki LAZIS.**        |     status aktif.                         |
|                          |                                           |
|                          | -   Amil dapat menambah, mengedit, dan    |
|                          |     menonaktifkan data mustahiq.          |
|                          |                                           |
|                          | -   Import massal via file CSV/Excel dari |
|                          |     data LAZIS yang sudah ada.            |
|                          |                                           |
|                          | -   Filter mustahiq berdasarkan kategori  |
|                          |     asnaf dan RT/RW.                      |
|                          |                                           |
|                          | -   Histori distribusi zakat yang         |
|                          |     diterima setiap mustahiq tersedia di  |
|                          |     profilnya.                            |
+--------------------------+-------------------------------------------+
| **US-03 Sebagai amil,    | -   Amil memilih nama muzakki dari        |
| saya ingin mencatat      |     database --- data jumlah anggota      |
| penerimaan Zakat Fitrah  |     keluarga terisi otomatis.             |
| dengan auto-kalkulasi    |                                           |
| dari data KK.**          | -   Sistem langsung menghitung: jumlah    |
|                          |     anggota × 2,5 kg beras (atau nilai    |
|                          |     uang setara yang dikonfigurasi di     |
|                          |     dashboard).                           |
|                          |                                           |
|                          | -   Amil dapat mengedit nominal akhir     |
|                          |     jika ada perbedaan aktual (misal      |
|                          |     anggota keluarga berubah).            |
|                          |                                           |
|                          | -   Pilihan jenis pembayaran: beras (kg)  |
|                          |     atau uang (Rp) --- keduanya bisa      |
|                          |     dicampur per transaksi.               |
|                          |                                           |
|                          | -   Data tersimpan real-time dan          |
|                          |     terupdate di dashboard ringkasan.     |
|                          |                                           |
|                          | -   Tombol \"Terima via Mayar\" tersedia  |
|                          |     untuk pembayaran digital.             |
+--------------------------+-------------------------------------------+
| **US-04 Sebagai amil,    | -   Form Zakat mal terpisah di dashboard |
| saya ingin mencatat dan  |     dengan field: nama muzakki (dari DB), |
| mengelola Zakat mal /   |     jenis harta (penghasilan / tabungan / |
| Harta Benda.**           |     emas / investasi / perdagangan),      |
|                          |     nominal per jenis harta, total harta, |
|                          |     nisab referensi (dari config),        |
|                          |     nominal zakat terhitung (2,5% ×       |
|                          |     total).                               |
|                          |                                           |
|                          | -   Sistem menampilkan otomatis apakah    |
|                          |     harta telah mencapai nisab dan haul.  |
|                          |                                           |
|                          | -   Amil dapat mengedit nominal zakat     |
|                          |     jika muzakki melakukan penyesuaian.   |
|                          |                                           |
|                          | -   Riwayat Zakat mal per muzakki        |
|                          |     tersimpan dan dapat dilihat per tahun |
|                          |     hijriah.                              |
|                          |                                           |
|                          | -   Tombol \"Bayar via Mayar\" muncul     |
|                          |     setelah nominal dikonfirmasi.         |
+--------------------------+-------------------------------------------+
| **US-04b Sebagai admin,  | -   Admin dapat membuat akun baru dengan  |
| saya ingin membuat akun  |     role: admin, amil, atau supervisor.   |
| amil dan mengatur        |                                           |
| penugasan RT-nya.**      | -   Untuk akun amil, admin menentukan     |
|                          |     satu atau lebih RT yang ditugaskan    |
|                          |     melalui halaman \"Penugasan Amil\".   |
|                          |                                           |
|                          | -   Admin dapat mengubah penugasan RT     |
|                          |     amil kapan saja; perubahan berlaku    |
|                          |     langsung.                             |
|                          |                                           |
|                          | -   Admin dapat menonaktifkan akun (bukan |
|                          |     menghapus) --- riwayat transaksi      |
|                          |     tetap tersimpan.                      |
|                          |                                           |
|                          | -   Halaman manajemen user menampilkan    |
|                          |     daftar semua user, role, status       |
|                          |     aktif, dan RT penugasan (khusus       |
|                          |     amil).                                |
+--------------------------+-------------------------------------------+
| **US-04c Sebagai amil,   | -   Dropdown / pencarian muzakki hanya    |
| saat membuka form input  |     menampilkan KK dari RT yang ada di    |
| zakat, saya hanya bisa   |     amil_rt_assignments milik amil yang   |
| melihat data muzakki di  |     login.                                |
| RT yang ditugaskan       |                                           |
| kepada saya.**           | -   Filter ini diterapkan di level query  |
|                          |     server (RLS Supabase) --- bukan hanya |
|                          |     di UI.                                |
|                          |                                           |
|                          | -   Jika amil mencoba mengakses muzakki   |
|                          |     di luar RT via API langsung, server   |
|                          |     mengembalikan 403 Forbidden.          |
|                          |                                           |
|                          | -   Banner informasi di halaman input     |
|                          |     menampilkan: \"Anda ditugaskan di RT: |
|                          |     \[daftar RT\]\".                      |
|                          |                                           |
|                          | -   Supervisor dan admin tidak memiliki   |
|                          |     batasan RT --- bisa melihat semua     |
|                          |     data.                                 |
+--------------------------+-------------------------------------------+
| **US-05 Sebagai muzakki, | -   AI menerima input teks bebas dalam    |
| saya ingin bertanya      |     Bahasa Indonesia.                     |
| kepada AI tentang        |                                           |
| kewajiban zakat saya.**  | -   AI mengidentifikasi jenis zakat       |
|                          |     (fitrah / maal) dan mengekstrak       |
|                          |     parameter keuangan.                   |
|                          |                                           |
|                          | -   AI menampilkan rincian perhitungan    |
|                          |     (nisab, haul, kadar, nominal).        |
|                          |                                           |
|                          | -   Jika data kurang, AI bertanya         |
|                          |     lanjutan (multi-turn) --- tidak       |
|                          |     menebak.                              |
|                          |                                           |
|                          | -   Respons muncul dalam ≤ 3 detik.       |
+--------------------------+-------------------------------------------+
| **US-06 Sebagai muzakki, | -   Tombol \"Bayar Zakat Sekarang\"       |
| saya ingin membayar      |     muncul otomatis setelah nominal       |
| zakat via Mayar setelah  |     dikonfirmasi.                         |
| nominal dihitung.**      |                                           |
|                          | -   Mayar Payment Link terbuka dengan     |
|                          |     nominal pre-filled.                   |
|                          |                                           |
|                          | -   Link unik per sesi; tidak bisa        |
|                          |     dimanipulasi dari sisi klien.         |
|                          |                                           |
|                          | -   Konfirmasi pembayaran masuk ke        |
|                          |     dashboard amil via webhook Mayar.     |
+--------------------------+-------------------------------------------+
| **US-07 Sebagai amil,    | -   Amil memilih nama mustahiq dari       |
| saya ingin               |     database --- kategori asnaf terisi    |
| mendistribusikan zakat   |     otomatis.                             |
| ke mustahiq dari         |                                           |
| database.**              | -   Sistem memvalidasi: total distribusi  |
|                          |     tidak melebihi saldo zakat terkumpul. |
|                          |                                           |
|                          | -   Riwayat distribusi per mustahiq       |
|                          |     tercatat lengkap.                     |
|                          |                                           |
|                          | -   Export riwayat ke PDF dalam 1 klik.   |
+--------------------------+-------------------------------------------+
| **US-08 Sebagai          | -   Halaman Konfigurasi: nilai uang per   |
| supervisor, saya ingin   |     2,5 kg beras (Rp), nilai nisab maal   |
| mengkonfigurasi nilai    |     (gram emas atau Rp), nilai emas per   |
| satuan zakat di          |     gram referensi, tahun hijriah aktif.  |
| dashboard.**             |                                           |
|                          | -   Perubahan config langsung             |
|                          |     mempengaruhi auto-kalkulasi Zakat     |
|                          |     Fitrah baru.                          |
|                          |                                           |
|                          | -   Riwayat perubahan config tercatat     |
|                          |     dengan timestamp dan nama editor.     |
+--------------------------+-------------------------------------------+

**2.3 Non-Goals (Tidak Dibangun di MVP)**

-   Fitur multi-desa / multi-cabang --- MVP fokus pada satu desa.

-   Aplikasi mobile native (iOS/Android) --- cukup Progressive Web App
    (PWA) yang responsif.

-   Integrasi BAZNAS pusat atau sistem pemerintah daerah.

-   Pengelolaan wakaf (akan dipertimbangkan di v2.0).

-   Fatwa atau konsultasi fikih mendalam --- AI hanya menghitung, bukan
    berfatwa.

**SEKSI 3**

**AI System Requirements**

**3.1 Fitur: Asisten Finansial Syariah**

**Deskripsi Kapabilitas**

AI bertindak sebagai asisten zakat yang mampu memahami input bahasa
natural dari pengguna, mengekstrak parameter keuangan yang relevan,
menerapkan aturan fikih zakat yang berlaku, dan menghasilkan perhitungan
akurat beserta penjelasan yang mudah dipahami.

**Contoh Interaction Flow**

  ---------------- ------------------------------------------------------
  **Input          \"Gaji saya 8 juta sebulan, tabungan saya 50 juta,
  Pengguna**       berapa zakat saya tahun ini?\"

  **Respons AI**   Menghitung Zakat mal: Penghasilan tahunan Rp
                   96.000.000. Tabungan Rp 50.000.000. Total harta Rp
                   146.000.000. Nisab 2026 (setara 85g emas ≈ Rp
                   85.000.000). Karena melebihi nisab dan sudah haul,
                   zakat = 2,5% × Rp 146.000.000 = Rp 3.650.000/tahun.

  **Tindakan       Tombol \"Bayar Rp 3.650.000 via Mayar\" muncul
  Lanjutan**       otomatis.
  ---------------- ------------------------------------------------------

**Jenis Zakat yang Didukung AI**

-   Zakat mal: penghasilan, tabungan, emas/perak, investasi,
    perdagangan

-   Zakat Fitrah: per jiwa tanggungan, dengan referensi nilai fidyah
    daerah

-   Infaq & Sedekah: penghitungan opsional / rekomendasi berdasarkan
    preferensi pengguna

-   Zakat Profesi: metode haul bulanan vs tahunan --- AI menjelaskan
    perbedaannya

**Persyaratan Teknis AI**

-   Model: Claude claude-sonnet-4-20250514 via Anthropic API.

-   Prompt engineering: sistem prompt mencakup rumus nisab terkini,
    nilai emas referensi, dan panduan fikih BAZNAS. Di-update setiap
    awal tahun hijriah.

-   Multi-turn conversation: riwayat percakapan dikirim setiap request
    untuk konteks berkelanjutan.

-   Output terstruktur: AI mengembalikan JSON {jenis_zakat, nominal,
    rincian_perhitungan, pesan_penjelasan} untuk keperluan render UI dan
    integrasi Mayar.

-   Fallback: jika AI tidak dapat menghitung (data tidak cukup), AI
    wajib bertanya klarifikasi --- tidak boleh menebak.

**3.2 Integrasi Mayar Payment**

**Flow Integrasi**

-   Step 1: AI mengembalikan nominal zakat dalam respons JSON.

-   Step 2: Frontend memanggil Mayar API untuk membuat Payment Link
    dinamis dengan amount pre-filled.

-   Step 3: Pengguna diarahkan ke Mayar Checkout (in-app webview atau
    tab baru).

-   Step 4: Setelah pembayaran sukses, webhook Mayar memperbarui status
    transaksi di database ZakatDesa.

-   Step 5: Dashboard amil secara otomatis mencatat penerimaan dari
    Mayar.

  ---------------- ------------------------------------------------------
  **API yang       Mayar Payment Link API / Donation Form API
  Digunakan**      

  **Nilai Plus     Integrasi Mayar memberikan poin tambahan sesuai
  Kompetisi**      ketentuan lomba

  **Keamanan**     API Key Mayar disimpan di environment variable
                   server-side --- tidak pernah dikirim ke klien

  **Fallback**     Jika Mayar tidak tersedia, tampilkan nomor rekening
                   amil desa sebagai alternatif
  ---------------- ------------------------------------------------------

**3.3 Evaluation Strategy**

**Benchmark Dataset**

-   50 skenario kalkulasi Zakat mal (variasi penghasilan, tabungan,
    emas, utang).

-   20 skenario zakat fitrah (variasi jumlah jiwa, pembayaran beras vs
    uang, daerah berbeda).

-   10 skenario edge case (penghasilan di bawah nisab, gabungan aset,
    pertanyaan ambigu).

**Kriteria Lulus Evaluasi**

  ----------------- ------------------------------------------------------
  **Akurasi         ≥ 97% hasil kalkulasi dalam margin ±1% dari nilai
  Nominal**         referensi manual

  **Clarification   100% edge case memicu pertanyaan klarifikasi (tidak
  Rate**            menebak)

  **Bahasa & Tone** Semua respons dalam Bahasa Indonesia yang sopan dan
                    sesuai konteks syariah

  **Latency P95**   ≤ 5 detik untuk 95th percentile request di jaringan
                    simulasi Indonesia

  **Integrasi       100% nominal yang dihitung berhasil menghasilkan
  Mayar**           Payment Link valid
  ----------------- ------------------------------------------------------

**SEKSI 4**

**Technical Specifications**

**4.1 Architecture Overview**

ZakatDesa menggunakan arsitektur web modern dengan pemisahan concern
yang jelas antara frontend, backend API, AI layer, dan payment layer.

  ---------------- ------------------------------------------------------
  **Frontend**     React.js (Vite) + Tailwind CSS --- Single Page
                   Application responsif / PWA

  **Backend**      Node.js + Express.js atau Next.js API Routes --- REST
                   API

  **Database**     PostgreSQL (via Supabase) --- penyimpanan transaksi,
                   pengguna, konfigurasi nisab

  **AI Layer**     Anthropic Claude API --- dipanggil server-side, output
                   JSON terstruktur

  **Payment        Mayar Payment Link API / Donation Form --- webhook
  Layer**          untuk konfirmasi

  **Hosting**      Vercel (frontend + serverless) + Supabase (database)
                   --- free tier cukup untuk MVP

  **Auth**         Supabase Auth --- role-based: admin / amil (dengan
                   filter RT) / supervisor
  ---------------- ------------------------------------------------------

**4.2 Data Model**

**Master Data (Dimiliki LAZIS)**

-   muzakki: id, nama_kk, nama_kepala_keluarga, no_kk, jumlah_anggota,
    rt, rw, telepon, status_aktif, created_at, updated_at

-   mustahiq: id, nama, no_kk, jumlah_anggota, rt, rw, kategori_asnaf
    (enum:
    fakir/miskin/amil/mualaf/riqab/gharim/fisabilillah/ibnu_sabil),
    alamat, telepon, status_aktif, created_at, updated_at

**Transaksi Zakat**

-   zakat_fitrah: id, muzakki_id (FK), jumlah_anggota_aktual,
    jenis_bayar (beras/uang), nominal_beras_kg, nominal_uang,
    total_setara_uang, metode_pembayaran, mayar_payment_id, status,
    created_at, amil_id (FK)

-   Zakat_mal: id, muzakki_id (FK), tahun_hijriah, penghasilan_tahunan,
    tabungan, emas_gram, nilai_investasi, nilai_perdagangan,
    total_harta, nisab_referensi, nominal_zakat, catatan,
    mayar_payment_id, status, created_at, amil_id (FK)

-   infaq_sedekah: id, muzakki_id (FK, nullable), nama_donatur, nominal,
    catatan, mayar_payment_id, status, created_at

-   distribusi: id, mustahiq_id (FK), kategori_asnaf, nominal,
    sumber_zakat (fitrah/maal/infaq), periode, catatan, amil_id (FK),
    created_at

**User & Role Management**

-   users: id, nama, email, role (enum: admin/amil/supervisor),
    status_aktif, supabase_auth_id, created_by (FK → users), created_at

-   amil_rt_assignments: id, amil_id (FK → users), rt, rw, assigned_by
    (FK → users), assigned_at --- tabel pivot yang menentukan RT mana
    yang boleh diakses oleh amil tertentu

**Supporting Tables**

-   ai_sessions: id, user_id, messages_json, zakat_type, final_amount,
    mayar_link_id, created_at

-   config: id, key (nisab_maal_rp / nilai_emas_per_gram /
    nilai_2_5kg_beras_rp / tahun_hijriah), value, updated_by (FK →
    users), updated_at

**4.3 Integration Points**

  ---------------- ------------------------------------------------------
  **Anthropic      POST /v1/messages --- model claude-sonnet-4-20250514,
  Claude API**     system prompt berisi rumus fikih, history conversation
                   multi-turn

  **Mayar Payment  POST untuk buat payment link dinamis dengan amount,
  Link API**       title, dan description. Webhook GET/POST untuk
                   konfirmasi

  **Supabase       JWT-based auth, RLS (Row Level Security) untuk isolasi
  Auth**           data per desa

  **Export         jsPDF + autoTable untuk PDF, SheetJS untuk Excel ---
  Laporan**        diproses di server
  ---------------- ------------------------------------------------------

**4.4 Security & Privacy**

-   API Key Anthropic & Mayar: disimpan di server environment variables
    (\`.env\`), tidak pernah dikirim ke client.

-   Data muzakki bersifat sensitif (data keuangan): dienkripsi at-rest
    oleh Supabase, akses dibatasi via RLS.

-   RLS Filter RT untuk Amil: query ke tabel muzakki dan transaksi
    secara otomatis menambahkan klausa WHERE rt IN (SELECT rt FROM
    amil_rt_assignments WHERE amil_id = auth.uid()). Amil tidak dapat
    mengakses data di luar RT-nya bahkan jika memanipulasi request.

-   Hanya admin yang dapat membuat/menonaktifkan akun user dan amil,
    serta mengatur penugasan RT.

-   Tidak ada penyimpanan data kartu kredit/rekening: semua pembayaran
    diproses sepenuhnya oleh Mayar.

-   AI conversation log: disimpan untuk keperluan audit fikih, tidak
    dibagikan ke pihak ketiga.

-   Input sanitization: semua input pengguna di-sanitize sebelum dikirim
    ke AI prompt untuk mencegah prompt injection.

**SEKSI 5**

**Risks & Roadmap**

**5.1 Phased Rollout**

**MVP --- Untuk Kompetisi (Submit 15 Maret 2026)**

-   Role Management: admin dapat membuat akun amil & supervisor,
    mengatur penugasan RT per amil.

-   RT-based Data Filtering: amil hanya melihat data muzakki di RT yang
    ditugaskan (enforced via Supabase RLS).

-   Database Muzakki: CRUD + import CSV, field nama KK, no KK, jumlah
    anggota, RT/RW.

-   Database Mustahiq: CRUD + import CSV, field no KK, jumlah anggota,
    RT/RW, kategori asnaf.

-   Zakat Fitrah: auto-kalkulasi dari data KK, editable, pilihan
    beras/uang.

-   Zakat mal: form lengkap per jenis harta benda, auto-hitung 2,5%
    jika nisab terpenuhi.

-   Asisten Finansial Syariah AI: kalkulator zakat via chat natural
    language.

-   Integrasi Mayar: Payment Link otomatis setelah kalkulasi selesai.

-   Dashboard ringkasan & konfigurasi nilai satuan zakat.

**v1.1 --- Post Kompetisi (April--Mei 2026)**

-   Zakat mal lengkap: emas/perak, investasi saham, perdagangan.

-   Export laporan PDF & Excel.

-   Notifikasi WhatsApp untuk konfirmasi penerimaan & distribusi via
    Mayar atau Fonnte.

-   Konfigurasi nisab per daerah oleh admin.

**v2.0 --- Skalabilitas (Q3 2026)**

-   Multi-desa: satu platform, banyak instansi zakat.

-   Integrasi BAZNAS: sinkronisasi laporan ke sistem nasional.

-   Zakat wakaf: pengelolaan aset wakaf produktif.

-   Aplikasi mobile PWA yang dapat di-install di Android/iOS.

**5.2 Technical Risks**

  ---------------------- ------------ ---------------------------------------
  **Risiko**             **Level**    **Mitigasi**

  Akurasi AI di luar     **Sedang**   Strict system prompt + unit test 80+
  konteks yang                        skenario. AI wajib minta klarifikasi
  diprogramkan                        jika data tidak lengkap.

  Latensi API Claude di  **Sedang**   Response streaming (streaming: true)
  Indonesia                           untuk UX yang terasa responsif.
                                      Tampilkan typing indicator.

  Mayar API rate limit / **Rendah**   Implementasi retry logic + fallback
  downtime                            tampilkan info rekening manual amil.

  Perubahan nilai        **Rendah**   Nilai disimpan di tabel config DB, bisa
  nisab/emas                          diupdate admin tanpa deploy ulang kode.

  Deadline kompetisi 15  **Tinggi**   Prioritas keras pada fitur AI + Mayar
  Maret 2026                          sebagai differentiator. Fitur laporan
                                      bisa disederhanakan jika perlu.
  ---------------------- ------------ ---------------------------------------

**5.3 Differentiator untuk Kompetisi**

ZakatDesa memiliki proposisi nilai yang kuat untuk kompetisi Vibecoding
Ramadhan 2026:

-   Relevansi Ramadhan: zakat fitrah dan maal adalah isu paling aktual
    di bulan Ramadhan.

-   Vibecoding penuh: seluruh aplikasi dibangun menggunakan AI
    (Cursor/Claude/Copilot) --- sesuai tema kompetisi.

-   Integrasi Mayar: memenuhi syarat nilai plus kompetisi sekaligus
    menjadi fitur yang benar-benar berguna.

-   Dampak nyata: solusi menjawab kebutuhan komunitas Muslim Indonesia
    di tingkat grassroots, bukan sekedar demo teknis.

-   Scope terdefinisi: satu desa, satu musim, satu use case --- fokus
    dan feasible dalam 2 minggu.

**Semoga berkah, bawa pulang THR-nya! 🎉**

ZakatDesa --- Code the Vibe, Let Agentic AI Do the Rest!
