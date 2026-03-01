import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Search, ChevronLeft, ChevronRight, Loader2, Repeat, ChevronDown, ChevronUp
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  useTrainingSessions, useDeleteTrainingSession,
  useTrainingSchedules, useDeleteTrainingSchedule
} from '../hooks/queries/useTraining';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import {
  TrainingSessionCard, CreateTrainingModal,
  ScheduleCard, CreateScheduleModal, GenerateSessionsModal
} from '../components/training';

export function TrainingSessionsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [cabors, setCabors] = useState([]);
  const [coaches, setCoaches] = useState([]);

  // Schedule state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editSchedule, setEditSchedule] = useState(null);
  const [generateSchedule, setGenerateSchedule] = useState(null);
  const [showSchedules, setShowSchedules] = useState(true);

  const isCoach = user?.role?.name === 'coach';

  // For coach: filter by their own coach_id
  const [myCoachId, setMyCoachId] = useState(null);
  useEffect(() => {
    if (isCoach && user?.id) {
      api.get('/api/portal/profile').then(res => {
        if (res.data?.coach?.id) setMyCoachId(res.data.coach.id);
      }).catch(() => {});
    }
  }, [isCoach, user?.id]);

  const { data, isLoading } = useTrainingSessions({
    page, limit: 10, search,
    status: statusFilter || undefined,
    coachId: isCoach ? myCoachId : undefined,
  });

  const { data: schedulesData, isLoading: schedulesLoading } = useTrainingSchedules({
    page: 1, limit: 50,
    coachId: isCoach ? myCoachId : undefined,
  });

  const deleteSession = useDeleteTrainingSession();
  const deleteSchedule = useDeleteTrainingSchedule();

  useEffect(() => {
    api.get('/api/cabors/all').then(r => setCabors(Array.isArray(r.data) ? r.data : r.data?.data || [])).catch(() => {});
    if (!isCoach) {
      api.get('/api/coaches', { params: { limit: 100 } }).then(r => setCoaches(r.data?.data || [])).catch(() => {});
    }
  }, []);

  const sessions = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10);
  const schedules = schedulesData?.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Absensi Latihan</h1>
            <p className="text-sm text-slate-500 mt-1">Kelola jadwal dan absensi latihan atlet</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setEditSchedule(null); setShowScheduleModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Repeat className="w-4 h-4" />
              Jadwal Berulang
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Latihan
            </button>
          </div>
        </div>

        {/* Schedules Section */}
        {schedules.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 overflow-hidden">
            <button
              onClick={() => setShowSchedules(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-indigo-800">Jadwal Berulang</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{schedules.length}</span>
              </div>
              {showSchedules ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-indigo-500" />}
            </button>
            {showSchedules && (
              <div className="px-4 pb-4 grid gap-2">
                {schedules.map(sc => (
                  <ScheduleCard
                    key={sc.id}
                    schedule={sc}
                    onGenerate={(s) => setGenerateSchedule(s)}
                    onEdit={(s) => { setEditSchedule(s); setShowScheduleModal(true); }}
                    onDelete={(id) => deleteSchedule.mutate(id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari judul latihan..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          >
            <option value="">Semua Status</option>
            <option value="scheduled">Terjadwal</option>
            <option value="ongoing">Berlangsung</option>
            <option value="completed">Selesai</option>
          </select>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Belum ada jadwal latihan</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map(session => (
              <TrainingSessionCard
                key={session.id}
                session={session}
                onDelete={(id) => deleteSession.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-600">Hal {page} dari {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showModal && (
          <CreateTrainingModal
            onClose={() => setShowModal(false)}
            cabors={cabors}
            coaches={coaches}
            isCoach={isCoach}
            myCoachId={myCoachId}
          />
        )}
      </AnimatePresence>

      {/* Create/Edit Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <CreateScheduleModal
            onClose={() => { setShowScheduleModal(false); setEditSchedule(null); }}
            cabors={cabors}
            coaches={coaches}
            isCoach={isCoach}
            myCoachId={myCoachId}
            editData={editSchedule}
          />
        )}
      </AnimatePresence>

      {/* Generate Sessions Modal */}
      <AnimatePresence>
        {generateSchedule && (
          <GenerateSessionsModal
            schedule={generateSchedule}
            onClose={() => setGenerateSchedule(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
