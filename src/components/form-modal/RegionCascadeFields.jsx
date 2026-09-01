import { Loader2, RefreshCw } from 'lucide-react';
import { firstFieldError } from './formUtils';
import { getFieldControlProps, getFieldErrorId } from '../form-validation/profileValidation';
import { useRegionCascade } from './useRegionCascade';

const FIELD_CONFIG = [
  { key: 'province', label: 'Provinsi', placeholder: '-- Pilih Provinsi --' },
  { key: 'city', label: 'Kota/Kabupaten', placeholder: '-- Pilih Kota/Kabupaten --' },
  { key: 'district', label: 'Kecamatan/Distrik', placeholder: '-- Pilih Kecamatan/Distrik --' },
  { key: 'village', label: 'Kelurahan/Desa', placeholder: '-- Pilih Kelurahan/Desa --' }
];

export function RegionCascadeFields({
  form,
  validation,
  optionalFields = [],
  allowManualVillage = false
}) {
  const regions = useRegionCascade({
    values: form.data,
    onChange: form.updateField,
    allowManualVillage
  });
  const errors = validation?.errors || {};
  const optionalFieldSet = new Set(optionalFields);

  return FIELD_CONFIG.map(({ key, label, placeholder }) => {
    const field = regions[key];
    const isOptional = optionalFieldSet.has(key);
    const hasNoOptions = !field.status.loading && !field.status.error && field.options.length === 0;
    return (
      <div key={key}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          {label} {isOptional
            ? <span className="normal-case text-slate-400">(Opsional)</span>
            : <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            {...getFieldControlProps(key, errors)}
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            disabled={field.disabled}
            className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
              errors[key] ? 'border-red-400 bg-red-50' : 'border-slate-200'
            }`}
          >
            <option value="">{field.status.loading ? `Memuat ${label.toLowerCase()}...` : placeholder}</option>
            {field.storedOnly && (
              <option value={field.storedId}>{field.storedValue} (nilai tersimpan)</option>
            )}
            {field.options.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
            {field.allowManual && (
              <option value={field.manualId}>Lainnya (isi manual)</option>
            )}
          </select>
          {field.status.loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400 pointer-events-none" />
          )}
        </div>
        {field.manual && (
          <input
            {...getFieldControlProps(key, errors)}
            type="text"
            value={field.manualValue}
            onChange={(event) => field.onManualChange(event.target.value)}
            className={`mt-2 w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm ${
              errors[key] ? 'border-red-400 bg-red-50' : 'border-slate-200'
            }`}
            placeholder="Masukkan nama kelurahan/desa secara manual"
          />
        )}
        {field.status.error && (
          <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-red-600">
            <span>{field.status.error}</span>
            <button
              type="button"
              onClick={field.onRetry}
              className="inline-flex shrink-0 items-center gap-1 font-semibold text-red-700 hover:text-red-800 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Coba lagi
            </button>
          </div>
        )}
        {field.storedOnly && !field.status.loading && (
          <p className="mt-1 text-xs text-amber-700">
            Nama tersimpan belum ditemukan di EMSIFA dan tetap dipertahankan.
          </p>
        )}
        {field.manual && (
          <p className="mt-1 text-xs text-slate-500">
            Isi manual bila kelurahan/desa tidak ditemukan pada daftar.
          </p>
        )}
        {key !== 'province' && hasNoOptions && !field.storedValue && field.disabled && (
          <p className="mt-1 text-xs text-slate-500">Pilih wilayah induk terlebih dahulu.</p>
        )}
        {errors[key] && (
          <p id={getFieldErrorId(key)} className="text-red-500 text-xs mt-1">{firstFieldError(errors[key])}</p>
        )}
      </div>
    );
  });
}
