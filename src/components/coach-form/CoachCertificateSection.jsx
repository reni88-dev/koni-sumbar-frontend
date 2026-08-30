import { AlertCircle, CheckCircle2, ExternalLink, FileText, Loader2, Upload } from 'lucide-react';
import { getFieldErrorId } from '../form-validation/profileValidation';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { DOCUMENT_ACCEPT as CERTIFICATE_ACCEPT } from '../form-modal/mediaUtils';

export function CoachCertificateSection({ coach, files, validation, loading }) {
  const { errors } = validation;
  const {
    certificateFile,
    certificateProcessing,
    certificateError,
    certificateOpening,
    handleCertificateChange,
    handleOpenStoredCertificate
  } = files;
  return (
    <FormSectionCard
      icon={FileText}
      iconColor="text-blue-600"
      iconBg="bg-blue-50"
      title="Dokumen Sertifikat Kepelatihan (Opsional)"
      subtitle="Unggah bukti fisik sertifikat atau lisensi bila tersedia"
    >
      <div className="sm:col-span-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-600 space-y-0.5">
            <p className="font-semibold text-slate-800">Ketentuan File Sertifikat:</p>
            <p className="text-[11px] text-slate-500">
              Format PDF, JPG, PNG, atau WebP. Gambar otomatis dioptimasi WebP. Maksimal ukuran file 10 MB.
            </p>
          </div>
          {coach?.certificate_document && (
            <button
              type="button"
              onClick={handleOpenStoredCertificate}
              disabled={certificateOpening}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {certificateOpening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>Buka Sertifikat Tersimpan</span>
            </button>
          )}
        </div>

        <label data-field="certificate_document" tabIndex={-1} aria-invalid={Boolean(certificateError || errors.certificate_document) || undefined} aria-describedby={(certificateError || errors.certificate_document) ? getFieldErrorId('certificate_document') : undefined} className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed transition-all ${
          certificateProcessing || loading
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-wait'
            : errors.certificate_document || certificateError
              ? 'bg-red-50/50 border-red-300 hover:bg-red-50 hover:border-red-400 text-red-700 cursor-pointer'
              : certificateFile || coach?.certificate_document
                ? 'bg-emerald-50/40 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 text-emerald-800 cursor-pointer'
                : 'bg-slate-50/60 border-slate-300 hover:bg-white hover:border-red-400 hover:shadow-xs text-slate-600 cursor-pointer'
        }`}>
          <div className={`p-3 rounded-2xl ${
            certificateFile || coach?.certificate_document
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-white shadow-2xs text-slate-600'
          }`}>
            {certificateProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin text-red-600" />
            ) : certificateFile || coach?.certificate_document ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <Upload className="w-6 h-6 text-slate-500" />
            )}
          </div>

          <div className="text-center space-y-0.5">
            <p className="text-xs font-bold text-slate-800">
              {certificateProcessing
                ? 'Memproses file dokumen sertifikat...'
                : certificateFile
                  ? `File siap: ${certificateFile.name}`
                  : coach?.certificate_document
                    ? 'Sertifikat sudah tersimpan (Klik untuk ganti file)'
                    : 'Klik untuk pilih dokumen sertifikat'}
            </p>
            <p className="text-[11px] text-slate-400">
              PDF, JPG, PNG, atau WebP hingga 10 MB
            </p>
          </div>

          <input
            name="certificate_document"
            type="file"
            accept={CERTIFICATE_ACCEPT}
            onChange={handleCertificateChange}
            disabled={certificateProcessing || loading}
            className="hidden"
          />
        </label>

        {(certificateError || errors.certificate_document) && (
          <p id={getFieldErrorId('certificate_document')} className="text-xs text-red-500 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{certificateError || firstFieldError(errors.certificate_document)}</span>
          </p>
        )}
      </div>
    </FormSectionCard>
  );
}
