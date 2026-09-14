'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2, User, Video, ShieldCheck, MapPin } from 'lucide-react';

interface AppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppointmentsModal: React.FC<AppointmentsModalProps> = ({ isOpen, onClose }) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('Dnes 16:30');
  const [isBooked, setIsBooked] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleBooking = () => {
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0B121E] border border-cyan-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_20px_70px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Telemedicína & Podiatrie
              </div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Online konzultace se specialistou
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isBooked ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Konzultace úspěšně rezervována!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Termín <span className="text-cyan-300 font-bold">{selectedSlot}</span> byl potvrzen. Odkaz na šifrovaný videohovor s podiatrem byl odeslán do vašeho kalendáře.
            </p>
          </div>
        ) : (
          <div className="space-y-5 text-xs text-slate-300">
            {/* Doctor Profile Card */}
            <div className="p-4 rounded-2xl bg-[#070f1e] border border-cyan-500/25 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 p-0.5 shrink-0">
                <div className="w-full h-full rounded-[10px] bg-[#070f1e] flex items-center justify-center text-sm font-bold text-cyan-300">
                  MUDr.
                </div>
              </div>
              <div>
                <div className="font-extrabold text-white text-sm">
                  MUDr. Jan Procházka, Ph.D.
                </div>
                <div className="text-[11px] text-cyan-300 font-mono">
                  Klinická podiatrie & Biomechanika • Centrum pohybové medicíny
                </div>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Video className="w-3 h-3" /> Šifrovaný videohovor (30 min)
                  </span>
                  <span>•</span>
                  <span>Spolupracující specialista</span>
                </div>
              </div>
            </div>

            {/* Slot selection */}
            <div>
              <label className="block font-bold text-slate-200 uppercase text-[11px] mb-2">
                Dostupné termíny konzultace:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'Dnes 14:00',
                  'Dnes 16:30',
                  'Dnes 18:00',
                  'Zítra 09:30',
                  'Zítra 11:00',
                  'Zítra 15:30',
                ].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2.5 rounded-xl border text-center font-mono font-semibold transition-all ${
                      selectedSlot === slot
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-sm ring-1 ring-cyan-400/40'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 leading-relaxed">
              Specialista na biomechaniku obuvi obdrží vaše zadané parametry (rozměry chodidla v mm, citlivost kolenního kloubu a vyhodnocení bot od AI agenta) ještě před začátkem hovoru.
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Zrušit
              </button>
              <button
                onClick={handleBooking}
                className="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-md hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Rezervovat termín ({selectedSlot})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
