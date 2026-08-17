import { Trophy } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';
import { FormSectionCard } from '../form-modal/FormSectionCard';

export function AthleteAffiliationSection({ athlete, form, lookups }) {
  const { data: formData, updateField, handleCaborChange } = form;
  const { cabors, organizations, competitionClasses } = lookups;
  return (
    <FormSectionCard
      icon={Trophy}
      iconColor="text-rose-600"
      iconBg="bg-rose-50"
      title="Cabang Olahraga & Pengcab"
      subtitle="Afiliasi disiplin olahraga dan organisasi pengurus cabang"
    >
      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Cabang Olahraga (Disiplin) <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          options={cabors}
          value={formData.cabor_id}
          onChange={(val) => handleCaborChange(val)}
          placeholder="Cari & pilih cabang olahraga..."
        />
      </div>

      {athlete && (
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Kelas Pertandingan
          </label>
          <SearchableSelect
            options={competitionClasses}
            value={formData.competition_class_id}
            onChange={(val) => updateField('competition_class_id', val)}
            placeholder={formData.cabor_id ? 'Pilih Kelas Pertandingan' : 'Pilih Cabor terlebih dahulu'}
            disabled={!formData.cabor_id}
          />
        </div>
      )}

      <div className={athlete ? '' : 'sm:col-span-2'}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Organisasi / Pengcab <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          options={organizations}
          value={formData.organization_id}
          onChange={(val) => updateField('organization_id', val)}
          placeholder="Cari & pilih organisasi pengcab..."
        />
      </div>
    </FormSectionCard>
  );
}
