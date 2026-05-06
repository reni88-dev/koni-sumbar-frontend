import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Info,
  KeyRound,
  Loader2,
  Monitor,
  Settings as SettingsIcon,
  Shield,
  User,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';

const tabs = [
  { id: 'account', label: 'Akun', icon: User },
  { id: 'security', label: 'Keamanan', icon: Shield },
  { id: 'preferences', label: 'Preferensi', icon: Monitor },
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
  { id: 'app', label: 'Aplikasi', icon: Info },
];

const landingOptions = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/monev', label: 'Monitoring' },
  { value: '/event', label: 'Event' },
  { value: '/portal/atlet', label: 'Portal Atlet' },
  { value: '/portal/pelatih', label: 'Portal Pelatih' },
];

const defaultNotificationPrefs = {
  events: true,
  monitoring: true,
  training: true,
  approvals: true,
};

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return <input {...props} className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none ${props.className || ''}`} />;
}

function SelectInput(props) {
  return <select {...props} className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none bg-white ${props.className || ''}`} />;
}

function Toggle({ checked, onChange, title, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 text-left transition-colors"
    >
      <span>
        <span className="block font-semibold text-slate-700 text-sm">{title}</span>
        {description && <span className="block text-xs text-slate-500 mt-0.5">{description}</span>}
      </span>
      <span className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-red-600' : 'bg-slate-200'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </span>
    </button>
  );
}

export function SettingsPage() {
  const { fetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/settings/me');
        if (!mounted) return;
        setSettings(res.data);
        setPreferences(normalizePreferences(res.data.preferences));
      } catch (err) {
        if (mounted) setError(err.response?.data?.error || 'Gagal memuat pengaturan');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadSettings();
    return () => { mounted = false; };
  }, []);

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const updateNotificationPreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value,
      },
    }));
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/api/settings/me', preferences);
      const saved = normalizePreferences(res.data.preferences);
      setPreferences(saved);
      setSettings(prev => ({ ...prev, preferences: saved }));
      setSuccess('Pengaturan berhasil disimpan');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan pengaturan');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/api/settings/me/password', passwordForm);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      await fetchUser();
      setSuccess('Password berhasil diubah');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengubah password');
    } finally {
      setSavingPassword(false);
    }
  };

  const user = settings?.user;

  return (
    <DashboardLayout title="Pengaturan" subtitle="Kelola akun, keamanan, preferensi, dan notifikasi pribadi Anda.">
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div>
      ) : error && !settings ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 h-fit">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </aside>

          <motion.section
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {activeTab === 'account' && <AccountTab user={user} preferences={preferences} />}
            {activeTab === 'security' && (
              <SecurityTab
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                saving={savingPassword}
                onSubmit={handleChangePassword}
              />
            )}
            {activeTab === 'preferences' && (
              <PreferencesTab
                preferences={preferences}
                updatePreference={updatePreference}
                saving={savingPreferences}
                onSave={handleSavePreferences}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab
                preferences={preferences}
                updatePreference={updatePreference}
                updateNotificationPreference={updateNotificationPreference}
                saving={savingPreferences}
                onSave={handleSavePreferences}
              />
            )}
            {activeTab === 'app' && <AppTab />}
          </motion.section>
        </div>
      )}
    </DashboardLayout>
  );
}

function AccountTab({ user, preferences }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-bold">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{user?.name || '-'}</h2>
          <p className="text-sm text-slate-500">{user?.email || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard label="Role" value={user?.role?.display_name || user?.role?.name || '-'} />
        <InfoCard label="Organisasi" value={user?.organization?.name || user?.organization_id || '-'} />
        <InfoCard label="Status Password" value={user?.must_reset_password ? 'Wajib reset password' : 'Aktif'} />
        <InfoCard label="Login Terakhir" value={user?.last_login_at ? new Date(user.last_login_at).toLocaleString('id-ID') : '-'} />
        <InfoCard label="Landing Page" value={preferences?.landing_page || '/dashboard'} />
        <InfoCard label="Tema" value={preferences?.theme || 'system'} />
      </div>
    </div>
  );
}

function SecurityTab({ passwordForm, setPasswordForm, saving, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 max-w-2xl">
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><KeyRound className="w-5 h-5" /></div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Ubah Password</h2>
          <p className="text-sm text-slate-500">Gunakan password minimal 8 karakter dan berbeda dari password saat ini.</p>
        </div>
      </div>

      <Field label="Password Saat Ini">
        <TextInput type="password" value={passwordForm.current_password} onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))} required />
      </Field>
      <Field label="Password Baru">
        <TextInput type="password" value={passwordForm.new_password} onChange={e => setPasswordForm(f => ({ ...f, new_password: e.target.value }))} minLength={8} required />
      </Field>
      <Field label="Konfirmasi Password Baru">
        <TextInput type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm(f => ({ ...f, confirm_password: e.target.value }))} minLength={8} required />
      </Field>

      <button disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Simpan Password
      </button>
    </form>
  );
}

