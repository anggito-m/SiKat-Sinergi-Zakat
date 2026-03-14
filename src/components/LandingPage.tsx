'use client';

import React from 'react';
import ThemeToggle from './ThemeToggle';

export default function LandingPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen font-display relative overflow-visible">

      {/* Background Decorative Wrapper - Clipped to prevent scroll leakage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Background Decorative Elements - Richer Gradients */}
        <div className="absolute top-0 left-0 w-full h-[1000px] bg-gradient-to-b from-primary/10 via-background-dark/0 to-transparent"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 blur-[150px] rounded-full"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-full"></div>

        {/* Floating Cards Background Decoration */}
        <div className="absolute top-[20%] right-[5%] w-32 h-32 bg-white/5 border border-white/10 rounded-2xl rotate-12 backdrop-blur-sm hidden lg:block shadow-2xl"></div>
        <div className="absolute bottom-[20%] left-[5%] w-24 h-24 bg-primary/5 border border-primary/10 rounded-xl -rotate-12 backdrop-blur-sm hidden lg:block shadow-xl"></div>
      </div>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-primary/20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#hero" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
              <span className="material-symbols-outlined text-primary text-3xl">payments</span>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-display">SiKat</span>
            </a>
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-sm font-medium hover:text-primary transition-colors" href="#tentang">Tentang</a>
              <a className="text-sm font-medium hover:text-primary transition-colors" href="#fitur">Fitur</a>
              <a className="text-sm font-medium hover:text-primary transition-colors" href="#cara-kerja">Cara Kerja</a>
              <a className="text-sm font-medium hover:text-primary transition-colors" href="#bantuan">Bantuan</a>
            </nav>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <ThemeToggle collapsed />
              </div>
              <a href="/login" className="hidden sm:flex bg-primary text-white dark:text-background-dark px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Masuk ke Aplikasi
              </a>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 cursor-pointer">
                <span className="material-symbols-outlined text-primary text-xl">person</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section id="hero" className="relative overflow-hidden py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="flex flex-col gap-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 w-fit">
                  <span className="material-symbols-outlined text-primary text-sm">verified_user</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Terverifikasi Syariah</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white font-display">
                  SiKat: Sinergi Zakat, <br />
                  <span className="text-primary italic">Bersihkan Hati</span> &amp; <br />
                  Tumbuhkan Desa
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                  Kelola zakat desa Anda dengan teknologi AI Syariah terdepan. Modern, aman, dan penuh keberkahan bersama SiKat (Sinergi Zakat). Transformasi digital untuk pemberdayaan umat yang lebih nyata.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="/register" className="bg-primary text-background-dark h-14 px-10 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20">
                    <span>Mulai Sekarang</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </a>
                  <button className="bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white h-14 px-8 rounded-xl font-bold text-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors border border-slate-300 dark:border-primary/10">
                    Lihat Demo
                  </button>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`w-10 h-10 rounded-full border-2 border-background-dark bg-slate-${400 + i * 100} shadow-md overflow-hidden flex items-center justify-center`}>
                        <span className="material-symbols-outlined text-xs text-white opacity-40">person</span>
                      </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-background-dark bg-primary flex items-center justify-center text-[10px] font-bold text-background-dark shadow-md">
                      5K+
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 font-medium tracking-tight">Muzakki telah bergabung bulan ini</p>
                </div>
              </div>
              <div className="relative group">
                <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/30 to-transparent absolute -inset-8 blur-[80px] opacity-60 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative aspect-[4/3] rounded-[2rem] bg-slate-200 dark:bg-slate-800/50 border border-slate-300 dark:border-primary/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-sm">
                  <div className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-105 duration-700" style={{ backgroundImage: "url('/images/landing-hero.png')" }}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-primary tracking-widest mb-0.5">Payment Security</p>
                        <p className="text-sm font-bold text-white">Sistem Terverifikasi Online</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Status</p>
                      <p className="text-[10px] font-black text-primary animate-pulse">AKTIF 24/7</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section - SiKat Explanation */}
        <section className="py-24 relative overflow-hidden scroll-mt-20" id="tentang">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-primary/20 p-8 lg:p-16 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4"></div>
              <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">Tentang Platform</h2>
                  <h3 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white font-display mb-8 leading-tight">
                    Mengapa <span className="text-primary font-black">SiKat</span>?
                  </h3>
                  <div className="space-y-6">
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="font-bold text-primary text-xl">SiKat</span> adalah singkatan dari <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">Sinergi zaKat</span>. Kami percaya bahwa pengelolaan zakat di desa akan mencapai potensi maksimalnya ketika terjadi sinergi yang kuat antara teknologi, integritas amil, dan kepercayaan muzakki.
                    </p>
                    <div className="p-6 bg-primary/10 rounded-2xl border-l-4 border-primary">
                      <p className="text-xl italic font-medium text-slate-800 dark:text-slate-200">
                        "Bersihkan Hati, Tumbuhkan Desa."
                      </p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      Platform ini bukan sekadar alat hitung, melainkan ekosistem digital yang dirancang untuk memastikan setiap rupiah zakat tidak hanya 'dibersihkan' dari sisi kewajiban syariat, tetapi juga menjadi instrumen 'pertumbuhan' ekonomi desa yang nyata and berkelanjutan.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Sinergi', desc: 'Menghubungkan warga, amil, dan sistem secara harmonis.', icon: 'hub' },
                    { label: 'Zakat', desc: 'Fokus pada kemudahan ibadah mal dan fitrah.', icon: 'eco' },
                    { label: 'Tumbuh', desc: 'Memberdayakan ekonomi desa melalui distribusi tepat.', icon: 'trending_up' },
                    { label: 'Bersih', desc: 'Transparansi mutlak dalam setiap laporan keuangan.', icon: 'done_all' }
                  ].map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white dark:bg-background-dark border border-slate-200 dark:border-primary/10 hover:border-primary/30 transition-colors shadow-sm">
                      <span className="material-symbols-outlined text-primary mb-4 text-3xl">{item.icon}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">{item.label}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24 bg-slate-100 dark:bg-slate-900/50 relative overflow-hidden scroll-mt-20" id="fitur">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20 flex flex-col gap-4">
              <h2 className="text-primary font-bold tracking-[0.2em] uppercase text-xs">Keunggulan Kami</h2>
              <h3 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-display leading-tight">Solusi Cerdas Pengelolaan Zakat</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">Kami menghadirkan inovasi untuk memastikan setiap rupiah zakat Anda dikelola dengan penuh amanah dan ketepatan sasaran.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: 'smart_toy', title: 'AI Syariah Assistant', desc: 'Hitung zakat melalui percakapan alami dengan asisten cerdas berbasis AI.' },
                { icon: 'payments', title: 'Donasi Instan & Aman', desc: 'Dukungan QRIS, VA, dan E-Wallet untuk transaksi yang cepat dan terenkripsi.' },
                { icon: 'inventory_2', title: 'Manajemen Terpadu', desc: 'Pendataan muzakki dan mustahik yang akurat dan digital untuk efisiensi amil.' },
                { icon: 'visibility', title: 'Transparansi Real-time', desc: 'Lacak setiap rupiah zakat Anda secara terbuka dan lihat laporan dampaknya.' }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-[2rem] border border-slate-200 dark:border-primary/5 bg-white dark:bg-slate-900/50 hover:border-primary/40 dark:hover:border-primary/30 transition-all group hover:-translate-y-2 hover:shadow-2xl shadow-slate-900/20">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <span className="material-symbols-outlined text-primary group-hover:text-white dark:group-hover:text-background-dark text-3xl">{f.icon}</span>
                  </div>
                  <h4 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{f.title}</h4>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 relative scroll-mt-20" id="cara-kerja">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="relative order-2 lg:order-1">
                <div className="space-y-6">
                  {[
                    { n: '1', title: 'Tanya AI Assistant', desc: 'Konsultasikan kewajiban zakat Anda melalui chat interaktif yang mudah dimengerti.' },
                    { n: '2', title: 'Konfirmasi Nominal', desc: 'Verifikasi hasil perhitungan otomatis sesuai dengan kategori zakat yang Anda pilih.' },
                    { n: '3', title: 'Bayar Aman & Cepat', desc: 'Selesaikan pembayaran aman dan instan melalui integrasi gerbang pembayaran modern.', highlight: true }
                  ].map((s, i) => (
                    <div key={i} className={`flex items-start gap-8 p-8 rounded-3xl transition-all border ${s.highlight ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/5' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-primary/5 hover:border-primary/20'}`}>
                      <div className={`flex-shrink-0 w-14 h-14 rounded-full ${s.highlight ? 'bg-primary text-background-dark' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} flex items-center justify-center font-black text-2xl shadow-inner`}>{s.n}</div>
                      <div>
                        <h5 className="text-xl font-bold mb-2">{s.title}</h5>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4">Langkah Mudah</h2>
                <h3 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white font-display mb-8 leading-tight">Mulai Berbagi Tanpa Ragu</h3>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                  Kami menyederhanakan proses pembayaran zakat yang rumit menjadi langkah praktis. Tidak perlu lagi menghitung manual yang membingungkan.
                </p>
                <div className="p-8 rounded-3xl bg-slate-900/50 border border-primary/20 flex items-center gap-6 backdrop-blur-sm">
                  <div className="p-3 bg-primary/10 rounded-full"><span className="material-symbols-outlined text-primary text-4xl">security</span></div>
                  <p className="text-sm font-medium text-slate-300">Data Anda dienkripsi dan diproses secara aman menggunakan standar keamanan tertinggi.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Principles / Integrity Section */}
        <section className="py-24 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden" id="dampak">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
              <h2 className="text-primary font-bold tracking-[0.2em] uppercase text-xs">Pilar Kepercayaan</h2>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display">Prinsip Utama Pengelolaan</h3>
              <p className="text-slate-600 dark:text-slate-400">Kami menjunjung tinggi integritas dalam setiap proses pengelolaan dana umat.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: 'gavel', title: 'Amanah & Transparan', desc: 'Setiap rupiah dicatat secara real-time dan dapat dipertanggungjawabkan.' },
                { icon: 'verified', title: 'Sesuai Syariah', desc: 'Alur penghitungan dan distribusi divalidasi sesuai kaidah fiqih zakat.' },
                { icon: 'devices', title: 'Modern & Praktis', desc: 'Teknologi terkini untuk memudahkan urusan ibadah di mana saja.' },
                { icon: 'target', title: 'Tepat Sasaran', desc: 'Memastikan bantuan sampai ke tangan mustahik yang benar-benar berhak.' }
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center p-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/50 dark:border-primary/10 hover:-translate-y-2 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">{s.icon}</span>
                  </div>
                  <h4 className="text-lg font-bold mb-3">{s.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="py-24 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto bg-slate-900 rounded-[3rem] p-10 lg:p-20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:scale-110 transition-transform duration-700">
              <span className="material-symbols-outlined text-[300px] text-primary">account_balance_wallet</span>
            </div>
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <span className="material-symbols-outlined text-primary text-xs">encrypted</span>
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">Safe & Secured</span>
              </div>
              <h3 className="text-4xl lg:text-5xl font-black text-white mb-8 leading-tight">Pembayaran Digital Aman bersama Mayar</h3>
              <p className="text-slate-400 text-lg lg:text-xl mb-12 leading-relaxed">
                Nikmati kemudahan membayar zakat, infaq, dan sedekah melalui berbagai pilihan metode pembayaran seperti QRIS, Virtual Account, hingga E-Wallet. Terintegrasi penuh dengan <strong>Mayar</strong> untuk menjamin keamanan setiap transaksi Anda.
              </p>
              <div className="flex flex-wrap gap-8 items-center">
                <div className="h-10 grayscale brightness-200 opacity-80 flex items-center gap-2 hover:grayscale-0 transition-all duration-500">
                  <span className="text-3xl font-black text-white italic tracking-tighter">MAYAR</span>
                </div>
                <div className="h-[2px] w-16 bg-slate-800 rounded-full"></div>
                <div className="flex gap-6">
                  {['credit_card', 'account_balance', 'qr_code_2'].map(icon => (
                    <div key={icon} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center hover:border-primary/50 transition-colors">
                      <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 text-center relative overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full"></div>
          <div className="max-w-4xl mx-auto px-4 relative z-10">
            <h2 className="text-5xl lg:text-6xl font-black mb-10 leading-tight">Siap Menunaikan <br /> <span className="text-primary italic">Kewajiban?</span></h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">Gunakan SiKat sekarang dan rasakan kemudahan pengelolaan zakat yang modern, aman, dan penuh berkah.</p>
            <a href="/register" className="inline-flex bg-primary text-background-dark h-20 px-16 rounded-[1.5rem] font-black text-2xl hover:scale-105 active:scale-95 transition-all items-center justify-center gap-3 shadow-[0_20px_40px_-10px_rgba(17,212,98,0.4)]">
              Mulai Sekarang
              <span className="material-symbols-outlined text-3xl">rocket_launch</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-primary/10 pt-24 pb-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <span className="material-symbols-outlined text-primary text-4xl">payments</span>
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">SiKat</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-10 leading-relaxed font-medium">
                Solusi manajemen zakat digital terdepan untuk ekosistem desa yang lebih mandiri, berdaya, dan transparan.
              </p>
              <div className="flex gap-4">
                {['language', 'share', 'contact_support'].map(icon => (
                  <a key={icon} className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-background-dark transition-all shadow-sm" href="#">
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h6 className="text-slate-900 dark:text-white font-bold mb-8 uppercase text-xs tracking-[0.2em] opacity-50">Layanan</h6>
              <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                {['Hitung Zakat Mal', 'Zakat Fitrah', 'Infaq & Sedekah', 'Laporan Dampak'].map(item => (
                  <li key={item}><a className="hover:text-primary transition-colors inline-block py-1" href="#">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="text-slate-900 dark:text-white font-bold mb-8 uppercase text-xs tracking-[0.2em] opacity-50">Perusahaan</h6>
              <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                {['Tentang Kami', 'Karir', 'Kebijakan Privasi', 'S&K'].map(item => (
                  <li key={item}><a className="hover:text-primary transition-colors inline-block py-1" href="#">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="text-slate-900 dark:text-white font-bold mb-8 uppercase text-xs tracking-[0.2em] opacity-50">Bantuan</h6>
              <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                {['Pusat Bantuan', 'Kontak Kami', 'Panduan Muzakki'].map(item => (
                  <li key={item}><a className="hover:text-primary transition-colors inline-block py-1" href="#">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
              <p>© 2024 SiKat. All Rights Reserved.</p>
              <div className="hidden md:block w-px h-3 bg-slate-300 dark:bg-slate-700"></div>
              <p className="flex items-center gap-2">
                Developed by <span className="text-primary">Anggito Muhammad Amien</span>
              </p>
              <div className="flex gap-3 ml-2">
                <a href="https://github.com/anggito-m" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                  <i className="fa-brands fa-github text-sm"></i> GitHub
                </a>
                <a href="https://linkedin.com/in/anggito-muhammad-amien" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                  <i className="fa-brands fa-linkedin text-sm"></i> LinkedIn
                </a>
                <a href="https://anggito.farmpix.cloud" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
                  <i className="fa-brands fa-globe text-sm"></i> Website
                </a>
              </div>
            </div>
            <div className="flex gap-10">
              {/* <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Terdaftar di BAZNAS</span> */}
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Keamanan Transaksi oleh Mayar</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
