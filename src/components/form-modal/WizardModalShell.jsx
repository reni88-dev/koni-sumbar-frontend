import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react';

export function WizardModalShell({
  modalKey,
  eyebrow,
  title,
  description,
  steps,
  step,
  onStepChange,
  onClose,
  errors,
  errorMessage,
  validationSummary,
  stepErrorCounts = {},
  notice,
  formContainerRef,
  children,
  onPrevious,
  onNext,
  onSubmit,
  loading,
  fileProcessing,
  submitLabel,
}) {
  const stepCount = steps.length;
  const busy = loading || fileProcessing;
  const hasFieldErrors = Object.keys(errors || {}).length > 0;
  const desktopGridClass = stepCount === 4
    ? 'hidden sm:grid sm:grid-cols-4 gap-2'
    : 'hidden sm:grid sm:grid-cols-3 gap-2.5';

  return (
    <AnimatePresence>
      <Motion.div
        key={`${modalKey}-backdrop`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs"
        onClick={onClose}
      />

      <Motion.div
        key={`${modalKey}-modal`}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 pt-4 sm:p-6 sm:pt-10"
      >
        <div
          className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl ring-1 ring-slate-900/10 sm:max-h-[calc(100vh-3.5rem)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-slate-950 via-red-950 to-red-700 p-5 text-white sm:p-6">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-red-500/20 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" />
            </div>
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-red-200 backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5 text-red-300" />
                  <span>{eyebrow}</span>
                </div>
                <h2 className="text-xl font-extrabold leading-tight tracking-tight text-white sm:text-2xl">{title}</h2>
                <p className="mt-0.5 text-xs text-red-100/80">{description}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white transition-all hover:bg-white/25"
                title="Tutup (Esc)"
                aria-label="Tutup modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-slate-200/80 bg-slate-50 p-3 sm:p-4">
            <div className={desktopGridClass}>
              {steps.map((item) => {
                const StepIcon = item.icon;
                const isCurrent = step === item.id;
                const isPassed = step > item.id;
                const errorCount = stepErrorCounts[item.id] || 0;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onStepChange(item.id)}
                    disabled={busy}
                    className={`group relative flex min-w-0 items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      isCurrent
                        ? 'border-red-300 bg-white shadow-sm ring-1 ring-red-100'
                        : isPassed
                          ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                          : errorCount
                            ? 'border-red-200 bg-red-50/70 hover:bg-red-50'
                            : 'border-transparent hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isCurrent ? 'bg-red-600 text-white' : isPassed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isPassed ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className={`truncate text-xs font-bold leading-none ${isCurrent ? 'text-red-700' : 'text-slate-800'}`}>{item.title}</p>
                        {errorCount > 0 && (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white" aria-label={`${errorCount} error`}>
                            {errorCount}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 sm:hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">{step}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-bold leading-tight text-slate-800">{steps[step - 1].title}</p>
                      {(stepErrorCounts[step] || 0) > 0 && (
                        <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{stepErrorCounts[step]}</span>
                      )}
                    </div>
                    <p className="truncate text-[10px] text-slate-400">{steps[step - 1].subtitle}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">Langkah {step} dari {stepCount}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300" style={{ width: `${(step / stepCount) * 100}%` }} />
              </div>
            </div>
          </div>

          <div ref={formContainerRef} className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 sm:p-6">
            {notice}
            {hasFieldErrors ? validationSummary : errorMessage && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 shadow-xs">
                <div className="shrink-0 rounded-xl bg-red-100 p-2 text-red-600"><AlertCircle className="h-4 w-4" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-red-800">Formulir belum dapat disimpan</p>
                  <p className="mt-0.5 text-xs text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}
            {children}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200/80 bg-white p-4 sm:p-5">
            <button
              type="button"
              onClick={onPrevious}
              disabled={step === 1 || busy}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Sebelumnya</span>
            </button>

            {step < stepCount ? (
              <button
                type="button"
                onClick={onNext}
                disabled={busy}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-red-700 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:text-sm"
              >
                {fileProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{fileProcessing ? 'Memproses File...' : 'Langkah Selanjutnya'}</span>
                {!fileProcessing && <ChevronRight className="h-4 w-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={busy}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:from-red-700 hover:to-rose-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 sm:px-7 sm:text-sm"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>{loading ? 'Menyimpan Data...' : fileProcessing ? 'Memproses File...' : submitLabel}</span>
              </button>
            )}
          </div>
        </div>
      </Motion.div>
    </AnimatePresence>
  );
}
