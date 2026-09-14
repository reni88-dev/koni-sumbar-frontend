import { useEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { AlertTriangle, FileUp } from 'lucide-react';

export function BPJSDocumentReminderDialog({ open, subjectLabel, onCompleteNow, onLater }) {
  const completeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    completeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onLater();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLater, open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <Motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bpjs-reminder-title"
            aria-describedby="bpjs-reminder-message"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-7 w-7 text-amber-600" />
            </div>
            <h2 id="bpjs-reminder-title" className="text-xl font-bold text-slate-900">
              Lengkapi Dokumen BPJS
            </h2>
            <p id="bpjs-reminder-message" className="mt-2 text-sm leading-6 text-slate-600">
              Dokumen BPJS pada profil {subjectLabel} belum tersedia. Data ini belum dapat digunakan untuk pendaftaran pertandingan sampai dokumen BPJS dilengkapi.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onLater}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Nanti
              </button>
              <button
                ref={completeButtonRef}
                type="button"
                onClick={onCompleteNow}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <FileUp className="h-4 w-4" />
                Lengkapi Sekarang
              </button>
            </div>
          </Motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
