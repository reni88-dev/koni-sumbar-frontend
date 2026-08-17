import { AnimatePresence, motion as Motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  X
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
  formContainerRef,
  children,
  onPrevious,
  onNext,
  onSubmit,
  currentStepValid,
  loading,
  fileProcessing,
  submitLabel
}) {
  const stepCount = steps.length;
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
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50"
        onClick={onClose}
      />

      <Motion.div
        key={`${modalKey}-modal`}
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 pt-6 sm:p-6 sm:pt-10"
      >
        <div
          className="my-auto flex max-h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl ring-1 ring-slate-900/10"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative bg-gradient-to-br from-slate-950 via-red-950 to-red-700 text-white p-5 sm:p-6 overflow-hidden shrink-0">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -left-12 -top-12 h-56 w-56 rounded-full bg-red-500/20 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" />
            </div>

            <div className="relative flex items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-red-200 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-300" />
                  <span>{eyebrow}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {title}
                </h2>
                <p className="text-xs text-red-100/80 mt-0.5">{description}</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-all cursor-pointer"
                title="Tutup (Esc)"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 border-b border-slate-200/80 p-3 sm:p-4 shrink-0">
            <div className={desktopGridClass}>
              {steps.map((item) => {
                const StepIcon = item.icon;
                const isCurrent = step === item.id;
                const isPassed = step > item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id < step) onStepChange(item.id);
                    }}
                    disabled={item.id > step}
                    className={`group flex items-center gap-2.5 rounded-2xl p-2.5 text-left transition-all ${
                      isCurrent
                        ? 'bg-white shadow-sm ring-1 ring-red-500/30 border-l-4 border-l-red-600'
                        : isPassed
                          ? 'bg-white/60 hover:bg-white text-slate-700 cursor-pointer border border-slate-200/60'
                          : 'bg-slate-100/60 opacity-60 cursor-not-allowed border border-transparent'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-bold text-xs transition-colors ${
                        isCurrent
                          ? 'bg-red-600 text-white shadow-xs'
                          : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold leading-none truncate ${isCurrent ? 'text-red-700' : 'text-slate-800'}`}>
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="sm:hidden space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">
                    {step}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">{steps[step - 1].title}</p>
                    <p className="text-[10px] text-slate-400">{steps[step - 1].subtitle}</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  Langkah {step} dari {stepCount}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-300"
                  style={{ width: `${(step / stepCount) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div ref={formContainerRef} className="flex-1 overflow-y-auto bg-slate-50/70 p-4 sm:p-6 space-y-4">
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-red-800">Harap periksa isian formulir:</p>
                  <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
                  {Object.keys(errors).length > 1 && (
                    <p className="text-[11px] text-red-600/90 mt-1">
                      Terdapat <strong>{Object.keys(errors).length}</strong> kolom yang memerlukan perbaikan.
                    </p>
                  )}
                </div>
              </div>
            )}
            {children}
          </div>

          <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-white flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onPrevious}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {step < stepCount ? (
              <button
                type="button"
                onClick={onNext}
                disabled={!currentStepValid}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Langkah Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading || fileProcessing || !currentStepValid}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Data...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{submitLabel}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </Motion.div>
    </AnimatePresence>
  );
}