function PreferencesTab({ preferences, updatePreference, saving, onSave }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Preferensi Tampilan</h2>
        <p className="text-sm text-slate-500">Atur pengalaman aplikasi sesuai cara kerja Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tema">
          <SelectInput value={preferences.theme} onChange={e => updatePreference('theme', e.target.value)}>
            <option value="system">Ikuti Sistem</option>
            <option value="light">Terang</option>
            <option value="dark">Gelap</option>
          </SelectInput>
        </Field>
        <Field label="Bahasa">
          <SelectInput value={preferences.language} onChange={e => updatePreference('language', e.target.value)}>
            <option value="id">Indonesia</option>
            <option value="en">English</option>
          </SelectInput>
        </Field>
        <Field label="Halaman Awal Setelah Login">
          <SelectInput value={preferences.landing_page} onChange={e => updatePreference('landing_page', e.target.value)}>
            {landingOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </SelectInput>
        </Field>
        <Field label="Jumlah Data per Halaman">
          <SelectInput value={preferences.table_page_size} onChange={e => updatePreference('table_page_size', Number(e.target.value))}>
            {[10, 15, 25, 50, 100].map(size => <option key={size} value={size}>{size} data</option>)}
          </SelectInput>
        </Field>
        <Field label="Kepadatan Tampilan">
          <SelectInput value={preferences.density} onChange={e => updatePreference('density', e.target.value)}>
            <option value="comfortable">Nyaman</option>
            <option value="compact">Ringkas</option>
          </SelectInput>
        </Field>
      </div>

      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function NotificationsTab({ preferences, updatePreference, updateNotificationPreference, saving, onSave }) {
  const notificationPrefs = preferences.notification_preferences || defaultNotificationPrefs;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Preferensi Notifikasi</h2>
        <p className="text-sm text-slate-500">Pilih kanal dan jenis notifikasi yang ingin Anda terima.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Toggle checked={preferences.in_app_notifications} onChange={value => updatePreference('in_app_notifications', value)} title="Notifikasi dalam aplikasi" description="Tampilkan pemberitahuan di aplikasi." />
        <Toggle checked={preferences.email_notifications} onChange={value => updatePreference('email_notifications', value)} title="Notifikasi email" description="Kirim pemberitahuan penting via email." />
        <Toggle checked={!!notificationPrefs.events} onChange={value => updateNotificationPreference('events', value)} title="Event" description="Event baru dan perubahan jadwal event." />
        <Toggle checked={!!notificationPrefs.monitoring} onChange={value => updateNotificationPreference('monitoring', value)} title="Monitoring" description="Tugas dan pembaruan monev." />
        <Toggle checked={!!notificationPrefs.training} onChange={value => updateNotificationPreference('training', value)} title="Latihan" description="Agenda dan absensi latihan." />
        <Toggle checked={!!notificationPrefs.approvals} onChange={value => updateNotificationPreference('approvals', value)} title="Persetujuan" description="Approval, penolakan, dan tindak lanjut." />
      </div>

      <SaveButton saving={saving} onClick={onSave} />
    </div>
  );
}

function AppTab() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl"><SettingsIcon className="w-5 h-5" /></div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Informasi Aplikasi</h2>
          <p className="text-sm text-slate-500">Informasi dasar untuk bantuan dan support.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard label="Nama Aplikasi" value="KONI Sumbar" />
        <InfoCard label="Frontend" value="Vite React" />
        <InfoCard label="Backend" value="KONI API 2.0.0" />
        <InfoCard label="Bantuan" value="Hubungi administrator sistem" />
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="mt-1 font-semibold text-slate-700 break-words">{value}</div>
    </div>
  );
}

function SaveButton({ saving, onClick }) {
  return (
    <button type="button" onClick={onClick} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-60">
      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
      Simpan Pengaturan
    </button>
  );
}

function normalizePreferences(preferences = {}) {
  return {
    theme: preferences.theme || 'system',
    language: preferences.language || 'id',
    landing_page: preferences.landing_page || '/dashboard',
    table_page_size: preferences.table_page_size || 15,
    density: preferences.density || 'comfortable',
    email_notifications: preferences.email_notifications ?? true,
    in_app_notifications: preferences.in_app_notifications ?? true,
    notification_preferences: {
      ...defaultNotificationPrefs,
      ...(preferences.notification_preferences || {}),
    },
  };
}
