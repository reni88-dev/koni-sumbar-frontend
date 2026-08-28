import { CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
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
    documentErrors
  } = files;
  const {
    ageGroup,
    errors,
    canReuseStoredIdentity,
    canReuseStoredBPJS,
    storedIdentityType
  } = validation;
  const handleDocumentChange = (kind) => files.handleDocumentChange(kind, formData.birth_date);
  return (
    <FormSectionCard
      icon={FileText}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-50"
      title="Dokumen Verifikasi"
      subtitle="Dokumen identitas wajib diunggah; dokumen BPJS dapat dilampirkan bila tersedia"
    >
      {/* Dokumen Identitas Box */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Dokumen Identitas <span className="text-red-500">*</span>
          </label>
          {ageGroup && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              ageGroup === 'adult' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'
            }`}>
              {ageGroup === 'adult' ? 'Usia 17+ (Wajib KTP)' : 'Usia Di Bawah 17 Thn (KK/Akte)'}
            </span>
          )}
        </div>

        {ageGroup === 'adult' ? (
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>KTP Elektronik</span>
          </div>
        ) : ageGroup === 'minor' ? (
          <select
            value={formData.identity_document_type}
            onChange={e => updateField('identity_document_type', e.target.value)}
            className={`w-full px-3.5 py-2 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-xs bg-white ${
              errors.identity_document_type ? 'border-red-400 bg-red-50' : 'border-slate-200'
            }`}
          >
            <option value="">-- Pilih Jenis Dokumen (Di Bawah 17 Thn) --</option>
            <option value="family_card">Kartu Keluarga (KK)</option>
            <option value="birth_certificate">Akte Kelahiran</option>
          </select>
        ) : (
          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            Isi tanggal lahir atlet terlebih dahulu untuk menentukan jenis dokumen identitas.
          </p>
        )}
        {errors.identity_document_type && (
          <p className="text-red-500 text-xs">{firstFieldError(errors.identity_document_type)}</p>
        )}

        <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed rounded-xl transition-all ${
          !ageGroup || documentProcessing.identity
            ? 'cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
            : 'cursor-pointer bg-white border-slate-300 hover:border-red-400 hover:bg-red-50/50 shadow-2xs'
        }`}>
          {documentProcessing.identity ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Upload className="w-4 h-4 text-slate-500" />}
          <span className="text-xs font-bold text-slate-700">
            {documentProcessing.identity ? 'Memproses dokumen...' : 'Pilih Dokumen Identitas'}
          </span>
          <input
            type="file"
            accept={DOCUMENT_ACCEPT}
            onChange={handleDocumentChange('identity')}
            disabled={!ageGroup || documentProcessing.identity}
            className="hidden"
          />
        </label>

        {identityDocumentFile ? (
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">File siap: {identityDocumentFile.name}</span>
          </p>
        ) : canReuseStoredIdentity ? (
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{IDENTITY_DOCUMENT_LABELS[storedIdentityType]} sudah tersimpan di server</span>
          </p>
        ) : athlete?.identity_document ? (
          <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
            Dokumen tersimpan tidak sesuai dengan kelompok umur saat ini. Harap unggah dokumen pengganti.
          </p>
        ) : null}

        {(documentErrors.identity || errors.identity_document) && (
          <p className="text-red-500 text-xs">{documentErrors.identity || firstFieldError(errors.identity_document)}</p>
        )}
      </div>

      {/* Dokumen BPJS Box */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Dokumen BPJS <span className="normal-case text-slate-400">(Opsional)</span>
          </label>
          <span className="text-[10px] font-semibold text-slate-500">Kesehatan/Naker</span>
        </div>

        <p className="text-xs text-slate-500">
          Opsional. Unggah scan kartu atau surat kepesertaan BPJS (PDF, JPG, PNG, WebP maks. 10 MB).
        </p>

        <label className={`flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed rounded-xl transition-all ${
          documentProcessing.bpjs
            ? 'cursor-wait bg-slate-100 text-slate-400 border-slate-200'
            : 'cursor-pointer bg-white border-slate-300 hover:border-red-400 hover:bg-red-50/50 shadow-2xs'
        }`}>
          {documentProcessing.bpjs ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Upload className="w-4 h-4 text-slate-500" />}
          <span className="text-xs font-bold text-slate-700">
            {documentProcessing.bpjs ? 'Memproses dokumen...' : 'Pilih Dokumen BPJS'}
          </span>
          <input
            type="file"
            accept={DOCUMENT_ACCEPT}
            onChange={handleDocumentChange('bpjs')}
            disabled={documentProcessing.bpjs}
            className="hidden"
          />
        </label>

        {bpjsDocumentFile ? (
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">File siap: {bpjsDocumentFile.name}</span>
          </p>
        ) : canReuseStoredBPJS ? (
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Dokumen BPJS sudah tersimpan di server</span>
          </p>
        ) : null}

        {(documentErrors.bpjs || errors.bpjs_document) && (
          <p className="text-red-500 text-xs">{documentErrors.bpjs || firstFieldError(errors.bpjs_document)}</p>
        )}
      </div>
    </FormSectionCard>
  );
}
