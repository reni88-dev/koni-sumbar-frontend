import { CheckCircle2, Heart, Loader2, Phone, XCircle } from 'lucide-react';
import { firstFieldError } from '../form-modal/formUtils';
import { getFieldControlProps, getFieldErrorId } from '../form-validation/profileValidation';
import { FormSectionCard } from '../form-modal/FormSectionCard';

export function AthleteParentsStep({ form, validation }) {
  const { data: formData, updateField } = form;
  const { errors, fatherPhone, motherPhone } = validation;
  const fatherPhoneStatus = fatherPhone.status;
  const fatherPhoneMessage = fatherPhone.message;
  const motherPhoneStatus = motherPhone.status;
  const motherPhoneMessage = motherPhone.message;
  return (
    <div className="space-y-4">
    <FormSectionCard
      icon={Heart}
      iconColor="text-rose-600"
      iconBg="bg-rose-50"
      title="Identitas Orang Tua / Wali"
      subtitle="Nama lengkap orang tua kandung atau wali sah atlet"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nama Lengkap Ayah <span className="text-red-500">*</span>
        </label>
        <input
          {...getFieldControlProps('father_name', errors)}
          type="text"
          value={formData.father_name}
          onChange={e => updateField('father_name', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Nama lengkap ayah/wali"
        />
        {errors.father_name && <p id={getFieldErrorId('father_name')} className="text-red-500 text-xs mt-1">{firstFieldError(errors.father_name)}</p>}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nama Lengkap Ibu <span className="text-red-500">*</span>
        </label>
        <input
          {...getFieldControlProps('mother_name', errors)}
          type="text"
          value={formData.mother_name}
          onChange={e => updateField('mother_name', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
          placeholder="Nama lengkap ibu/wali"
        />
        {errors.mother_name && <p id={getFieldErrorId('mother_name')} className="text-red-500 text-xs mt-1">{firstFieldError(errors.mother_name)}</p>}
      </div>

      <div className="sm:col-span-2">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Alamat Orang Tua / Wali <span className="text-red-500">*</span>
        </label>
        <textarea
          {...getFieldControlProps('parent_address', errors)}
          value={formData.parent_address}
          onChange={e => updateField('parent_address', e.target.value)}
          className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm resize-none"
          rows={2}
          placeholder="Alamat lengkap tempat tinggal orang tua/wali"
        />
        {errors.parent_address && <p id={getFieldErrorId('parent_address')} className="text-red-500 text-xs mt-1">{firstFieldError(errors.parent_address)}</p>}
      </div>
    </FormSectionCard>

    {/* 2. Kontak Darurat WhatsApp Orang Tua */}
    <FormSectionCard
      icon={Phone}
      iconColor="text-emerald-600"
      iconBg="bg-emerald-50"
      title="Kontak Darurat Orang Tua / Wali"
      subtitle="Nomor WhatsApp ayah dan ibu bersifat opsional; nomor yang diisi akan diverifikasi"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          WhatsApp Ayah / Wali (Opsional)
        </label>
        <div className="relative">
          <input
            {...getFieldControlProps('father_phone', errors)}
            type="text"
            value={formData.father_phone}
            onChange={e => updateField('father_phone', e.target.value)}
            className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
              fatherPhoneStatus === 'valid' ? 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-100 focus:border-emerald-500' :
              fatherPhoneStatus === 'invalid' ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' :
              'border-slate-200 focus:ring-red-100 focus:border-red-500'
            }`}
            placeholder="Contoh: 081234567890"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {fatherPhoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            {fatherPhoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {fatherPhoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
          </div>
        </div>
        {(fatherPhoneMessage || errors.father_phone) && (
          <p className={`text-xs mt-1 font-medium ${
            fatherPhoneStatus === 'valid' ? 'text-emerald-700' :
            fatherPhoneStatus === 'invalid' ? 'text-red-500' :
            'text-slate-400'
          }`}>
            {firstFieldError(errors.father_phone) || fatherPhoneMessage}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          WhatsApp Ibu / Wali (Opsional)
        </label>
        <div className="relative">
          <input
            {...getFieldControlProps('mother_phone', errors)}
            type="text"
            value={formData.mother_phone}
            onChange={e => updateField('mother_phone', e.target.value)}
            className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl focus:ring-2 outline-none font-mono text-sm transition-colors ${
              motherPhoneStatus === 'valid' ? 'border-emerald-400 bg-emerald-50/40 focus:ring-emerald-100 focus:border-emerald-500' :
              motherPhoneStatus === 'invalid' ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' :
              'border-slate-200 focus:ring-red-100 focus:border-red-500'
            }`}
            placeholder="Contoh: 081234567890"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {motherPhoneStatus === 'checking' && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            {motherPhoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            {motherPhoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
          </div>
        </div>
        {(motherPhoneMessage || errors.mother_phone) && (
          <p className={`text-xs mt-1 font-medium ${
            motherPhoneStatus === 'valid' ? 'text-emerald-700' :
            motherPhoneStatus === 'invalid' ? 'text-red-500' :
            'text-slate-400'
          }`}>
            {firstFieldError(errors.mother_phone) || motherPhoneMessage}
          </p>
        )}
      </div>
    </FormSectionCard>
    </div>
  );
}
