import { Award } from 'lucide-react';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { LICENSE_LEVELS } from './coachFormModel';

export function CoachLicenseSection({ form }) {
  const { data: formData, updateField } = form;
  return (
    <FormSectionCard
      icon={Award}
      iconColor="text-amber-600"
      iconBg="bg-amber-50"
      title="Lisensi & Spesialisasi"
      subtitle="Data lisensi dan bidang keahlian bersifat opsional"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nomor Lisensi <span className="normal-case text-slate-400">(Opsional)</span>
        </label>
        <input
          name="license_number"
          data-field="license_number"
          type="text"
          value={formData.license_number}
          onChange={(e) => updateField('license_number', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none font-mono text-sm"
          placeholder="Nomor lisensi kepelatihan"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Level Lisensi <span className="normal-case text-slate-400">(Opsional)</span>
        </label>
        <select
          name="license_level"
          data-field="license_level"
          value={formData.license_level}
          onChange={(e) => updateField('license_level', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white"
        >
          <option value="">Pilih Level Lisensi</option>
          {LICENSE_LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Spesialisasi <span className="normal-case text-slate-400">(Opsional)</span>
        </label>
        <input
          name="specialization"
          data-field="specialization"
          type="text"
          value={formData.specialization}
          onChange={(e) => updateField('specialization', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Contoh: Teknik, Fisik, Taktik, Mental"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Tahun Mulai Melatih
        </label>
        <input
          name="coaching_start_year"
          data-field="coaching_start_year"
          type="number"
          value={formData.coaching_start_year}
          onChange={(e) => updateField('coaching_start_year', e.target.value)}
          min={1950}
          max={new Date().getFullYear()}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Contoh: 2018"
        />
      </div>
    </FormSectionCard>
  );
}
