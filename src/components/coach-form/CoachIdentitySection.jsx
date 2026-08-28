import { User } from 'lucide-react';
import { DateInput } from '../DateInput';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { GENDERS, RELIGIONS } from './coachFormModel';

export function CoachIdentitySection({ form, validation }) {
  const { data: formData, updateField } = form;
  const { errors, nikInvalid } = validation;
  return (
    <FormSectionCard
      icon={User}
      iconColor="text-blue-600"
      iconBg="bg-blue-50"
      title="Identitas Utama & Kependudukan"
      subtitle="Nama lengkap dan nomor identitas kependudukan resmi"
    >
      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nama Lengkap <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm transition-colors ${
            errors.name ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
          }`}
          placeholder="Masukkan nama lengkap sesuai KTP"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.name)}</p>}
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          NIK (Nomor Induk Kependudukan) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={formData.nik}
          onChange={(e) => updateField('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
          className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
            nikInvalid
              ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
              : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
          }`}
          placeholder="16 digit angka NIK"
          maxLength={16}
          required
        />
        <div className="mt-1 flex items-start justify-between gap-2 text-xs">
          <p className={nikInvalid ? 'text-red-500' : 'text-slate-400'}>
            {firstFieldError(errors.nik) || (nikInvalid ? 'NIK harus tepat 16 digit angka' : 'Wajib, tepat 16 digit angka')}
          </p>
          {formData.nik && (
            <span className={`font-mono ${formData.nik.length === 16 ? 'text-emerald-600 font-bold' : nikInvalid ? 'text-red-500' : 'text-slate-400'}`}>
              {formData.nik.length}/16
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Tempat Lahir
        </label>
        <input
          type="text"
          value={formData.birth_place}
          onChange={(e) => updateField('birth_place', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Kota / Kabupaten lahir"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Tanggal Lahir
        </label>
        <DateInput
          value={formData.birth_date}
          onChange={(e) => updateField('birth_date', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Jenis Kelamin
        </label>
        <select
          value={formData.gender}
          onChange={(e) => updateField('gender', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white"
        >
          <option value="">Pilih Jenis Kelamin</option>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Agama
        </label>
        <select
          value={formData.religion}
          onChange={(e) => updateField('religion', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white"
        >
          <option value="">Pilih Agama</option>
          {RELIGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
    </FormSectionCard>
  );
}
