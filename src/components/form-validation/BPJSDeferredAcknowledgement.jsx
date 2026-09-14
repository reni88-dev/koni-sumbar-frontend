import { getFieldErrorId } from './profileValidation';
import { firstFieldError } from '../form-modal/formUtils';

const ACKNOWLEDGEMENT_TEXT = 'Saya menyatakan dokumen BPJS belum tersedia dan akan melengkapinya kemudian.';

export function BPJSDeferredAcknowledgement({
  validation,
  fieldName = 'bpjs_deferred_acknowledgement',
}) {
  const {
    errors,
    bpjsDeferredAcknowledgementRequired,
    bpjsDeferredAcknowledged,
    handleBPJSDeferredAcknowledgementChange,
  } = validation;

  if (!bpjsDeferredAcknowledgementRequired) return null;

  const error = errors[fieldName];
  return (
    <div className={`rounded-xl border p-3 ${error ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <label
        data-field={fieldName}
        className="flex cursor-pointer items-start gap-3 text-sm leading-5 text-amber-950"
      >
        <input
          type="checkbox"
          checked={bpjsDeferredAcknowledged}
          onChange={(event) => handleBPJSDeferredAcknowledgementChange(event.target.checked)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? getFieldErrorId(fieldName) : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-amber-400 text-red-600 focus:ring-red-500"
        />
        <span>{ACKNOWLEDGEMENT_TEXT}</span>
      </label>
      {error && (
        <p id={getFieldErrorId(fieldName)} className="mt-2 text-xs font-medium text-red-600">
          {firstFieldError(error)}
        </p>
      )}
    </div>
  );
}
