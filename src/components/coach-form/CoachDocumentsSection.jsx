import { AlertCircle, CheckCircle2, ExternalLink, FileText, Loader2, Upload } from 'lucide-react';
import { getFieldErrorId } from '../form-validation/profileValidation';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { DOCUMENT_ACCEPT } from '../form-modal/mediaUtils';

function DocumentUploadCard({
  field,
  title,
  hint,
  file,
  stored,
  processing,
  error,
  fieldError,
  onChange,
  opening = false,
  onOpenStored,
  required = true,
}) {
  const hasDocument = Boolean(file || stored);
  const hasError = Boolean(error || fieldError);
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
          {title} {required ? <span className="text-red-500">*</span> : <span className="normal-case text-slate-400">(Opsional)</span>}
        </label>
        <span className="text-[10px] font-semibold text-slate-500">PDF/Gambar, maks. 10 MB</span>
      </div>
      <p className="text-xs text-slate-500">{hint}</p>

      <label
        data-field={field}
        tabIndex={-1}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? getFieldErrorId(field) : undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-red-300 ${
          processing
            ? 'cursor-wait border-slate-200 bg-slate-100 text-slate-400'
            : hasError
              ? 'cursor-pointer border-red-300 bg-red-50/60 hover:border-red-400'
              : hasDocument
                ? 'cursor-pointer border-emerald-300 bg-emerald-50/50 hover:border-emerald-400'
                : 'cursor-pointer border-slate-300 bg-white shadow-2xs hover:border-red-400 hover:bg-red-50/50'
        }`}
      >
        {processing ? (
          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
        ) : hasDocument ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        ) : (
          <Upload className="h-4 w-4 text-slate-500" />
        )}
        <span className="text-center text-xs font-bold text-slate-700">
          {processing
            ? 'Memproses dokumen...'
            : file
              ? `Ganti file: ${file.name}`
              : stored
                ? 'Dokumen tersimpan siap digunakan kembali (klik untuk ganti)'
                : 'Pilih dokumen'}
        </span>
        <input name={field} type="file" accept={DOCUMENT_ACCEPT} onChange={onChange} disabled={processing} className="hidden" />
      </label>

      {stored && onOpenStored && (
        <button
          type="button"
          onClick={onOpenStored}
          disabled={opening || processing}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
          <span>{opening ? 'Membuka Dokumen...' : `Buka ${title} Tersimpan`}</span>
        </button>
      )}

      {file ? (
        <p className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">File baru siap diunggah: {file.name}</span>
        </p>
      ) : stored ? (
        <p className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>Dokumen tersimpan akan digunakan kembali</span>
        </p>
      ) : null}

      {hasError && (
        <p id={getFieldErrorId(field)} className="flex items-center gap-1.5 text-xs font-medium text-red-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error || firstFieldError(fieldError)}</span>
        </p>
      )}
    </div>
  );
}

export function CoachDocumentsSection({ files, validation }) {
  const { errors } = validation;
  return (
    <FormSectionCard
      icon={FileText}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-50"
      title="Dokumen Verifikasi"
      subtitle="KTP wajib diunggah; dokumen BPJS dapat dilampirkan bila tersedia"
    >
      <DocumentUploadCard
        field="identity_document"
        title="KTP Pelatih"
        hint="Unggah scan atau foto KTP yang jelas. Gambar akan otomatis dioptimasi ke WebP."
        file={files.identityDocumentFile}
        stored={files.canReuseStoredIdentity}
        processing={files.documentProcessing.identity}
        error={files.documentErrors.identity}
        fieldError={errors.identity_document}
        onChange={files.handleDocumentChange('identity')}
        opening={files.documentOpening.identity}
        onOpenStored={() => files.handleOpenStoredDocument('identity')}
      />
      <DocumentUploadCard
        field="bpjs_document"
        title="BPJS Kesehatan/Ketenagakerjaan"
        required={false}
        hint="Opsional. Unggah kartu atau surat kepesertaan BPJS jika tersedia."
        file={files.bpjsDocumentFile}
        stored={files.canReuseStoredBPJS}
        processing={files.documentProcessing.bpjs}
        error={files.documentErrors.bpjs}
        fieldError={errors.bpjs_document}
        onChange={files.handleDocumentChange('bpjs')}
        opening={files.documentOpening.bpjs}
        onOpenStored={() => files.handleOpenStoredDocument('bpjs')}
      />
    </FormSectionCard>
  );
}
