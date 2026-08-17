import { CheckCircle2, Loader2, Phone, XCircle } from 'lucide-react';
import { firstFieldError } from '../form-modal/formUtils';
import { FormSectionCard } from '../form-modal/FormSectionCard';

export function CoachContactStep({ form, validation }) {
  const { data: formData, updateField } = form;
  const { errors, phone } = validation;
  const phoneStatus = phone.status;
  const phoneMessage = phone.message;
  return (
    <div className="space-y-4">
    <FormSectionCard
      icon={Phone}
      iconColor="text-purple-600"
      iconBg="bg-purple-50"
      title="Kontak & Komunikasi"
      subtitle="Nomor WhatsApp aktif dan akun surel resmi pelatih"
    >
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Nomor WhatsApp
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
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
        {phoneMessage ? (
          <p className={`text-xs mt-1 font-medium ${
            phoneStatus === 'valid' ? 'text-emerald-700' :
            phoneStatus === 'invalid' ? 'text-red-500' :
            'text-slate-400'
          }`}>
            {phoneMessage}
          </p>
        ) : (
          <p className="text-slate-400 text-xs mt-1">Nomor WhatsApp aktif untuk koordinasi dan notifikasi.</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
          Alamat Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={`w-full px-3.5 py-2.5 border rounded-xl focus:ring-2 outline-none text-sm transition-colors ${
            errors.email ? 'border-red-400 bg-red-50 focus:ring-red-100 focus:border-red-500' : 'border-slate-200 focus:ring-red-100 focus:border-red-500'
          }`}
          placeholder="contoh@email.com"
        />
        {errors.email ? (
          <p className="text-red-500 text-xs mt-1">{firstFieldError(errors.email)}</p>
        ) : (
          <p className="text-slate-400 text-xs mt-1">Digunakan untuk akses akun portal dan laporan.</p>
        )}
      </div>
    </FormSectionCard>
    </div>
  );
}
