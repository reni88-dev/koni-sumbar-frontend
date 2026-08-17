import { Camera, CheckCircle2, Loader2, User } from 'lucide-react';
import ProtectedImage from '../ProtectedImage';
import { IMAGE_ACCEPT } from './mediaUtils';

export function ProfilePhotoField({
  subjectLabel,
  photoFile,
  preview,
  processing,
  onChange
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
      <div className="relative shrink-0">
        <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl border-2 border-slate-200 bg-slate-100 p-1 shadow-inner overflow-hidden flex items-center justify-center">
          {preview ? (
            preview.startsWith('blob:') ? (
              <img src={preview} alt="Preview" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <ProtectedImage src={preview} alt="Preview" className="h-full w-full rounded-xl object-cover" />
            )
          ) : (
            <User className="h-12 w-12 text-slate-300" />
          )}
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left space-y-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Pas Foto {subjectLabel}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Unggah pas foto formal berlatar polos. Format JPG, PNG, atau WebP (maks. 10 MB).
          </p>
        </div>
        <div>
          <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            processing
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs hover:border-slate-300 cursor-pointer'
          }`}>
            {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 text-slate-600" />}
            <span>{processing ? 'Memproses Foto...' : preview ? 'Ganti Foto' : `Pilih Foto ${subjectLabel}`}</span>
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={onChange}
              disabled={processing}
              className="hidden"
            />
          </label>
          {photoFile && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 ml-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Foto siap diunggah
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
