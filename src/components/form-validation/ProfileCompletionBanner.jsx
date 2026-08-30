import { AlertTriangle, ArrowRight } from 'lucide-react';
import { getFieldMeta, humanizeFieldName } from './profileValidation';

export function ProfileCompletionBanner({ missingFields = [], metadata, onComplete }) {
  if (missingFields.length === 0) return null;
  const labels = missingFields.map((field) => getFieldMeta(metadata, field)?.label || humanizeFieldName(field));

  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm sm:p-5" role="status">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-amber-950">Profil belum lengkap</h2>
            <p className="mt-0.5 text-sm text-amber-800">
              Masih ada <strong>{missingFields.length}</strong> field profil yang perlu dilengkapi atau diperbaiki.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              {labels.slice(0, 5).join(', ')}{labels.length > 5 ? `, dan ${labels.length - 5} lainnya` : ''}.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onComplete}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          Lengkapi Profil
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
