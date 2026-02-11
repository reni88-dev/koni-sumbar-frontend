import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, UserCheck, X, Loader2, AlertCircle, Users, ChevronDown, Check
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { 
  useCoachAthletes, useAssignCoachAthlete, useUpdateCoachAthlete, useRemoveCoachAthlete 
} from '../hooks/queries/useCoachAthletes';
import { useCoaches } from '../hooks/queries/useCoaches';
import { useAthletes } from '../hooks/queries/useAthletes';
import { useCaborsAll } from '../hooks/queries/useCabors';

const ROLE_LABELS = {
  head_coach: 'Pelatih Utama',
  assistant_coach: 'Asisten Pelatih',
  specialist_coach: 'Pelatih Spesialis',
};

// ───── Searchable Coach Dropdown ─────
function CoachSearchDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const ref = useRef(null);

  const { data: coachesData, isLoading } = useCoaches({ search: debouncedSearch, perPage: 20 });
  const coaches = coachesData?.data || [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedCoach = value ? coaches.find(c => c.id === value) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-left focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
      >
        {value ? (
          <span className="truncate">
            <span className="font-medium">{selectedCoach?.name || `Coach #${value}`}</span>
            {selectedCoach?.cabor?.name && <span className="text-slate-400 ml-1">• {selectedCoach.cabor.name}</span>}
          </span>
        ) : (
          <span className="text-slate-400">Pilih Pelatih...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama / NIK pelatih..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : coaches.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Tidak ditemukan</p>
              ) : (
                coaches.map(coach => (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => { onChange(coach.id); setOpen(false); setSearch(''); }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                      value === coach.id ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{coach.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {coach.cabor?.name || 'Tanpa Cabor'}
                        {coach.nik && ` • NIK: ${coach.nik}`}
                      </p>
                    </div>
                    {value === coach.id && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───── Multi-Select Athlete Dropdown ─────
function AthleteMultiSelect({ value = [], onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const ref = useRef(null);

  const { data: athletesData, isLoading } = useAthletes({ search: debouncedSearch, perPage: 20 });
  const athletes = athletesData?.data || [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleAthlete = (athleteId) => {
    if (value.includes(athleteId)) {
      onChange(value.filter(id => id !== athleteId));
    } else {
      onChange([...value, athleteId]);
    }
  };

  const removeAthlete = (athleteId) => {
    onChange(value.filter(id => id !== athleteId));
  };

  // Resolve names for selected athletes from current data
  const selectedNames = value.map(id => {
    const ath = athletes.find(a => a.id === id);
    return ath ? ath.name : `Atlet #${id}`;
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-left focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none bg-white disabled:bg-slate-50 min-h-[42px]"
      >
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedNames.map((name, i) => (
              <span key={value[i]} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                {name}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeAthlete(value[i]); }} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400">Pilih Atlet...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama atlet..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : athletes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Tidak ditemukan</p>
              ) : (
                athletes.map(athlete => {
                  const selected = value.includes(athlete.id);
                  return (
                    <button
                      key={athlete.id}
                      type="button"
                      onClick={() => toggleAthlete(athlete.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                        selected ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">{athlete.name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {athlete.cabor?.name || 'Tanpa Cabor'}
                          {athlete.nik && ` • NIK: ${athlete.nik}`}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {value.length > 0 && (
              <div className="p-2 border-t border-slate-100 text-xs text-slate-500 text-center">
                {value.length} atlet dipilih
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ───── Main Page ─────
export function CoachAthletesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    coach_id: '', athlete_ids: [], cabor_id: '', role: 'head_coach',
    start_date: new Date().toISOString().split('T')[0], notes: '', is_active: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteError, setDeleteError] = useState(null);

  // TanStack Query hooks
  const { data: assignmentsData, isLoading: loading } = useCoachAthletes({ page, search: debouncedSearch, perPage: 15 });
  const assignMutation = useAssignCoachAthlete();
  const updateMutation = useUpdateCoachAthlete();
  const removeMutation = useRemoveCoachAthlete();

  // Dropdown data
  const { data: allCabors = [] } = useCaborsAll();

  const assignments = assignmentsData?.data || [];
  const pagination = {
    current_page: assignmentsData?.page || 1,
    last_page: Math.ceil((assignmentsData?.total || 0) / 15) || 1,
    total: assignmentsData?.total || 0
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      coach_id: '', athlete_ids: [], cabor_id: '', role: 'head_coach',
      start_date: new Date().toISOString().split('T')[0], notes: '', is_active: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (assignment) => {
    setModalMode('edit');
    setSelectedAssignment(assignment);
    setFormData({
      coach_id: assignment.coach_id,
      athlete_ids: [assignment.athlete_id],
      cabor_id: assignment.cabor_id || '',
      role: assignment.role || 'head_coach',
      start_date: assignment.start_date || '',
      notes: assignment.notes || '',
      is_active: assignment.is_active
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      if (modalMode === 'create') {
        // Create one assignment per selected athlete
        for (const athleteId of formData.athlete_ids) {
          await assignMutation.mutateAsync({
            coach_id: parseInt(formData.coach_id),
            athlete_id: parseInt(athleteId),
            cabor_id: formData.cabor_id ? parseInt(formData.cabor_id) : null,
            role: formData.role,
            start_date: formData.start_date,
            notes: formData.notes,
            is_active: formData.is_active,
          });
        }
      } else {
        await updateMutation.mutateAsync({
          id: selectedAssignment.id,
          data: {
            coach_id: parseInt(formData.coach_id),
            athlete_id: parseInt(formData.athlete_ids[0]),
            cabor_id: formData.cabor_id ? parseInt(formData.cabor_id) : null,
            role: formData.role,
            start_date: formData.start_date,
            notes: formData.notes,
            is_active: formData.is_active,
          }
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
      }
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await removeMutation.mutateAsync(assignmentToDelete.id);
      setIsDeleteModalOpen(false);
      setAssignmentToDelete(null);
    } catch (error) {
      setDeleteError(error.response?.data?.error || 'Gagal menghapus assignment');
    }
  };

  const formLoading = assignMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout title="Pelatih & Atlet" subtitle="Kelola assignment pelatih ke atlet">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari pelatih atau atlet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Assignment</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{pagination.total}</p>
            <p className="text-sm text-slate-500">Total Assignment</p>
          </div>
        </div>
      </div>

      {/* Table */}
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
                          onClick={() => openEditModal(item)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setAssignmentToDelete(item); setIsDeleteModalOpen(true); }}
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

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: pagination.last_page }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-xl font-medium transition-colors ${
                pagination.current_page === i + 1
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                  <h2 className="text-lg font-bold text-slate-800">
                    {modalMode === 'create' ? 'Tambah Assignment Baru' : 'Edit Assignment'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {/* Coach Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pelatih</label>
                    <CoachSearchDropdown
                      value={formData.coach_id}
                      onChange={(id) => setFormData({...formData, coach_id: id})}
                      disabled={modalMode === 'edit'}
                    />
                    {formErrors.coach_id && <p className="text-red-500 text-xs mt-1">{formErrors.coach_id}</p>}
                  </div>

                  {/* Athletes Multi-Select */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Atlet {modalMode === 'create' && <span className="text-slate-400 font-normal">(multi-pilih)</span>}
                    </label>
                    {modalMode === 'create' ? (
                      <AthleteMultiSelect
                        value={formData.athlete_ids}
                        onChange={(ids) => setFormData({...formData, athlete_ids: ids})}
                      />
                    ) : (
                      <AthleteMultiSelect
                        value={formData.athlete_ids}
                        onChange={(ids) => setFormData({...formData, athlete_ids: ids.slice(-1)})}
                        disabled
                      />
                    )}
                    {formErrors.athlete_id && <p className="text-red-500 text-xs mt-1">{formErrors.athlete_id}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cabor</label>
                    <select
                      value={formData.cabor_id}
                      onChange={e => setFormData({...formData, cabor_id: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    >
                      <option value="">-- Pilih Cabor --</option>
                      {allCabors.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Peran</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    >
                      <option value="head_coach">Pelatih Utama</option>
                      <option value="assistant_coach">Asisten Pelatih</option>
                      <option value="specialist_coach">Pelatih Spesialis</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                    <textarea
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                      rows={2}
                      placeholder="Catatan opsional..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="ca_is_active"
                      checked={formData.is_active}
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="w-4 h-4 accent-red-600"
                    />
                    <label htmlFor="ca_is_active" className="text-sm text-slate-700">Aktif</label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading || !formData.coach_id || formData.athlete_ids.length === 0}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {modalMode === 'create' ? 'Simpan' : 'Update'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Assignment?</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Hapus assignment <strong>{assignmentToDelete?.coach?.name}</strong> → <strong>{assignmentToDelete?.athlete?.name}</strong>?
                </p>
                {deleteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{deleteError}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={removeMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {removeMutation.isPending ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
