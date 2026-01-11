import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Trophy,
  Activity,
  Briefcase,
  Heart,
  Droplet
} from 'lucide-react';

export function AthleteDetailModal({ isOpen, onClose, athlete }) {
  if (!isOpen || !athlete) return null;

  const genderLabels = { male: 'Laki-laki', female: 'Perempuan' };
  const maritalLabels = { single: 'Belum Menikah', married: 'Menikah', divorced: 'Cerai', widowed: 'Duda/Janda' };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-100 rounded-lg">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || '-'}</p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
          {/* Header with Photo */}
          <div className="relative h-32 bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl">
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="absolute -bottom-12 left-6">
              {athlete.photo ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL}/storage/${athlete.photo}`}
                  alt={athlete.name}
                  className="w-24 h-24 rounded-2xl border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl border-4 border-white bg-slate-100 flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="pt-16 pb-6 px-6">
            {/* Name & Cabor */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">{athlete.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {athlete.cabor && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                    {athlete.cabor.name}
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  athlete.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {athlete.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <InfoItem icon={Calendar} label="TTL" value={`${athlete.birth_place || '-'}, ${formatDate(athlete.birth_date)}`} />
              <InfoItem icon={User} label="Gender" value={genderLabels[athlete.gender]} />
              <InfoItem icon={Heart} label="Status" value={maritalLabels[athlete.marital_status]} />
              <InfoItem icon={Droplet} label="Gol. Darah" value={athlete.blood_type} />
              <InfoItem icon={Activity} label="Tinggi/Berat" value={`${athlete.height || '-'} cm / ${athlete.weight || '-'} kg`} />
              <InfoItem icon={Briefcase} label="Pekerjaan" value={athlete.occupation} />
              <InfoItem icon={Phone} label="Telepon" value={athlete.phone} />
              <InfoItem icon={Mail} label="Email" value={athlete.email} />
              <InfoItem icon={MapPin} label="Alamat" value={athlete.address} />
            </div>

            {/* Additional Info */}
            <div className="space-y-4">
              {/* NIK & No KK */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">NIK</p>
                    <p className="font-mono text-sm font-medium text-slate-800">{athlete.nik || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">No. Kartu Keluarga</p>
                    <p className="font-mono text-sm font-medium text-slate-800">{athlete.no_kk || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Career Info */}
              <div className="p-4 bg-slate-50 rounded-xl">
                <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  Info Karir
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Tahun Mulai Karir</p>
                    <p className="font-medium text-slate-800">{athlete.career_start_year || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Kelas Pertandingan</p>
                    <p className="font-medium text-slate-800">{athlete.competition_class || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              {athlete.top_achievements?.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">🏆 Prestasi Tertinggi</h3>
                  <ul className="space-y-1">
                    {athlete.top_achievements.map((achievement, i) => (
                      <li key={`detail-achievement-${i}`} className="text-sm text-slate-700">• {achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Injury History */}
              {athlete.injury_illness_history && (
                <div className="p-4 bg-red-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">⚠️ Riwayat Cedera/Penyakit</h3>
                  <p className="text-sm text-slate-700">{athlete.injury_illness_history}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
