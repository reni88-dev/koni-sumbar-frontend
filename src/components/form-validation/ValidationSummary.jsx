import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { orderedValidationEntries } from './profileValidation';

export const ValidationSummary = forwardRef(function ValidationSummary({
  errors,
  metadata,
  onNavigate,
  title = 'Periksa kembali formulir',
  className = '',
}, ref) {
  const entries = orderedValidationEntries(errors, metadata);
  if (entries.length === 0) return null;

  return (
    <section
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border border-red-200 bg-red-50 p-4 shadow-xs outline-none focus:ring-2 focus:ring-red-300 ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-red-100 p-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-red-900">{title}</h3>
          <p className="mt-0.5 text-xs text-red-700">
            Terdapat <strong>{entries.length}</strong> field yang perlu diperbaiki. Pilih field untuk langsung menuju isian.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {entries.map((entry) => (
              <li key={entry.field}>
                <button
                  type="button"
                  onClick={() => onNavigate?.(entry.field)}
                  className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-left transition-colors hover:border-red-300 hover:bg-red-100/60 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  <span className="block text-xs font-bold text-red-900">{entry.label}</span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-red-700">
                    {entry.messages.join(' ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
});
