import { AlertCircle, CheckCircle2, ExternalLink, FileText, Loader2, Upload } from 'lucide-react';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { DOCUMENT_ACCEPT } from '../form-modal/mediaUtils';

function DocumentUploadCard({
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
  required = true
}) {
  const hasDocument = Boolean(file || stored);
  const hasError = Boolean(error || fieldError);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
          {title} {required ? <span className="text-red-500">*</span> : <span className="normal-case text-slate-400">(Opsional)</span>}
        </label>
        <span className="text-[10px] font-semibold text-slate-500">PDF/Gambar, maks. 10 MB</span>
      </div>
      <p className="text-xs text-slate-500">{hint}</p>

      <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed rounded-xl transition-all ${
        processing
          ? 'cursor-wait bg-slate-100 text-slate-400 border-slate-200'
          : hasError
            ? 'cursor-pointer bg-red-50/60 border-red-300 hover:border-red-400'
            : hasDocument
              ? 'cursor-pointer bg-emerald-50/50 border-emerald-300 hover:border-emerald-400'
              : 'cursor-pointer bg-white border-slate-300 hover:border-red-400 hover:bg-red-50/50 shadow-2xs'
      }`}>
        {processing ? (
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
        ) : hasDocument ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <Upload className="w-4 h-4 text-slate-500" />
        )}
        <span className="text-xs font-bold text-slate-700 text-center">
          {processing
            ? 'Memproses dokumen...'
            : file
              ? `Ganti file: ${file.name}`
              : stored
                ? 'Dokumen tersimpan siap digunakan kembali (klik untuk ganti)'
                : 'Pilih dokumen'}
        </span>
        <input
          type="file"
          accept={DOCUMENT_ACCEPT}
          onChange={onChange}
          disabled={processing}
          className="hidden"
        />
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
        <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">File baru siap diunggah: {file.name}</span>
        </p>
      ) : stored ? (
        <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Dokumen tersimpan akan digunakan kembali</span>
        </p>
      ) : null}

      {hasError && (
        <p className="text-red-500 text-xs font-medium flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
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
