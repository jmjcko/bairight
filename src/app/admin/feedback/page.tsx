'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth/AuthContext';
import { isUserAdmin } from '@/lib/auth/admin-check';
import { FeedbackItem, FeedbackService, FeedbackStatus } from '@/lib/feedback/feedback-service';

export default function AdminFeedbackPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | FeedbackStatus>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const isAdmin = isUserAdmin(user?.email);

  useEffect(() => {
    if (isAdmin) {
      loadFeedback();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const data = await FeedbackService.fetchFeedback();
      setItems(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    const success = await FeedbackService.updateFeedbackStatus(id, newStatus);
    if (success) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      setActionMessage(`Stav změněn na: ${newStatus}`);
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const getMailtoUrl = (item: FeedbackItem) => {
    const subject = encodeURIComponent(`Re: bAIright – Vaše zpětná vazba (${item.category})`);
    const greeting = item.name ? `Dobrý den ${item.name},` : `Dobrý den,`;
    const body = encodeURIComponent(
      `${greeting}\n\nmoc děkujeme za vaši zprávu k bAIright:\n"> ${item.message}"\n\n[Zde doplňte vaši odpověď]\n\nS přátelským pozdravem,\nJan Mynář\nZakladatel bAIright\nhttps://bairight.pro`
    );
    return `mailto:${item.email}?subject=${subject}&body=${body}`;
  };

  const filteredItems = items.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const totalCount = items.length;
  const newCount = items.filter((i) => i.status === 'new').length;
  const resolvedCount = items.filter((i) => i.status === 'resolved').length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
        <p className="text-sm font-mono text-[#607d8b]">Ověřuji administrátorská oprávnění...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            Přístup odepřen
          </span>
          <h1 className="text-lg font-bold text-[#263238]">Nemáte administrátorská oprávnění</h1>
          <p className="text-xs text-[#607d8b] leading-relaxed">
            Tato sekce je vyhrazena pouze pro administrátory aplikace bAIright ({user?.email || 'nepřihlášený uživatel'}).
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2 rounded-xl bg-[#0099cc] text-white text-xs font-bold hover:bg-[#0088b8] transition-colors"
            >
              Zpět na hlavní stránku
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#263238]">
      {/* Admin Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="hover:opacity-85 transition-opacity">
            <Logo />
          </Link>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#01579b] text-white">
            ADMIN PANEL
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="hidden sm:inline font-mono text-[#607d8b] text-[11px]">
            {user?.email}
          </span>
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-[#263238] font-semibold hover:bg-slate-50 transition-colors"
          >
            ← Zpět do aplikace
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Title and stats bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#263238]">
              Správa zpětné vazby & námětů
            </h1>
            <p className="text-xs text-[#607d8b] mt-0.5">
              Příchozí zprávy od návštěvníků a uživatelů s možností přímé e-mailové odpovědi.
            </p>
          </div>
          <button
            onClick={loadFeedback}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-[#0099cc] hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            ↻ Obnovit seznam
          </button>
        </div>

        {/* Stats Chips */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[10px] font-mono font-bold uppercase text-[#607d8b] block">Celkem zpráv</span>
            <span className="text-2xl font-black text-[#263238] mt-1 block">{totalCount}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs bg-amber-50/20">
            <span className="text-[10px] font-mono font-bold uppercase text-amber-700 block">K vyřízení</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{newCount}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block">Vyřízeno</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{resolvedCount}</span>
          </div>
        </div>

        {/* Toast Action Message */}
        {actionMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
            ✓ {actionMessage}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'all' as const, label: `Všechny (${totalCount})` },
            { id: 'new' as const, label: `K vyřízení (${newCount})` },
            { id: 'resolved' as const, label: `Vyřízeno (${resolvedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-[#0099cc] text-white shadow-xs'
                  : 'bg-white text-[#607d8b] hover:text-[#263238] border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <p className="text-xs font-mono text-[#607d8b]">Načítám náměty z databáze...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-2">
            <p className="text-sm font-bold text-[#263238]">Žádné zprávy v této kategorii</p>
            <p className="text-xs text-[#607d8b]">Jakmile někdo odešle zpětnou vazbu přes web, objeví se zde.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Item Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    {/* Category Chip */}
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        item.category === 'bug'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : item.category === 'feature'
                          ? 'bg-cyan-50 text-[#0099cc] border-cyan-200'
                          : 'bg-slate-50 text-[#546e7a] border-slate-200'
                      }`}
                    >
                      {item.category === 'bug'
                        ? 'CHYBA'
                        : item.category === 'feature'
                        ? 'NÁPAD'
                        : 'OBECNÉ'}
                    </span>

                    {/* Status Chip */}
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        item.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {item.status === 'resolved' ? 'VYŘÍZENO' : 'NOVÉ'}
                    </span>

                    <span className="text-[11px] font-mono text-[#90a4ae]">
                      {new Date(item.created_at).toLocaleString('cs-CZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Sender Info */}
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#263238] mr-1.5">
                      {item.name || 'Anonymní host'}
                    </span>
                    <a
                      href={`mailto:${item.email}`}
                      className="text-xs font-mono text-[#0099cc] hover:underline"
                    >
                      {item.email}
                    </a>
                  </div>
                </div>

                {/* Message Text */}
                <div className="bg-[#f4f6f8] p-3.5 rounded-lg border border-slate-100 text-xs sm:text-sm text-[#263238] whitespace-pre-wrap leading-relaxed">
                  {item.message}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    {item.status === 'new' ? (
                      <button
                        onClick={() => handleStatusChange(item.id, 'resolved')}
                        className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        ✓ Označit jako vyřízeno
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(item.id, 'new')}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[#607d8b] font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        ↺ Vrátit mezi nové
                      </button>
                    )}
                  </div>

                  <a
                    href={getMailtoUrl(item)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0099cc] hover:bg-[#0088b8] text-white font-bold transition-all shadow-xs"
                  >
                    <span>Odpovědět e-mailem</span>
                    <span className="font-mono text-[11px]">→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
