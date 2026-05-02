import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, Loader2, AlertCircle,
  Calendar, CheckCircle2, Users, FileText, PenTool,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useMonevMyEvents } from '../hooks/useMonev';
import { useAuth } from '../hooks/useAuth';

function StatusBadge({ status }) {
  const colors = {
    draft: 'bg-slate-100 text-slate-600',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-600',
    archived: 'bg-violet-100 text-violet-600',
  };
  const labels = { draft: 'Draft', active: 'Aktif', closed: 'Ditutup', archived: 'Diarsipkan' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
}

export default function MonevList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useMonevMyEvents();
  const isSuperAdmin = user?.role?.name === 'super_admin' || user?.permissions?.includes('*');

  return (
    <DashboardLayout title="Monitoring & Evaluasi" subtitle={isSuperAdmin ? 'Semua event monev aktif' : 'Daftar event monev yang ditugaskan kepada Anda'}>
      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-red-600 animate-spin" /></div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-red-500"><AlertCircle className="w-8 h-8 mb-2" /><p>{error}</p></div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <ClipboardCheck className="w-12 h-12 mb-2" /><p>{isSuperAdmin ? 'Tidak ada event monev aktif' : 'Tidak ada event monev aktif untuk Anda'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(event => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{event.name}</h3>
                  <StatusBadge status={event.status} />
                </div>
                {event.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2">{event.description}</p>}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText className="w-4 h-4 text-red-400" /><span>{event.total_items} Butir Monev</span>
                  </div>
                  {event.start_date && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>{new Date(event.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {event.end_date && ` — ${new Date(event.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-violet-400" /><span>{event.total_assignees} Pemonev ditugaskan</span>
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                {event.has_submitted ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Sudah diisi
                  </div>
                ) : (
                  <button onClick={() => navigate(`/monev/submit/${event.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20">
                    <PenTool className="w-4 h-4" /> Isi Monev
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
