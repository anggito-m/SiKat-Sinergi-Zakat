# 🕌 SiKat - Sinergi Zakat

**SiKat** (Sinergi Zakat) adalah platform manajemen zakat modern yang lahir dari inisiatif untuk mendigitalkan seluruh alur proses bisnis zakat di lingkungan tempat tinggal pengembang (Dusun Babakan). Platform ini bukan sekadar alat administratif, melainkan solusi teknologi tepat guna yang dirancang untuk membangun kembali kepercayaan umat melalui transparansi mutlak.

## 🌟 Latar Belakang & Filosofi
Proyek ini berawal dari pengamatan terhadap proses pengelolaan zakat tradisional yang masih bersifat manual, rentan terhadap kesalahan pencatatan, dan kurangnya akses informasi bagi Muzakki mengenai penyaluran dana mereka.

SiKat hadir untuk melakukan **transformasi digital** dengan:
- **Digitalisasi Alur Bisnis**: Mengubah pencatatan manual di buku besar menjadi sistem cloud yang aman dan terpusat.
- **Transparansi Syariah**: Memastikan setiap rupiah zakat dapat dilacak posisinya (dari penerimaan hingga distribusi).
- **Pemberdayaan Desa**: Fokus pada Dusun Babakan sebagai *pilot project* untuk membuktikan bahwa teknologi tinggi dapat diimplementasikan di tingkat komunitas desa guna menumbuhkan ekonomi lokal.

> *"SiKat: Sinergi Zakat, Bersihkan Hati, Tumbuhkan Desa."*

---

## 👤 Profil Pengembang

Aplikasi ini dikembangkan dan dikelola oleh:
**Anggito Muhammad Amien**
- **GitHub**: [@anggito-m](https://github.com/anggito-m)
- **LinkedIn**: [Anggito Muhammad Amien](https://linkedin.com/in/anggito-muhammad-amien)
- **Website**: [Anggito](https://anggito.farmpix.cloud)

---

## 🚀 Fitur Utama

- **Dashboard Terpadu**: Statistik real-time penerimaan dan distribusi zakat.
- **AI Zakat Assistant**: Chatbot bertenaga AI untuk konsultasi hukum zakat dan bantuan sistem.
- **Pembayaran Digital**: Integrasi gerbang pembayaran untuk kemudahan donasi online.
- **Multi-Theme Support**: Mode Terang (Navy Blue) dan Mode Gelap (Vibrant Green).
- **Manajemen Muzakki & Mustahiq**: Pencatatan data yang aman dan terstruktur.
- **Verifikasi Syariah**: Alur kerja yang disesuaikan dengan prinsip dasar fikih zakat.

---

## 🏗️ Arsitektur Teknis

Platform ini dibangun dengan stack teknologi modern untuk menjamin performa dan skalabilitas:

### 1. Web Framework & UI
- **Next.js 16 (Turbopack)**: Framework React tingkat lanjut dengan optimasi server-side rendering.
- **Tailwind CSS v4**: Utility-first CSS untuk desain interface yang premium dan dinamis.
- **Supabase**: Backend-as-a-Service untuk database PostgreSQL, otentikasi user, dan storage.

### 2. AI & LangChain Chatbot
- **LangChain & AI SDK**: Mengintegrasikan model bahasa besar (LLM) seperti **Groq** atau **Gemini** untuk asisten pintar.
- **Context Awareness**: Chatbot memiliki akses ke alat (tools) internal untuk membantu navigasi dan pengecekan data zakat secara cerdas.

### 3. Payment Gateway Integration
- **Mayar Integration**: Mendukung berbagai metode pembayaran digital (QRIS, Virtual Account, E-Wallet).
- **Webhook System**: Sinkronisasi status pembayaran secara real-time antara gerbang pembayaran dan database internal.

---

## 📖 Cara Penggunaan

### Prasyarat
- Node.js versi terbaru
- Akun Supabase (untuk konfigurasi DB)
- API Keys untuk Groq/Gemini dan Mayar

### Instalasi & Menjalankan Lokal
1. **Clone repository**
2. **Install dependensi**
   ```bash
   npm install
   ```
3. **Konfigurasi Environment**
   Buat file `.env.local` dan isi sesuai dengan kredensial API yang diperlukan (Supabase URL, Anon Key, Groq API Key, dsb).
4. **Jalankan server pengembangan**
   ```bash
   npm run dev
   ```
5. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📄 Lisensi
Hak Cipta © 2026 **SiKat** - Dikembangkan oleh **Anggito Muhammad Amien**. Seluruh hak cipta dilindungi undang-undang.
