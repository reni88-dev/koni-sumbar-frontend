import { Plus, ShieldCheck, Trash2, Trophy } from 'lucide-react';
import { FormSectionCard } from '../form-modal/FormSectionCard';

export function CoachAchievementsSection({ form, showActiveStatus = true }) {
  const {
    data: formData,
    updateField,
    achievementsList,
    handleAchievementChange,
    handleAddAchievement,
    handleRemoveAchievement
  } = form;
  return (
    <>
    <FormSectionCard
      icon={Trophy}
      iconColor="text-amber-600"
      iconBg="bg-amber-50"
      title="Prestasi Kepelatihan"
      subtitle="Daftar prestasi terbaik yang pernah diraih atlet asuhan / kepelatihan"
    >
      <div className="sm:col-span-2 space-y-2.5">
        {achievementsList.map((ach, idx) => (
          <div key={`coach-ach-${idx}`} className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold font-mono">
              #{idx + 1}
            </span>
            <input
              type="text"
              value={ach}
              onChange={(e) => handleAchievementChange(idx, e.target.value)}
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-xs sm:text-sm"
              placeholder={
                idx === 0 ? 'Contoh: Medali Emas PON XXI Aceh-Sumut 2024' :
                idx === 1 ? 'Contoh: Juara 1 Kejurnas 2023' :
                `Prestasi kepelatihan #${idx + 1} (Opsional)`
              }
            />
            {achievementsList.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveAchievement(idx)}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                title="Hapus baris prestasi"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        <div className="pt-1">
          <button
            type="button"
            onClick={handleAddAchievement}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Prestasi Lainnya</span>
          </button>
        </div>
      </div>
    </FormSectionCard>

    {showActiveStatus && (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            formData.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Status Keaktifan Pelatih</h4>
            <p className="text-xs text-slate-500">
              {formData.is_active ? 'Pelatih berstatus aktif dan terdaftar dalam pembinaan olahraga' : 'Pelatih berstatus nonaktif'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => updateField('is_active', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>
    )}
    </>
  );
}
