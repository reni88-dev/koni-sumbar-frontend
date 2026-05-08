import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Layers, Wallet } from 'lucide-react';
import { ProtectedImage } from './ProtectedImage';
import { CoachClusterHistoryTab, CoachDevelopmentFundsTab } from './coach-clusters';

const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };

export function CoachDetailModal({ isOpen, onClose, coach }) {
  const [activeTab, setActiveTab] = useState('profile');
  if (!isOpen || !coach) return null;

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const display = (value) => value || '-';
  const clusterText = [coach.current_cluster_label, coach.current_sub_cluster_label].filter(Boolean).join(' - ') || 'Pelatih Non Binaan';

  const TabButton = ({ id, icon: Icon, children }) => (
    <button type="button" onClick={() => setActiveTab(id)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all sm:flex-none ${activeTab === id ? 'bg-white text-red-700 shadow-sm ring-1 ring-red-100' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'}`}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }} className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 pt-8 sm:p-6 sm:pt-12">
        <div className="my-4 flex max-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl ring-1 ring-slate-900/10" onClick={(e) => e.stopPropagation()}>
          <div className="relative bg-gradient-to-br from-red-800 via-red-600 to-rose-500 px-5 pb-8 pt-5 text-white sm:px-7 sm:pb-9 sm:pt-6">
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="shrink-0">
                  {coach.photo ? <ProtectedImage src={`/api/coaches/${coach.id}/photo?t=${coach.updated_at}`} alt={coach.name} className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-xl ring-4 ring-white/25 sm:h-24 sm:w-24" /> : <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/95 shadow-xl ring-4 ring-white/25 sm:h-24 sm:w-24"><User className="h-9 w-9 text-slate-400 sm:h-10 sm:w-10" /></div>}
                </div>
                <div className="min-w-0 pr-1 sm:pr-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Profil Pelatih</p>
                  <h2 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-3xl">{coach.name}</h2>
                  <p className="mt-2 text-sm text-white/80">{coach.cabor?.display_name || coach.cabor?.name || '-'}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge>{coach.license_level || 'Lisensi -'}</Badge>
                    <Badge>{clusterText}</Badge>
                    <Badge>{coach.is_active ? 'Aktif' : 'Tidak Aktif'}</Badge>
                  </div>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 transition-colors hover:bg-white/25"><X className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-50/80 px-5 py-5 sm:px-7 sm:py-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1.5 shadow-inner">
                <TabButton id="profile" icon={User}>Profil</TabButton>
                <TabButton id="clusters" icon={Layers}>Riwayat Kluster</TabButton>
                <TabButton id="funds" icon={Wallet}>Dana Pembinaan</TabButton>
              </div>
              {activeTab === 'profile' && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="NIK" value={coach.nik} />
                <Field label="Jenis Kelamin" value={genderLabels[coach.gender] || coach.gender} />
                <Field label="Tempat Lahir" value={coach.birth_place} />
                <Field label="Tanggal Lahir" value={formatDate(coach.birth_date)} />
                <Field label="Agama" value={coach.religion} />
                <Field label="Telepon" value={coach.phone} />
                <Field label="Email" value={coach.email} />
                <Field label="Nomor Lisensi" value={coach.license_number} />
                <Field label="Level Lisensi" value={coach.license_level} />
                <Field label="Tahun Mulai Melatih" value={coach.coaching_start_year} />
                <Field label="Spesialisasi" value={coach.specialization} />
                <Field label="Kluster Aktif" value={clusterText} />
                <Field label="Alamat" value={coach.address} className="md:col-span-2" />
                {coach.achievements && <Field label="Prestasi" value={coach.achievements} className="md:col-span-2" />}
              </div>}
              {activeTab === 'clusters' && <CoachClusterHistoryTab coach={coach} />}
              {activeTab === 'funds' && <CoachDevelopmentFundsTab coach={coach} />}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Badge({ children }) {
  return <span className="inline-flex items-center rounded-full border border-white/30 bg-white/90 px-2.5 py-1 text-xs font-semibold leading-none text-slate-700 ring-1 ring-white/20">{children}</span>;
}

function Field({ label, value, className = '' }) {
  return <div className={`rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-sm ${className}`}><p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800 break-words">{display(value)}</p></div>;
}

function display(value) {
  if (value === null || value === undefined || value === '') return '-';
  return value;
}
