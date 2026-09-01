import { User } from 'lucide-react';
import { firstFieldError } from '../form-modal/formUtils';
import { getFieldControlProps, getFieldErrorId } from '../form-validation/profileValidation';
import { FormSectionCard } from '../form-modal/FormSectionCard';

export function AthleteIdentitySection({ form, validation }) {
  const { data: formData, updateField } = form;
  const { errors, nikInvalid, noKKInvalid } = validation;
  return (
    <FormSectionCard
      icon={User}
      iconColor="text-blue-600"
      iconBg="bg-blue-50"
      title="Identitas Utama & Kependudukan"
      subtitle="Nama lengkap dan data nomor identitas kependudukan resmi"
    >
      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          {...getFieldControlProps('name', errors)}
          type="text"
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm transition-colors ${
            errors.name ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
          }`}
          placeholder="Masukkan nama lengkap sesuai KTP/KK"
        />
        {errors.name && <p id={getFieldErrorId('name')} className="text-red-500 text-xs mt-1">{firstFieldError(errors.name)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
        </label>
        <input
          {...getFieldControlProps('nik', errors)}
          type="text"
          inputMode="numeric"
          value={formData.nik}
          onChange={e => updateField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
          className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
            nikInvalid
              ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
              : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
          }`}
          placeholder="16 digit angka NIK"
          maxLength={16}
        />
        <div className="mt-1 flex items-start justify-between gap-2 text-xs">
          <p className={nikInvalid ? 'text-red-500' : 'text-slate-400'}>
            {firstFieldError(errors.nik) || (nikInvalid ? 'NIK harus tepat 16 digit angka' : 'Wajib 16 digit angka')}
          </p>
          <span className={`font-mono ${formData.nik.length === 16 ? 'text-emerald-600 font-bold' : nikInvalid ? 'text-red-500' : 'text-slate-400'}`}>
            {formData.nik.length}/16
          </span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nomor Kartu Keluarga (No. KK) <span className="text-red-500">*</span>
        </label>
        <input
          {...getFieldControlProps('no_kk', errors)}
          type="text"
          inputMode="numeric"
          value={formData.no_kk}
          onChange={e => updateField('no_kk', e.target.value.replace(/\D/g, '').slice(0, 16))}
          className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
            noKKInvalid
              ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
              : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
          }`}
          placeholder="16 digit angka No. KK"
          maxLength={16}
        />
        <div className="mt-1 flex items-start justify-between gap-2 text-xs">
          <p className={noKKInvalid ? 'text-red-500' : 'text-slate-400'}>
            {firstFieldError(errors.no_kk) || (noKKInvalid ? 'No. KK harus tepat 16 digit angka' : 'Wajib 16 digit angka')}
          </p>
          <span className={`font-mono ${formData.no_kk.length === 16 ? 'text-emerald-600 font-bold' : noKKInvalid ? 'text-red-500' : 'text-slate-400'}`}>
            {formData.no_kk.length}/16
          </span>
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nomor Atlet Nasional (Opsional)
        </label>
        <input
          {...getFieldControlProps('national_athlete_number', errors)}
          type="text"
          value={formData.national_athlete_number}
          onChange={e => updateField('national_athlete_number', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Contoh: NAT-SUMBAR-2024-001"
        />
      </div>
    </FormSectionCard>
  );
}
