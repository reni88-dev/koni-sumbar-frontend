import { CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
import { getFieldControlProps, getFieldErrorId } from '../form-validation/profileValidation';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { DOCUMENT_ACCEPT } from '../form-modal/mediaUtils';
import { IDENTITY_DOCUMENT_LABELS } from './athleteFormModel';

export function AthleteDocumentsSection({ athlete, form, files, validation }) {
  const { data: formData, updateField } = form;
  const {
    identityDocumentFile,
    bpjsDocumentFile,
    documentProcessing,
    documentErrors,
  } = files;
  const {
    ageGroup,
    errors,
    canReuseStoredIdentity,
    canReuseStoredBPJS,
    storedIdentityType,
  } = validation;
  const handleDocumentChange = (kind) => files.handleDocumentChange(kind, formData.birth_date);
  const storedIdentityNeedsConfirmation = Boolean(athlete?.identity_document) && !storedIdentityType;
  const selectedIdentityLabel = IDENTITY_DOCUMENT_LABELS[formData.identity_document_type];

  return (
    <FormSectionCard
      icon={FileText}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-50"
      title="Dokumen Verifikasi"
      subtitle="Dokumen identitas wajib diunggah; dokumen BPJS dapat dilampirkan bila tersedia"
    >
      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            Dokumen Identitas <span className="text-red-500">*</span>
          </label>
          {ageGroup && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              ageGroup === 'adult' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'
            }`}>
              {ageGroup === 'adult' ? 'Usia 17+ (KTP)' : 'Di Bawah 17 Tahun (KK/Akte)'}
            </span>
          )}
        </div>

        {ageGroup ? (
          <select
            {...getFieldControlProps('identity_document_type', errors)}
            value={formData.identity_document_type}
            onChange={(event) => updateField('identity_document_type', event.target.value)}
            className={`w-full rounded-xl border bg-white px-3.5 py-2 text-xs outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 ${
              errors.identity_document_type ? 'border-red-400 bg-red-50' : 'border-slate-200'
            }`}
          >
            <option value="">-- Konfirmasi Jenis Dokumen Identitas --</option>
            {ageGroup === 'adult' ? (
              <option value="ktp">KTP Elektronik</option>
            ) : (
              <>
                <option value="family_card">Kartu Keluarga (KK)</option>
                <option value="birth_certificate">Akte Kelahiran</option>
              </>
            )}
          </select>
        ) : (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-700">
            Isi tanggal lahir atlet terlebih dahulu untuk menentukan jenis dokumen identitas.
          </p>
        )}
        {errors.identity_document_type && (
          <p id={getFieldErrorId('identity_document_type')} className="text-xs text-red-500">
            {firstFieldError(errors.identity_document_type)}
          </p>
        )}

        {storedIdentityNeedsConfirmation && !formData.identity_document_type && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
            Dokumen lama sudah tersimpan tetapi jenisnya belum tercatat. Konfirmasikan jenis dokumen sesuai usia; file lama dapat tetap digunakan tanpa upload ulang.
          </p>
        )}

        <label
          data-field="identity_document"
          tabIndex={-1}
          aria-invalid={Boolean(documentErrors.identity || errors.identity_document) || undefined}
          aria-describedby={(documentErrors.identity || errors.identity_document) ? getFieldErrorId('identity_document') : undefined}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-red-300 ${
            !ageGroup || documentProcessing.identity
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              : 'cursor-pointer border-slate-300 bg-white shadow-2xs hover:border-red-400 hover:bg-red-50/50'
          }`}
        >
          {documentProcessing.identity ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Upload className="h-4 w-4 text-slate-500" />}
          <span className="text-xs font-bold text-slate-700">
            {documentProcessing.identity ? 'Memproses dokumen...' : 'Pilih Dokumen Identitas'}
          </span>
          <input
            name="identity_document"
            type="file"
            accept={DOCUMENT_ACCEPT}
            onChange={handleDocumentChange('identity')}
            disabled={!ageGroup || documentProcessing.identity}
            className="hidden"
          />
        </label>

        {identityDocumentFile ? (
          <p className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">File siap: {identityDocumentFile.name}</span>
          </p>
        ) : canReuseStoredIdentity ? (
          <p className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{selectedIdentityLabel || IDENTITY_DOCUMENT_LABELS[storedIdentityType]} tersimpan akan digunakan kembali</span>
          </p>
        ) : athlete?.identity_document && !storedIdentityNeedsConfirmation ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
            Jenis atau kelompok umur berubah. Unggah dokumen identitas pengganti yang sesuai.
          </p>
        ) : null}

        {(documentErrors.identity || errors.identity_document) && (
          <p id={getFieldErrorId('identity_document')} className="text-xs text-red-500">
            {documentErrors.identity || firstFieldError(errors.identity_document)}
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            Dokumen BPJS <span className="normal-case text-slate-400">(Opsional)</span>
          </label>
          <span className="text-[10px] font-semibold text-slate-500">Kesehatan/Naker</span>
        </div>
        <p className="text-xs text-slate-500">Opsional. Unggah scan kartu atau surat kepesertaan BPJS (PDF, JPG, PNG, WebP maks. 10 MB).</p>
        <label
          data-field="bpjs_document"
          tabIndex={-1}
          aria-invalid={Boolean(documentErrors.bpjs || errors.bpjs_document) || undefined}
          aria-describedby={(documentErrors.bpjs || errors.bpjs_document) ? getFieldErrorId('bpjs_document') : undefined}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 outline-none transition-all focus:ring-2 focus:ring-red-300 ${
            documentProcessing.bpjs
              ? 'cursor-wait border-slate-200 bg-slate-100 text-slate-400'
              : 'cursor-pointer border-slate-300 bg-white shadow-2xs hover:border-red-400 hover:bg-red-50/50'
          }`}
        >
          {documentProcessing.bpjs ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <Upload className="h-4 w-4 text-slate-500" />}
          <span className="text-xs font-bold text-slate-700">{documentProcessing.bpjs ? 'Memproses dokumen...' : 'Pilih Dokumen BPJS'}</span>
          <input name="bpjs_document" type="file" accept={DOCUMENT_ACCEPT} onChange={handleDocumentChange('bpjs')} disabled={documentProcessing.bpjs} className="hidden" />
        </label>

        {bpjsDocumentFile ? (
          <p className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">File siap: {bpjsDocumentFile.name}</span>
          </p>
        ) : canReuseStoredBPJS ? (
          <p className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Dokumen BPJS sudah tersimpan di server</span>
          </p>
        ) : null}

        {(documentErrors.bpjs || errors.bpjs_document) && (
          <p id={getFieldErrorId('bpjs_document')} className="text-xs text-red-500">
            {documentErrors.bpjs || firstFieldError(errors.bpjs_document)}
          </p>
        )}
      </div>
    </FormSectionCard>
  );
}
