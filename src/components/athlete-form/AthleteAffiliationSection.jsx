import { Trophy } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { getFieldControlProps, getFieldErrorId } from '../form-validation/profileValidation';

export function AthleteAffiliationSection({ athlete, form, lookups, validation }) {
  const { data: formData, updateField, handleCaborChange } = form;
  const { cabors, organizations, competitionClasses } = lookups;
  const errors = validation?.errors || {};
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
          {...getFieldControlProps('cabor_id', errors)}
          options={cabors}
          value={formData.cabor_id}
          onChange={(val) => handleCaborChange(val)}
          placeholder="Cari & pilih cabang olahraga..."
        />
        {errors.cabor_id && <p id={getFieldErrorId('cabor_id')} className="text-red-500 text-xs mt-1">{firstFieldError(errors.cabor_id)}</p>}
      </div>

      {athlete && (
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Kelas Pertandingan
          </label>
          <SearchableSelect
          {...getFieldControlProps('competition_class_id', errors)}
            options={competitionClasses}
            value={formData.competition_class_id}
            onChange={(val) => updateField('competition_class_id', val)}
            placeholder={formData.cabor_id ? 'Pilih Kelas Pertandingan' : 'Pilih Cabor terlebih dahulu'}
            disabled={!formData.cabor_id}
          />
          {errors.competition_class_id && <p id={getFieldErrorId('competition_class_id')} className="text-red-500 text-xs mt-1">{firstFieldError(errors.competition_class_id)}</p>}
        </div>
      )}

      <div className={athlete ? '' : 'sm:col-span-2'}>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Organisasi / Pengcab <span className="text-red-500">*</span>
        </label>
        <SearchableSelect
          {...getFieldControlProps('organization_id', errors)}
          options={organizations}
          value={formData.organization_id}
          onChange={(val) => updateField('organization_id', val)}
          placeholder="Cari & pilih organisasi pengcab..."
        />
        {errors.organization_id && <p id={getFieldErrorId('organization_id')} className="text-red-500 text-xs mt-1">{firstFieldError(errors.organization_id)}</p>}
      </div>
    </FormSectionCard>
  );
}
