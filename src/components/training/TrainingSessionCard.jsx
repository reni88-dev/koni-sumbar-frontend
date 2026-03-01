import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Trash2 } from 'lucide-react';
import { STATUS_LABELS } from './trainingConstants';
import { ConfirmDialog } from '../ConfirmDialog';

// Parse Go time.Time serialized TIME field (e.g. "0000-01-01T07:30:00Z" or "07:30" or "07:30:00")
function formatTime(t) {
  if (!t) return '';
  // If it's an ISO datetime string, extract HH:mm
  if (t.includes('T')) {
    const match = t.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : t;
  }
  // Already "HH:mm" or "HH:mm:ss"
  return t.substring(0, 5);
}

export function TrainingSessionCard({ session, onDelete, isDeleting }) {
  const navigate = useNavigate();
  const statusInfo = STATUS_LABELS[session.status] || STATUS_LABELS.scheduled;
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/training/${session.id}`)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-slate-800 text-lg">{session.title}</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(session.training_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {session.start_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatTime(session.start_time)}{session.end_time ? ` - ${formatTime(session.end_time)}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {session.location_name}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-slate-500">
              {session.coach && <span>Pelatih: <strong>{session.coach.name}</strong></span>}
              {session.cabor && <span>Cabor: <strong>{session.cabor.name}</strong></span>}
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            {session.stats && (
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{session.stats.present}</div>
                <div className="text-xs text-slate-400">/ {session.stats.total} hadir</div>
              </div>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                setShowConfirm(true);
              }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete(session.id);
          setShowConfirm(false);
        }}
        title="Hapus Sesi Latihan"
        message={<>Apakah Anda yakin ingin menghapus sesi latihan <strong>{session.title}</strong>?</>}
        confirmText="Hapus"
        isPending={isDeleting}
      />
    </>
  );
}
