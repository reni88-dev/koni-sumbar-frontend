import { useEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { History, Info, X } from 'lucide-react';

export function DevelopmentFundEligibilityModal({
  isOpen,
  onClose,
  onRecordHistorical,
  onOpenClusterHistory,
  personName,
  personType,
  hasHistoricalPeriods,
}) {
  const primaryActionRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    primaryActionRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <Motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="fixed inset-0 z-[71] flex items-center justify-center p-4"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="development-fund-eligibility-title"
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 rounded-xl bg-amber-100 p-2 text-amber-700">
                <Info className="h-5 w-5" />
              </span>
              <div>
                <h3 id="development-fund-eligibility-title" className="text-base font-bold text-slate-800 sm:text-lg">
                  Biaya Pembinaan Tidak Dapat Dicatat untuk Status Saat Ini
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  <strong>{personName}</strong> saat ini berstatus Non Binaan. Biaya pembinaan hanya dapat dicatat pada tanggal ketika {personType} berstatus Binaan.
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100" aria-label="Tutup">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button ref={hasHistoricalPeriods ? undefined : primaryActionRef} type="button" onClick={onOpenClusterHistory} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
              <History className="h-4 w-4" />
              Buka Riwayat Kluster
            </button>
            {hasHistoricalPeriods && (
              <button ref={primaryActionRef} type="button" onClick={onRecordHistorical} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700">
                Catat Periode Binaan Sebelumnya
              </button>
            )}
          </div>
        </div>
      </Motion.div>
    </AnimatePresence>
  );
}