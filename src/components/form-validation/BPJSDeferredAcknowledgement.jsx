import { AlertTriangle } from 'lucide-react';
import { getFieldErrorId } from './profileValidation';
import { firstFieldError } from '../form-modal/formUtils';

const ACKNOWLEDGEMENT_TEXT = 'Saya menyatakan dokumen BPJS belum tersedia dan akan melengkapinya kemudian. Saya memahami bahwa atlet/pelatih ini tidak dapat didaftarkan ke pertandingan sebelum dokumen BPJS dilengkapi.';

export function BPJSDeferredAcknowledgement({ validation }) {
  const {
    errors,
    bpjsDeferredAcknowledgementRequired,
    bpjsDeferredAcknowledged,
    handleBPJSDeferredAcknowledgementChange,
  } = validation;

  if (!bpjsDeferredAcknowledgementRequired) return null;

  const error = errors.bpjs_deferred_acknowledgement;
  return (
    <div className={`rounded-xl border p-3 ${error ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <label
        data-field="bpjs_deferred_acknowledgement"
        className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-amber-950"
      >
        <input
          type="checkbox"
          checked={bpjsDeferredAcknowledged}
          onChange={(event) => handleBPJSDeferredAcknowledgementChange(event.target.checked)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? getFieldErrorId('bpjs_deferred_acknowledgement') : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 text-red-600 focus:ring-red-500"
        />
        <span>{ACKNOWLEDGEMENT_TEXT}</span>
      </label>
      <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-100/80 p-2.5 text-xs leading-5 text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Data belum dapat digunakan untuk pendaftaran pertandingan sampai dokumen BPJS tersedia.</span>
      </div>
      {error && (
        <p id={getFieldErrorId('bpjs_deferred_acknowledgement')} className="mt-2 text-xs font-medium text-red-600">
          {firstFieldError(error)}
        </p>
      )}
    </div>
  );
}
