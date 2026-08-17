import { Activity, Award, Briefcase } from 'lucide-react';
import { FormSectionCard } from '../form-modal/FormSectionCard';

export function AthleteCareerStep({ form }) {
  const { data: formData, updateField, updateAchievement } = form;
  return (
    <div className="space-y-4">
    <FormSectionCard
      icon={Briefcase}
      iconColor="text-indigo-600"
      iconBg="bg-indigo-50"
      title="Informasi Karir & Keaktifan"
      subtitle="Tahun awal berkarir dalam olahraga prestasi"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Tahun Mulai Karir <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.career_start_year}
          onChange={e => updateField('career_start_year', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Contoh: 2018"
          min={1950}
          max={new Date().getFullYear()}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Status Keaktifan Atlet
        </label>
        <div className="flex items-center gap-3 mt-1.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={e => updateField('is_active', e.target.checked)}
            className="h-4 w-4 rounded-md accent-red-600 cursor-pointer"
          />
          <label htmlFor="is_active" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
            Atlet Aktif Membela KONI Sumatera Barat
          </label>
        </div>
      </div>
    </FormSectionCard>

    {/* 2. Prestasi Tertinggi */}
    <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-amber-100/30 p-4 sm:p-5 shadow-xs">
      <div className="mb-3 flex items-center gap-2.5 pb-2 border-b border-amber-200/60">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-200/80 text-amber-900">
          <Award className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-amber-950">3 Prestasi Tertinggi</h3>
          <p className="text-[11px] text-amber-800/80">Tuliskan medali / kejuaraan tertinggi yang pernah diraih atlet</p>
        </div>
      </div>

      <div className="space-y-2.5 pt-1">
        {formData.top_achievements.map((achievement, index) => {
          const medalEmojis = ['🥇', '🥈', '🥉'];
          const rankLabels = ['Prestasi Utama (Tertinggi)', 'Prestasi Kedua', 'Prestasi Ketiga'];
          return (
            <div key={`achievement-${index}`} className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm select-none">
                {medalEmojis[index]}
              </span>
              <input
                type="text"
                value={achievement}
                onChange={e => updateAchievement(index, e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-amber-300/80 bg-white rounded-xl focus:ring-2 focus:ring-amber-200 focus:border-amber-500 outline-none text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs"
                placeholder={`${rankLabels[index]} (Contoh: Medali Emas PON XXI Aceh-Sumut 2024)`}
              />
            </div>
          );
        })}
      </div>
    </div>

    {/* 3. Riwayat Cedera & Medis */}
    <FormSectionCard
      icon={Activity}
      iconColor="text-rose-600"
      iconBg="bg-rose-50"
      title="Riwayat Cedera & Medis"
      subtitle="Catatan riwayat cedera fisik, operasi, atau penyakit yang perlu diperhatikan"
    >
      <div className="sm:col-span-2">
        <textarea
          value={formData.injury_illness_history}
          onChange={e => updateField('injury_illness_history', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none"
          rows={3}
          placeholder="Contoh: Cedera ACL lutut kanan (2022, sudah operasi dan pemulihan tuntas), atau isi '-' jika tidak ada."
        />
      </div>
    </FormSectionCard>
    </div>
  );
}
