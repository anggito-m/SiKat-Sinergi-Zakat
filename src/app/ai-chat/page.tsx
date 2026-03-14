'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';
import Header from "@/components/Header";
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
}

export default function AIChatPage() {
  const { user, profile, muzakkiId: contextMuzakkiId } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paymentPopup, setPaymentPopup] = useState<{ step: 'select_type' | 'confirm_user' | 'select_muzakki', nominal: number; aiType: string | null; selectedType: string | null } | null>(null);
  const [muzakkiList, setMuzakkiList] = useState<any[]>([]);
  const [selectedMuzakki, setSelectedMuzakki] = useState('');
  const [jumlahAnggota, setJumlahAnggota] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const isUserRole = profile?.role === 'user';

  // Load sessions on mount
  useEffect(() => {
    if (!user) return;
    loadSessions();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    if (!user) return;
    setLoadingSessions(true);
    const { data } = await supabase
      .from('chat_sessions')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setSessions(data || []);
    setLoadingSessions(false);
  };

  const loadMessages = async (sessionId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    setMessages((data || []).map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content })));
    setActiveSessionId(sessionId);
  };

  const createSession = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: user.id, title })
      .select('id')
      .single();
    if (error || !data) return null;
    setActiveSessionId(data.id);
    await loadSessions();
    return data.id;
  };

  const saveMessage = async (sessionId: string, role: string, content: string) => {
    await supabase.from('chat_messages').insert({ session_id: sessionId, role, content });
  };

  const deleteSession = async (sessionId: string) => {
    await supabase.from('chat_sessions').delete().eq('id', sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
    await loadSessions();
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userContent = input;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: userContent };
    const assistantId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    // Create session if new
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = await createSession(userContent);
      if (!sessionId) {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: '⚠️ Gagal membuat sesi baru.' } : m));
        setIsLoading(false);
        return;
      }
    }

    // Save user message
    await saveMessage(sessionId, 'user', userContent);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: userContent });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
        const errContent = `⚠️ ${errData.error || 'Terjadi kesalahan'}`;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: errContent } : m));
        await saveMessage(sessionId, 'assistant', errContent);
        setIsLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          fullResponse += text;
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + text } : m));
        }
      }

      // Save assistant response
      if (fullResponse) {
        await saveMessage(sessionId, 'assistant', fullResponse);
      }
    } catch {
      const errMsg = 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.';
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: errMsg } : m));
      await saveMessage(sessionId, 'assistant', errMsg);
    }
    setIsLoading(false);
  };

  // Extract nominal and type from AI [BAYAR:amount:type] tag
  const extractPayment = (text: string): { nominal: number; type: string | null } | null => {
    const match = text.match(/\[BAYAR:(\d+)(?::(fitrah|mal|infaq))?\]/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > 0 && num < 1_000_000_000) return { nominal: num, type: match[2] || null };
    }
    return null;
  };

  // Remove [BAYAR:amount:type] tag from displayed text
  const cleanContent = (text: string): string => {
    return text.replace(/\[BAYAR:\d+(?::(?:fitrah|mal|infaq))?\]/g, '').trim();
  };

  // Open payment type popup
  const openPaymentPopup = async (nominal: number, aiType: string | null) => {
    setPaymentPopup({ step: 'select_type', nominal, aiType, selectedType: null });
    if (!isUserRole) {
      const { data } = await supabase.from('muzakki').select('id, nama_kk, nama_kepala_keluarga').eq('status_aktif', true).order('nama_kk');
      setMuzakkiList(data || []);
    }
  };

  // Step 2: Handle type selection
  const handleTypeSelection = (type: string) => {
    if (!paymentPopup) return;
    if (isUserRole) {
      setPaymentPopup({ ...paymentPopup, step: 'confirm_user', selectedType: type });
    } else {
      setPaymentPopup({ ...paymentPopup, step: 'select_muzakki', selectedType: type });
    }
  };

  // Step 3: Process Payment (Create Mayar Link + Pending Transaction)
  const processDirectPayment = async () => {
    if (!paymentPopup || !paymentPopup.selectedType) return;
    setIsProcessingPayment(true);

    let muzakkiId = isUserRole ? contextMuzakkiId : selectedMuzakki;

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: paymentPopup.nominal,
          title: `Zakat/Infaq via AI Asisten`,
          description: `Pembayaran ${paymentPopup.selectedType} via AI`,
          metadata: {
            jenis_pembayaran: paymentPopup.selectedType,
            muzakki_id: muzakkiId,
            jumlah_anggota: paymentPopup.selectedType === 'fitrah' ? jumlahAnggota : null,
            chat_session_id: activeSessionId
          }
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(`⚠️ Gagal membuat link pembayaran: ${data.error || 'Terjadi kesalahan'}`);
        return;
      }

      if (data.payment_link && data.payment_id) {
        // Record pending transaction in DB
        const type = paymentPopup.selectedType;
        const amount = paymentPopup.nominal;
        const paymentId = data.payment_id;

        if (type === 'fitrah') {
          await supabase.from('zakat_fitrah').insert([{
            muzakki_id: muzakkiId,
            jumlah_anggota_aktual: jumlahAnggota,
            jenis_bayar: 'uang',
            nominal_uang: amount,
            total_setara_uang: amount,
            metode_pembayaran: 'mayar',
            mayar_payment_id: paymentId,
            mayar_invoice_url: data.payment_link,
            status: 'pending'
          }]);
        } else if (type === 'mal') {
          // Get Hijriah year and Nisab from config
          const { data: configs } = await supabase.from('config')
            .select('key, value')
            .in('key', ['tahun_hijriah', 'nisab_maal_rp']);
          
          const tahun = configs?.find(c => c.key === 'tahun_hijriah')?.value || '1447';
          const nisab = parseFloat(configs?.find(c => c.key === 'nisab_maal_rp')?.value || '85000000');
          
          await supabase.from('zakat_mal').insert([{
            muzakki_id: muzakkiId,
            tahun_hijriah: tahun,
            total_harta: amount * 40, // Approximate total from 2.5% zakat
            nisab_referensi: nisab,
            nominal_zakat: amount,
            metode_pembayaran: 'mayar',
            mayar_payment_id: paymentId,
            mayar_invoice_url: data.payment_link,
            status: 'pending'
          }]);
        } else if (type === 'infaq') {
          let donorName = profile?.nama || 'Hamba Allah';
          if (!isUserRole && muzakkiId) {
            const m = muzakkiList.find(x => x.id === muzakkiId);
            if (m) donorName = `${m.nama_kepala_keluarga} (${m.nama_kk})`;
          }
          await supabase.from('infaq_sedekah').insert([{
            muzakki_id: muzakkiId,
            nama_donatur: donorName,
            nominal: amount,
            metode_pembayaran: 'mayar',
            mayar_payment_id: paymentId,
            mayar_invoice_url: data.payment_link,
            status: 'pending'
          }]);
        }

        window.open(data.payment_link, '_blank');
        setPaymentPopup(null);
      }
    } catch (err: any) {
      alert(`⚠️ Gagal menghubungi server: ${err.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const fmt = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'Baru saja';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} menit lalu`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} jam lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const suggestions = [
    "Gaji saya 8 juta sebulan, tabungan 50 juta, berapa zakat saya?",
    "Berapa total zakat yang sudah terkumpul?",
    "Siapa saja muzakki di RT 01?",
    "Berapa zakat fitrah untuk keluarga 5 orang?",
    "Berikan laporan ringkas zakat",
    "Bagaimana status distribusi zakat?",
  ];

  return (
    <>
      <Header title="AI Asisten Syariah" />
      <div className="flex-1 flex overflow-hidden">
        {/* Session Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 border-r border-primary/10 bg-background-light dark:bg-background-dark flex flex-col overflow-hidden`}>
          <div className="p-3 border-b border-primary/10 flex-shrink-0">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-background-dark font-bold text-sm hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Percakapan Baru
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingSessions ? (
              <div className="text-center text-sm text-slate-400 py-4">Memuat...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-6 px-3">Belum ada percakapan. Mulai chat baru!</div>
            ) : (
              sessions.map(s => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all text-sm
                    ${activeSessionId === s.id
                      ? 'bg-primary/15 border border-primary/30 text-primary font-medium'
                      : 'hover:bg-primary/5 border border-transparent'
                    }`}
                >
                  <div className="flex-1 min-w-0" onClick={() => loadMessages(s.id)}>
                    <p className="truncate">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(s.updated_at)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"
                    title="Hapus"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle sidebar button */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/10 flex-shrink-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title={sidebarOpen ? 'Tutup sidebar' : 'Buka sidebar'}>
              <span className="material-symbols-outlined text-lg">{sidebarOpen ? 'menu_open' : 'menu'}</span>
            </button>
            {activeSessionId && (
              <span className="text-sm text-slate-400 truncate">{sessions.find(s => s.id === activeSessionId)?.title || 'Percakapan'}</span>
            )}
          </div>

          {/* Chat Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6 max-w-lg mx-auto">
                <div className="p-4 bg-primary/20 rounded-full">
                  <span className="material-symbols-outlined text-5xl text-primary">smart_toy</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">AI Asisten Finansial Syariah</h2>
                  <p className="text-slate-500 dark:text-slate-400">Tanyakan tentang kewajiban zakat, cari data muzakki, lihat laporan, atau dapatkan konsultasi syariah. Didukung oleh pengetahuan peraturan zakat LAZISMU.</p>
                </div>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => setInput(s)} className="text-left p-4 rounded-xl bg-white dark:bg-primary/5 border border-primary/20 text-sm hover:border-primary transition-colors flex items-center justify-between group">
                      <span className="text-slate-700 dark:text-slate-300">&quot;{s}&quot;</span>
                      <span className="material-symbols-outlined text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const payment = msg.role === 'assistant' && !isLoading ? extractPayment(msg.content) : null;
              return (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${msg.role === 'user' ? 'bg-primary text-background-dark rounded-br-md' : 'bg-white dark:bg-primary/5 border border-primary/10 rounded-bl-md'}`}>
                    {msg.role === 'assistant' && msg.content === '' && isLoading ? (
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => <a {...props} className="underline decoration-primary hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer" />
                          }}
                        >
                          {cleanContent(msg.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                    {payment && (
                      <button
                        onClick={() => openPaymentPopup(payment.nominal, payment.type)}
                        className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-background-dark font-bold text-sm py-2.5 rounded-lg hover:brightness-110 transition-all"
                      >
                        <span className="material-symbols-outlined text-base">payments</span>
                        Bayar {fmt(payment.nominal)} via Mayar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Bar */}
          <div className="border-t border-slate-200 dark:border-primary/20 p-4 bg-background-light dark:bg-background-dark flex-shrink-0">
            <div className="max-w-3xl mx-auto flex gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Tanyakan tentang zakat, cari muzakki, lihat laporan..."
                className="flex-1 rounded-xl border border-primary/20 bg-white dark:bg-primary/5 px-5 py-3 focus:border-primary focus:ring-primary outline-none transition-all"
              />
              <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="px-5 py-3 rounded-xl bg-primary text-background-dark font-bold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2">
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Multi-Step Popup */}
      {paymentPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-background-dark rounded-2xl border border-primary/20 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-primary/20 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold">
                  {paymentPopup.step === 'select_type' ? 'Pilih Jenis Pembayaran' : 'Konfirmasi Pembayaran'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Nominal: <span className="font-bold text-primary">{fmt(paymentPopup.nominal)}</span></p>
              </div>
              <button disabled={isProcessingPayment} onClick={() => setPaymentPopup(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-primary/10 disabled:opacity-50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* STEP 1: Select Type */}
              {paymentPopup.step === 'select_type' && (
                <div className="space-y-3">
                  {[
                    { key: 'fitrah', label: 'Zakat Fitrah', icon: 'savings', desc: 'Zakat wajib di bulan Ramadhan' },
                    { key: 'mal', label: 'Zakat Mal', icon: 'account_balance', desc: 'Zakat harta/penghasilan' },
                    { key: 'infaq', label: 'Infaq / Sedekah', icon: 'favorite', desc: 'Sumbangan sukarela' },
                  ].map(item => {
                    const isRecommended = paymentPopup.aiType === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => handleTypeSelection(item.key)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md active:scale-[0.98] ${
                          isRecommended
                            ? 'border-primary bg-primary/10 shadow-sm shadow-primary/20'
                            : 'border-slate-200 dark:border-primary/20 hover:border-primary/50'
                        }`}
                      >
                        <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                          isRecommended ? 'bg-primary text-background-dark' : 'bg-slate-100 dark:bg-primary/10 text-primary'
                        }`}>
                          <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold truncate">{item.label}</span>
                            {isRecommended && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase whitespace-nowrap">
                                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                Rekomendasi
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{item.desc}</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 shrink-0">arrow_forward</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP 2A: Confirm User */}
              {paymentPopup.step === 'confirm_user' && (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-sm font-bold text-primary mb-1">Data Muzakki</p>
                    <p className="text-sm">Transaksi ini akan dicatat atas nama Anda sendiri sesuai dengan data akun Anda.</p>
                  </div>
                  
                  {paymentPopup.selectedType === 'fitrah' && (
                    <div>
                      <label className="block text-sm font-bold mb-2">Jumlah Anggota Keluarga (Jiwa)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={jumlahAnggota} 
                        onChange={e => setJumlahAnggota(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-primary/20 bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-2">Nominal otomatis dihitung oleh AI, form ini hanya menandakan jumlah jiwa yang terwakili.</p>
                    </div>
                  )}
                  
                  <button 
                    onClick={processDirectPayment}
                    disabled={isProcessingPayment}
                    className="w-full py-3.5 bg-primary text-background-dark font-bold rounded-xl hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-4"
                  >
                    {isProcessingPayment ? (
                      <span className="w-5 h-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">payments</span>
                        Lanjutkan Pembayaran via Mayar
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* STEP 2B: Select Muzakki (Admin/Amil) */}
              {paymentPopup.step === 'select_muzakki' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-600 dark:text-amber-400">
                    <p className="text-sm font-bold mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                      Mode Admin / Amil
                    </p>
                    <p className="text-xs">Pilih data muzakki untuk transaksi ini. Transaksi akan dicatat atas nama muzakki yang dipilih.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Pilih Muzakki</label>
                    <select
                      value={selectedMuzakki}
                      onChange={e => setSelectedMuzakki(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-primary/20 bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="">-- Pilih Muzakki --</option>
                      {muzakkiList.map(m => (
                        <option key={m.id} value={m.id}>{m.nama_kk} ({m.nama_kepala_keluarga})</option>
                      ))}
                    </select>
                  </div>

                  {paymentPopup.selectedType === 'fitrah' && (
                    <div>
                      <label className="block text-sm font-bold mb-2">Jumlah Anggota Keluarga (Jiwa)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={jumlahAnggota} 
                        onChange={e => setJumlahAnggota(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-primary/20 bg-background-light dark:bg-background-dark focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  )}

                  <button 
                    onClick={processDirectPayment}
                    disabled={!selectedMuzakki || isProcessingPayment}
                    className="w-full py-3.5 bg-primary text-background-dark font-bold rounded-xl hover:brightness-110 transition-all flex justify-center items-center gap-2 disabled:opacity-50 mt-4"
                  >
                    {isProcessingPayment ? (
                      <span className="w-5 h-5 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">payments</span>
                        Lanjutkan Pembayaran via Mayar
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
