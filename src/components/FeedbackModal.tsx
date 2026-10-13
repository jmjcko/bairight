'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SupportedLocale } from '@/lib/i18n/translations';
import { useAuth } from '@/lib/auth/AuthContext';
import { FeedbackCategory, FeedbackService } from '@/lib/feedback/feedback-service';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: SupportedLocale;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  locale,
}) => {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEn = locale === 'en';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setEmail(user.email || '');
        setName(user.name || '');
      }
      setIsSubmitted(false);
      setErrorMessage(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail) {
      setErrorMessage(isEn ? 'Please enter your email so we can reply to you.' : 'Zadejte prosím svůj e-mail, abychom vám mohli odpovědět.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setErrorMessage(isEn ? 'Please enter a valid email address.' : 'Zadejte prosím platnou e-mailovou adresu.');
      return;
    }

    if (!trimmedMessage) {
      setErrorMessage(isEn ? 'Please write your feedback message.' : 'Napište prosím text vaší zprávy nebo námětu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await FeedbackService.submitFeedback({
        email: trimmedEmail,
        name: name.trim() || undefined,
        category,
        message: trimmedMessage,
        userId: user?.id,
      });

      if (res.success) {
        setIsSubmitted(true);
        setMessage('');
      } else {
        setErrorMessage(res.error || (isEn ? 'Could not send feedback. Please try again.' : 'Odeslání se nezdařilo. Zkuste to prosím znovu.'));
      }
    } catch {
      setErrorMessage(isEn ? 'Could not send feedback. Please try again.' : 'Odeslání se nezdařilo. Zkuste to prosím znovu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-[#1f1f22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative text-left space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <span className="inline-block text-[10px] font-mono font-bold tracking-widest text-[#0099cc] uppercase bg-[#e1f5fe]/80 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-[#0099cc]/20 mb-1.5">
              {isEn ? 'COMMUNITY • VOICE' : 'HLAS KOMUNITY • NÁMĚTY'}
            </span>
            <h2 id="feedback-modal-title" className="text-lg sm:text-xl font-black text-[#263238] dark:text-[#e4e4e7] tracking-tight">
              {isEn ? 'Send Feedback or Ideas' : 'Náměty a zpětná vazba'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[#607d8b] hover:text-[#263238] dark:hover:text-white transition-colors cursor-pointer shrink-0 font-mono text-sm leading-none"
            aria-label={isEn ? 'Close' : 'Zavřít'}
          >
            ✕
          </button>
        </div>

        {isSubmitted ? (
          /* Success Screen */
          <div className="py-6 space-y-4 text-center animate-in fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
              ✓
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#263238] dark:text-[#e4e4e7]">
              {isEn ? 'Thank you for your feedback!' : 'Děkujeme za váš námět!'}
            </h3>
            <p className="text-xs sm:text-sm text-[#455a64] dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
              {isEn
                ? 'Your message was successfully delivered. If you provided an email, our team will review it and reply back to you.'
                : 'Vaši zprávu jsme v pořádku přijali. Pokud jste zanechali e-mail, zakladatel projektu vám rád odpoví přímo do schránky.'}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {isEn ? 'Close' : 'Rozumím, zavřít'}
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#263238] dark:text-slate-300">
                {isEn ? 'Category:' : 'Typ zprávy:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'feature' as FeedbackCategory, cs: 'Nápad na vylepšení', en: 'Feature Idea' },
                  { id: 'bug' as FeedbackCategory, cs: 'Chyba / Problém', en: 'Bug Report' },
                  { id: 'general' as FeedbackCategory, cs: 'Dotaz / Pochvala', en: 'General' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold text-center border transition-all cursor-pointer ${
                      category === cat.id
                        ? 'bg-[#0099cc] text-white border-[#0099cc] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 text-[#455a64] dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    {isEn ? cat.en : cat.cs}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-email" className="block text-xs font-bold text-[#263238] dark:text-slate-300">
                {isEn ? 'Your Email (required for our reply):' : 'Váš e-mail (pro naši odpověď):'}
              </label>
              <input
                id="feedback-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isEn ? 'name@example.com' : 'jmeno@priklad.cz'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-[#263238] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc]"
              />
              {user && (
                <p className="text-[10px] text-[#607d8b] font-mono">
                  {isEn ? 'Prefilled from your signed-in Google account.' : 'Předvyplněno z vašeho přihlášeného Google účtu.'}
                </p>
              )}
            </div>

            {/* Name Field (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-name" className="block text-xs font-bold text-[#263238] dark:text-slate-300">
                {isEn ? 'Your Name (optional):' : 'Vaše jméno (volitelné):'}
              </label>
              <input
                id="feedback-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isEn ? 'e.g. Alex' : 'např. Jan'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-[#263238] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc]"
              />
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <label htmlFor="feedback-message" className="block text-xs font-bold text-[#263238] dark:text-slate-300">
                {isEn ? 'Message / Suggestion:' : 'Zpráva / Popis námětu:'}
              </label>
              <textarea
                id="feedback-message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isEn
                    ? 'Describe what would make bAIright even better, or what issue you encountered...'
                    : 'Popište, co by vám v bAIright pomohlo, co můžeme zlepšit nebo na jaký problém jste narazili...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-[#263238] dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0099cc] focus:ring-1 focus:ring-[#0099cc] resize-y"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {errorMessage}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#607d8b] hover:text-[#263238] dark:hover:text-white transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Zrušit'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0099cc] hover:bg-[#0088b8] disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {isSubmitting
                  ? (isEn ? 'Sending...' : 'Odesílám...')
                  : (isEn ? 'Send Feedback' : 'Odeslat námět')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return mounted && typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
};
