import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, UserCheck, Trophy, X, RotateCcw, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  useCoachAthletes, useAssignCoachAthlete, useUpdateCoachAthlete, useRemoveCoachAthlete
} from '../hooks/queries/useCoachAthletes';
import { useCaborsAll } from '../hooks/queries/useCabors';
import { AssignmentTable, AssignmentFormModal, DeleteAssignmentModal } from '../components/coach-athletes';
import { PrintCoachAthleteList } from '../components/PrintCoachAthleteList';

export function CoachAthletesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterCaborId, setFilterCaborId] = useState('');

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
  const { data: assignmentsData, isLoading: loading } = useCoachAthletes({ page, search: debouncedSearch, perPage: 15, cabor_id: filterCaborId });
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

  const handleResetAll = () => {
    setSearch('');
    setFilterCaborId('');
    setPage(1);
  };

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
  const hasActiveFilters = Boolean(debouncedSearch || filterCaborId);
  const selectedCabor = allCabors.find(c => String(c.id) === String(filterCaborId));

  return (
    <DashboardLayout title="Pelatih & Atlet" subtitle="Kelola assignment pelatih ke atlet">
      <div className="space-y-4 min-w-0 max-w-full">
        {/* Master Control Card (Header, Actions & Filter) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Row: Title Context & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Penugasan Pelatih & Atlet
                </h2>
                <p className="text-xs text-slate-500">
                  Total <span className="font-semibold text-slate-700">{pagination.total}</span> penugasan terdaftar
                </p>
              </div>
            </div>

            {/* Action Buttons Group */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <PrintCoachAthleteList
                filterParams={{ search: debouncedSearch, cabor_id: filterCaborId }}
                filters={{
                  cabor: selectedCabor?.name || '',
                  search: debouncedSearch,
                }}
              />

              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 shrink-0 cursor-pointer"
                title="Tambah penugasan pelatih ke atlet baru"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Assignment</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama pelatih atau atlet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none shadow-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                    title="Bersihkan pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Cabor */}
              <div className="relative sm:w-64">
                <Trophy className="w-3.5 h-3.5 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={filterCaborId}
                  onChange={(e) => {
                    setFilterCaborId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                >
                  <option value="">Semua Cabang Olahraga</option>
                  {allCabors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Reset */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors shrink-0"
                  title="Reset filter dan pencarian"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Reset</span>
                </button>
              )}
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 font-medium">Filter Aktif:</span>

                {search && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                    <span>Cari: &ldquo;{search}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="hover:text-red-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filterCaborId && selectedCabor && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium">
                    <span>Cabor: {selectedCabor.name}</span>
                    <button
                      type="button"
                      onClick={() => setFilterCaborId('')}
                      className="hover:text-amber-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="text-red-600 hover:text-red-700 font-semibold underline underline-offset-2 ml-1"
                >
                  Hapus Semua
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Table Counter Strip */}
        <div className="px-4 py-3 bg-white rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">
              Menampilkan <strong className="text-slate-900 font-bold">{assignments.length}</strong> dari{' '}
              <strong className="text-slate-900 font-bold">{pagination.total}</strong> assignment
            </span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md font-semibold text-[11px]">
                Hasil Filter
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Data terkini
            </span>
          </div>
        </div>

        {/* Table */}
        <AssignmentTable
          assignments={assignments}
          loading={loading}
          onEdit={openEditModal}
          onDelete={(item) => { setAssignmentToDelete(item); setIsDeleteModalOpen(true); }}
        />

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: pagination.last_page }, (_, i) => (
              <button
                key={i}
                type="button"
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
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        <AssignmentFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          modalMode={modalMode}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          onSubmit={handleSubmit}
          formLoading={formLoading}
          allCabors={allCabors}
        />
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        <DeleteAssignmentModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setDeleteError(null); }}
          assignment={assignmentToDelete}
          onDelete={handleDelete}
          isDeleting={removeMutation.isPending}
          deleteError={deleteError}
        />
      </AnimatePresence>
    </DashboardLayout>
  );
}
