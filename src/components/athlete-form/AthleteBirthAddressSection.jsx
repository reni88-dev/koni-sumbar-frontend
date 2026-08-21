import { Calendar } from 'lucide-react';
import { DateInput } from '../DateInput';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { RegionCascadeFields } from '../form-modal/RegionCascadeFields';
import { RELIGIONS } from './athleteFormModel';

export function AthleteBirthAddressSection({ form, validation }) {
  const { data: formData, updateField, handleBirthDateChange } = form;
  const { errors } = validation;
  return (
    <FormSectionCard
      icon={Calendar}
      iconColor="text-amber-600"
      iconBg="bg-amber-50"
      title="Kelahiran & Domisili"
      subtitle="Tempat & tanggal lahir, jenis kelamin, agama dan domisili"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Tempat Lahir <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.birth_place}
          onChange={e => updateField('birth_place', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Kota/Kabupaten kelahiran"
        />
        {errors.birth_place && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.birth_place)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Tanggal Lahir <span className="text-red-500">*</span>
        </label>
        <DateInput
          value={formData.birth_date}
          onChange={e => handleBirthDateChange(e.target.value)}
          className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm ${
            errors.birth_date ? 'border-red-400 bg-red-50' : 'border-slate-200'
          }`}
        />
        {errors.birth_date && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.birth_date)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Jenis Kelamin <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.gender}
          onChange={e => updateField('gender', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
        >
          <option value="">-- Pilih Jenis Kelamin --</option>
          <option value="male">Laki-laki</option>
          <option value="female">Perempuan</option>
        </select>
        {errors.gender && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.gender)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Agama <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.religion}
          onChange={e => updateField('religion', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
        >
          <option value="">-- Pilih Agama --</option>
          {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.religion && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.religion)}</p>}
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Alamat Lengkap Domisili <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.address}
          onChange={e => updateField('address', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none"
          rows={2}
          placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten"
        />
        {errors.address && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.address)}</p>}
      </div>

      <RegionCascadeFields form={form} validation={validation} />
    </FormSectionCard>
  );
}
