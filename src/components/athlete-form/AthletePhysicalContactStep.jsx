import { Activity, CheckCircle2, Loader2, Phone, XCircle } from 'lucide-react';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';
import { MARITAL_STATUSES } from './athleteFormModel';

export function AthletePhysicalContactStep({ form, lookups, validation }) {
  const { data: formData, updateField } = form;
  const { educationLevels } = lookups;
  const { errors, phone, email } = validation;
  const phoneStatus = phone.status;
  const phoneMessage = phone.message;
  const emailStatus = email.status;
  const emailMessage = email.message;
  return (
    <div className="space-y-4">
    <FormSectionCard
      icon={Activity}
      iconColor="text-emerald-600"
      iconBg="bg-emerald-50"
      title="Data Fisik & Pendidikan"
      subtitle="Antropometri atlet, tingkat pendidikan, dan pekerjaan"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Tinggi Badan (cm) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={formData.height}
          onChange={e => updateField('height', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Contoh: 175"
          min={50}
          max={300}
        />
        {errors.height && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.height)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Berat Badan (kg) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.1"
          value={formData.weight}
          onChange={e => updateField('weight', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Contoh: 68.5"
          min={20}
          max={300}
        />
        {errors.weight && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.weight)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Golongan Darah <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.blood_type}
          onChange={e => updateField('blood_type', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
        >
          <option value="">-- Pilih Golongan Darah --</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="AB">AB</option>
          <option value="O">O</option>
        </select>
        {errors.blood_type && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.blood_type)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Pendidikan Terakhir <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.education_level_id}
          onChange={e => updateField('education_level_id', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
        >
          <option value="">-- Pilih Jenjang Pendidikan --</option>
          {educationLevels.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {errors.education_level_id && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.education_level_id)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Pekerjaan <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.occupation}
          onChange={e => updateField('occupation', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Contoh: Pelajar / Mahasiswa / Swasta"
        />
        {errors.occupation && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.occupation)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Status Perkawinan <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.marital_status}
          onChange={e => updateField('marital_status', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm bg-white cursor-pointer"
        >
          <option value="">-- Pilih Status --</option>
          {MARITAL_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {errors.marital_status && <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.marital_status)}</p>}
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Hobi / Kegemaran
        </label>
        <input
          type="text"
          value={formData.hobby}
          onChange={e => updateField('hobby', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Contoh: Membaca, Bersepeda"
        />
      </div>
    </FormSectionCard>

    {/* 2. Kontak & Komunikasi */}
    <FormSectionCard
      icon={Phone}
      iconColor="text-purple-600"
      iconBg="bg-purple-50"
      title="Kontak & Komunikasi"
      subtitle="Nomor WhatsApp aktif dan alamat email untuk verifikasi & notifikasi"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nomor WhatsApp Atlet <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.phone}
            onChange={e => updateField('phone', e.target.value)}
            className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
              phoneStatus === 'valid' ? 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-100 focus:border-emerald-500' :
              phoneStatus === 'invalid' ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' :
              'border-slate-200 focus:ring-red-100 focus:border-red-500'
            }`}
            placeholder="Contoh: 081234567890"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {phoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            {phoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {phoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
          </div>
        </div>
        {(phoneMessage || errors.phone) && (
          <p className={`text-xs mt-1 font-medium ${
            phoneStatus === 'valid' ? 'text-emerald-700' :
            phoneStatus === 'invalid' ? 'text-red-500' :
            'text-slate-400'
          }`}>
            {firstFieldError(errors.phone) || phoneMessage}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Alamat Email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            value={formData.email}
            onChange={e => updateField('email', e.target.value)}
            className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none text-sm transition-colors ${
              emailStatus === 'valid'
                ? 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-100 focus:border-emerald-500'
                : emailStatus === 'invalid' || emailStatus === 'error' || errors.email
                  ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500'
                  : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
            }`}
            placeholder="atlet@contoh.com"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {emailStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            {emailStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {(emailStatus === 'invalid' || emailStatus === 'error') && <XCircle className="w-4 h-4 text-red-500" />}
          </div>
        </div>
        {(emailMessage || errors.email) && (
          <p className={`text-xs mt-1 font-medium ${
            emailStatus === 'valid'
              ? 'text-emerald-700'
              : emailStatus === 'invalid' || emailStatus === 'error' || errors.email
                ? 'text-red-500'
                : 'text-slate-500'
          }`}>
            {firstFieldError(errors.email) || emailMessage}
          </p>
        )}
      </div>
    </FormSectionCard>
    </div>
  );
}
