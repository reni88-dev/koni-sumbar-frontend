import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Repeat, Edit2, Trash2, Zap } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatTime(t) {
  if (!t) return '';
  if (t.includes('T')) {
    const match = t.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : t;
  }
  return t.substring(0, 5);
}

export function ScheduleCard({ schedule, onGenerate, onEdit, onDelete, isDeleting }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <h3 className="font-semibold text-slate-800 truncate">{schedule.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                schedule.is_active
                  ? 'bg-green-50 text-green-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {schedule.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            
            {schedule.description && (
              <p className="text-sm text-slate-500 mb-2 line-clamp-1">{schedule.description}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {schedule.day_of_week?.map(d => DAY_NAMES[d]).join(', ')}
              </span>
              {schedule.start_time && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatTime(schedule.start_time)}{schedule.end_time ? ` - ${formatTime(schedule.end_time)}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {schedule.location_name}
              </span>
            </div>

            <div className="flex gap-2 mt-2 text-xs text-slate-500">
              {schedule.coach?.name && <span className="bg-slate-50 px-2 py-0.5 rounded">{schedule.coach.name}</span>}
              {schedule.cabor?.name && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">{schedule.cabor.name}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onGenerate(schedule)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              title="Generate sesi"
            >
              <Zap className="w-3.5 h-3.5" />
              Generate
            </button>
            <div className="flex gap-1">
              <button
                onClick={() => onEdit(schedule)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          onDelete(schedule.id);
          setShowConfirm(false);
        }}
        title="Hapus Jadwal Berulang"
        message={<>Apakah Anda yakin ingin menghapus jadwal <strong>{schedule.title}</strong>? Sesi latihan yang sudah di-generate tidak akan terpengaruh.</>}
        confirmText="Hapus"
        isPending={isDeleting}
      />
    </>
  );
}
