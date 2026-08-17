import { Building2 } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { RegionCascadeFields } from '../form-modal/RegionCascadeFields';

export function CoachAffiliationSection({ form, lookups, validation }) {
  const { data: formData, updateField } = form;
  const { cabors, organizations } = lookups;
  const { errors } = validation;
  return (
    <FormSectionCard
      icon={Building2}
      iconColor="text-emerald-600"
      iconBg="bg-emerald-50"
      title="Afiliasi Olahraga & Domisili"
      subtitle="Cabang olahraga, induk organisasi / pengcab dan alamat domisili"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Cabang Olahraga <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          options={cabors}
          value={formData.cabor_id}
          onChange={(val) => updateField('cabor_id', val)}
          placeholder="Cari & pilih cabang olahraga..."
        />
        {errors.cabor_id && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.cabor_id)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Organisasi / Pengcab
        </label>
        <SearchableSelect
          options={organizations}
          value={formData.organization_id}
          onChange={(val) => updateField('organization_id', val)}
          placeholder="Cari & pilih organisasi / pengcab..."
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Alamat Domisili
        </label>
        <textarea
          value={formData.address}
          onChange={(e) => updateField('address', e.target.value)}
          rows={2}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none"
          placeholder="Alamat lengkap tempat tinggal saat ini"
        />
      </div>

      <RegionCascadeFields form={form} validation={validation} />
    </FormSectionCard>
  );
}
