import { motion } from 'framer-motion';
import { UserCheck, Users, Edit2, Trash2, Loader2 } from 'lucide-react';
import { ROLE_LABELS } from './coachAthleteConstants';

export function AssignmentTable({ assignments, loading, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pelatih</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Atlet</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cabor</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Peran</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Mulai</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                </td>
              </tr>
            ) : assignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Belum ada assignment pelatih-atlet
                </td>
              </tr>
            ) : (
              assignments.map((item) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-slate-800">{item.coach?.name || `Coach #${item.coach_id}`}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-medium text-slate-700">{item.athlete?.name || `Athlete #${item.athlete_id}`}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.cabor ? (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{item.cabor.name}</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{ROLE_LABELS[item.role] || item.role}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.start_date || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
