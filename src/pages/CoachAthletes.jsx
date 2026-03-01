import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Search, UserCheck } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  useCoachAthletes, useAssignCoachAthlete, useUpdateCoachAthlete, useRemoveCoachAthlete
} from '../hooks/queries/useCoachAthletes';
import { useCaborsAll } from '../hooks/queries/useCabors';
import { AssignmentTable, AssignmentFormModal, DeleteAssignmentModal } from '../components/coach-athletes';

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
