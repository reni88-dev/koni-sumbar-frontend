import { useState, useEffect, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Medal,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  CalendarDays,
  RefreshCw,
  FileQuestion,
  Code2
} from 'lucide-react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { CompetitionClassFormModal } from '../../components/CompetitionClassFormModal';
import { CompetitionClassAthletesModal } from '../../components/CompetitionClassAthletesModal';
import { PorprovClassAthletesModal } from '../../components/PorprovClassAthletesModal';
import { useCaborsAll } from '../../hooks/queries/useCabors';
import { usePermission } from '../../hooks/usePermission';
import { 
  useCompetitionClasses,
  useCompetitionClassAthletes,
  useDeleteCompetitionClass,
  usePorprovEvents,
  usePorprovEventAthletes
} from '../../hooks/queries/useMasterData';

const activePorprovStatuses = new Set([
  'ongoing',
  'registration_open',
  'registration',
  'open',
  'registration_closed',
]);

const porprovStatusLabels = {
  draft: 'Draf',
  published: 'Dipublikasikan',
  registration: 'Registrasi',
  open: 'Dibuka',
  registration_open: 'Registrasi Dibuka',
  registration_closed: 'Registrasi Ditutup',
  ongoing: 'Berlangsung',
  completed: 'Selesai',
  archived: 'Diarsipkan',
};

function normalizePorprovEvents(data) {
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

function porprovStatusLabel(status) {
  const key = String(status || '').toLowerCase();
  return porprovStatusLabels[key] || key.replaceAll('_', ' ') || 'Status tidak tersedia';
}

function queryErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}
export function CompetitionClassesPage() {
  const { can, canAll } = usePermission();
  const canCreate = can('competition_classes.create');
  const canEdit = can('competition_classes.edit');
  const canDelete = can('competition_classes.delete');
  const canViewMasterAthletes = can('athletes.view');
  const canViewPorprov = canAll(['porprov.events.read', 'porprov.athletes.read']);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCabor, setFilterCabor] = useState('');
  const [codeFilter, setCodeFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPorprovEventId, setSelectedPorprovEventId] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [masterAthletesModalClass, setMasterAthletesModalClass] = useState(null);
  const [porprovModalSelection, setPorprovModalSelection] = useState(null);

  // TanStack Query hooks
  const { data: cabors = [] } = useCaborsAll();
  const { 
    data: classesData, 
    isLoading: loading,
    refetch 
  } = useCompetitionClasses({ 
    page, 
    search: debouncedSearch, 
    caborId: filterCabor,
    codePresence: codeFilter,
    descriptionPresence: descriptionFilter
  });
  const {
    data: masterClassAthletes = [],
    isLoading: masterClassAthletesLoading,
    isError: masterClassAthletesError,
    error: masterClassAthletesLoadError,
    refetch: refetchMasterClassAthletes,
  } = useCompetitionClassAthletes(masterAthletesModalClass?.id, {
    enabled: canViewMasterAthletes && !!masterAthletesModalClass?.id,
  });
  const {
    data: porprovEventsData,
    isLoading: porprovEventsLoading,
    isError: porprovEventsError,
    error: porprovEventsLoadError,
    refetch: refetchPorprovEvents,
  } = usePorprovEvents({ enabled: canViewPorprov });
  const porprovEvents = useMemo(() => normalizePorprovEvents(porprovEventsData), [porprovEventsData]);
  const preferredPorprovEvent = useMemo(() => (
    porprovEvents.find((event) => activePorprovStatuses.has(String(event?.status || '').toLowerCase()))
      || porprovEvents[0]
      || null
  ), [porprovEvents]);
  const hasSelectedPorprovEvent = porprovEvents.some(
    (event) => String(event.id) === String(selectedPorprovEventId),
  );
  const resolvedPorprovEventId = hasSelectedPorprovEvent
    ? String(selectedPorprovEventId)
    : preferredPorprovEvent?.id
      ? String(preferredPorprovEvent.id)
      : '';
  const selectedPorprovEvent = porprovEvents.find(
    (event) => String(event.id) === resolvedPorprovEventId,
  ) || null;
  const {
    data: porprovEventAthletes = [],
    isLoading: porprovAthletesLoading,
    isError: porprovAthletesError,
    error: porprovAthletesLoadError,
    refetch: refetchPorprovAthletes,
  } = usePorprovEventAthletes(resolvedPorprovEventId, {
    enabled: canViewPorprov && !!resolvedPorprovEventId,
  });
  const deleteMutation = useDeleteCompetitionClass();

  const competitionClasses = classesData?.data || [];
  const pagination = {
    current_page: classesData?.current_page || 1,
    last_page: classesData?.last_page || 1,
    total: classesData?.total || 0
  };
  const porprovAthletesByClass = useMemo(() => {
    const grouped = new Map();
    porprovEventAthletes.forEach((athlete) => {
      if (athlete?.competition_class_id === null || athlete?.competition_class_id === undefined) return;
      const classId = String(athlete.competition_class_id);
      const current = grouped.get(classId) || [];
      current.push(athlete);
      grouped.set(classId, current);
    });
    return grouped;
  }, [porprovEventAthletes]);
  const tableColumnCount = canViewPorprov ? 7 : 6;
  const isPorprovModalOpen = Boolean(
    porprovModalSelection
      && String(porprovModalSelection.eventId) === resolvedPorprovEventId,
  );
  const porprovModalClass = isPorprovModalOpen ? porprovModalSelection.competitionClass : null;
  const porprovModalAthletes = porprovModalClass
    ? porprovAthletesByClass.get(String(porprovModalClass.id)) || []
    : [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openMasterAthletesModal = (competitionClass) => {
    if (!canViewMasterAthletes || Number(competitionClass.athletes_count) <= 0) return;
    setPorprovModalSelection(null);
    setMasterAthletesModalClass(competitionClass);
  };

  const closeMasterAthletesModal = () => {
    setMasterAthletesModalClass(null);
  };

  const handlePorprovEventChange = (eventId) => {
    setPorprovModalSelection(null);
    setSelectedPorprovEventId(eventId);
  };

  const openPorprovAthletesModal = (competitionClass) => {
    const classAthletes = porprovAthletesByClass.get(String(competitionClass.id)) || [];
    if (!selectedPorprovEvent || porprovAthletesLoading || porprovAthletesError || classAthletes.length === 0) return;
    setMasterAthletesModalClass(null);
    setPorprovModalSelection({
      eventId: resolvedPorprovEventId,
      competitionClass,
    });
  };

  const closePorprovAthletesModal = () => {
    setPorprovModalSelection(null);
  };
  const openCreateModal = () => {
    setSelectedClass(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedClass(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleSaveSuccess = () => {
    refetch();
  };

  const openDeleteModal = (item) => {
    setClassToDelete(item);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deleteMutation.isPending) return;
    setIsDeleteModalOpen(false);
    setClassToDelete(null);
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!classToDelete || deleteMutation.isPending) return;
    setDeleteError('');
    try {
      await deleteMutation.mutateAsync(classToDelete.id);
      setIsDeleteModalOpen(false);
      setClassToDelete(null);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || error?.response?.data?.error;
      setDeleteError(backendMessage || 'Kelas pertandingan belum dapat dihapus. Coba kembali.');
    }
  };

  return (
    <DashboardLayout title="Kelas Pertandingan" subtitle="Kelola data kelas pertandingan per cabang olahraga">
      {/* Action Bar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Filter className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <select
              value={filterCabor}
              onChange={(e) => { setFilterCabor(e.target.value); setPage(1); }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="">Semua Cabor</option>
              {cabors.map(c => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}
            </select>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Code2 className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <select
              value={codeFilter}
              onChange={(e) => { setCodeFilter(e.target.value); setPage(1); }}
              aria-label="Filter kode kelas pertandingan"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="">Semua Kode</option>
              <option value="missing">Tanpa Kode</option>
              <option value="present">Dengan Kode</option>
            </select>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <FileQuestion className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <select
              value={descriptionFilter}
              onChange={(e) => { setDescriptionFilter(e.target.value); setPage(1); }}
              aria-label="Filter deskripsi kelas pertandingan"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="">Semua Deskripsi</option>
              <option value="missing">Tanpa Deskripsi</option>
              <option value="present">Dengan Deskripsi</option>
            </select>
          </div>
          {canViewPorprov && (
            <div className="relative w-full sm:max-w-sm">
              <CalendarDays className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <select
                value={resolvedPorprovEventId}
                onChange={(e) => handlePorprovEventChange(e.target.value)}
                disabled={porprovEventsLoading || porprovEventsError || porprovEvents.length === 0}
                aria-label="Pilih event Porprov"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
              >
                {porprovEventsLoading && <option value="">Memuat event Porprov...</option>}
                {porprovEventsError && <option value="">Event Porprov gagal dimuat</option>}
                {!porprovEventsLoading && !porprovEventsError && porprovEvents.length === 0 && (
                  <option value="">Belum ada event Porprov</option>
                )}
                {porprovEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}{event.year ? ` (${event.year})` : ''} — {porprovStatusLabel(event.status)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-700 lg:self-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Tambah Kelas</span>
          </button>
        )}
      </div>

      {canViewPorprov && porprovEventsError && (
        <div role="alert" className="mb-4 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{queryErrorMessage(porprovEventsLoadError, 'Data event Porprov gagal dimuat. Tabel kelas master tetap dapat digunakan.')}</span>
          <button
            type="button"
            onClick={() => refetchPorprovEvents()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}

      {canViewPorprov && !porprovEventsLoading && !porprovEventsError && porprovEvents.length === 0 && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Belum ada event Porprov yang dapat dipilih. Data kelas master tetap ditampilkan.
        </div>
      )}

      {canViewPorprov && selectedPorprovEvent && porprovAthletesError && (
        <div role="alert" className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{queryErrorMessage(porprovAthletesLoadError, `Data atlet ${selectedPorprovEvent.name} gagal dimuat. Tabel kelas master tetap dapat digunakan.`)}</span>
          <button
            type="button"
            onClick={() => refetchPorprovAthletes()}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        </div>
      )}
      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Cabor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Kode</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nama Kelas</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Atlet Master</th>
                {canViewPorprov && (
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Atlet Porprov</th>
                )}
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={tableColumnCount} className="px-6 py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
                  </td>
                </tr>
              ) : competitionClasses.length === 0 ? (
                <tr>
                  <td colSpan={tableColumnCount} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada data kelas pertandingan
                  </td>
                </tr>
              ) : (
                competitionClasses.map((item) => {
                  const masterAthleteCount = Number(item.athletes_count) || 0;
                  const porprovClassAthletes = porprovAthletesByClass.get(String(item.id)) || [];
                  const porprovAthleteCount = porprovClassAthletes.length;

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                          {item.cabor?.display_name || item.cabor?.name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.code ? (
                          <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm font-medium text-slate-700">
                            {item.code}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                            <Medal className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-800">{item.name}</span>
                            {item.description && (
                              <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {masterAthleteCount > 0 && canViewMasterAthletes ? (
                          <button
                            type="button"
                            onClick={() => openMasterAthletesModal(item)}
                            aria-label={`Lihat ${masterAthleteCount} atlet master kelas ${item.name}`}
                            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl bg-blue-50 px-3 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          >
                            {masterAthleteCount}
                          </button>
                        ) : (
                          <span
                            className="font-medium text-slate-600"
                            title={masterAthleteCount > 0 && !canViewMasterAthletes ? 'Memerlukan izin melihat atlet' : undefined}
                          >
                            {masterAthleteCount}
                          </span>
                        )}
                      </td>
                      {canViewPorprov && (
                        <td className="px-6 py-4">
                          {porprovEventsLoading || (selectedPorprovEvent && porprovAthletesLoading) ? (
                            <span className="inline-flex items-center gap-2 text-sm text-slate-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="sr-only">Memuat atlet Porprov</span>
                            </span>
                          ) : !selectedPorprovEvent ? (
                            <span className="text-slate-400">-</span>
                          ) : porprovAthletesError ? (
                            <span className="text-xs font-semibold text-amber-700">Gagal dimuat</span>
                          ) : porprovAthleteCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => openPorprovAthletesModal(item)}
                              aria-label={`Lihat ${porprovAthleteCount} atlet Porprov kelas ${item.name}`}
                              className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-xl bg-red-50 px-3 text-sm font-bold text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
                            >
                              {porprovAthleteCount}
                            </button>
                          ) : (
                            <span className="font-medium text-slate-600">0</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button
                              onClick={() => openEditModal(item)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => openDeleteModal(item)}
                              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {!canEdit && !canDelete && <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {
          pagination.last_page > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-500">
                Menampilkan <span className="font-medium text-slate-900">{competitionClasses.length}</span> dari <span className="font-medium text-slate-900">{pagination.total}</span> data
              </p>
              
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  onClick={() => setPage(1)}
                  disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setPage(Math.max(1, pagination.current_page - 1))}
                  disabled={pagination.current_page === 1}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Sebelumnya"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {(() => {
                    const current = pagination.current_page;
                    const last = pagination.last_page;
                    const delta = 1;
                    const left = current - delta;
                    const right = current + delta + 1;
                    const range = [];
                    const rangeWithDots = [];
                    let l;

                    for (let i = 1; i <= last; i++) {
                      if (i === 1 || i === last || (i >= left && i < right)) {
                        range.push(i);
                      }
                    }

                    for (const i of range) {
                      if (l) {
                        if (i - l === 2) {
                          rangeWithDots.push(l + 1);
                        } else if (i - l !== 1) {
                          rangeWithDots.push('...');
                        }
                      }
                      rangeWithDots.push(i);
                      l = i;
                    }

                    return rangeWithDots.map((pageNum, idx) => (
                      pageNum === '...' ? (
                        <span key={`dots-${idx}`} className="px-2 text-slate-400">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                            pageNum === pagination.current_page
                              ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    ));
                  })()}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setPage(Math.min(pagination.last_page, pagination.current_page + 1))}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Selanjutnya"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setPage(pagination.last_page)}
                  disabled={pagination.current_page === pagination.last_page}
                  className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        }
      </div>

      {/* Create/Edit Modal */}
      <CompetitionClassFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        competitionClass={selectedClass}
        cabors={cabors}
        onSuccess={handleSaveSuccess}
      />

      <CompetitionClassAthletesModal
        isOpen={canViewMasterAthletes && !!masterAthletesModalClass}
        onClose={closeMasterAthletesModal}
        competitionClass={masterAthletesModalClass}
        athletes={masterClassAthletes}
        isLoading={masterClassAthletesLoading}
        isError={masterClassAthletesError}
        error={masterClassAthletesLoadError}
        onRetry={() => refetchMasterClassAthletes()}
      />
      <PorprovClassAthletesModal
        isOpen={canViewPorprov && isPorprovModalOpen}
        onClose={closePorprovAthletesModal}
        event={selectedPorprovEvent}
        competitionClass={porprovModalClass}
        athletes={porprovModalAthletes}
      />
      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && canDelete && (
          <>
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={closeDeleteModal}
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Kelas?</h3>
                <p className="text-slate-500 text-sm leading-6">
                  Anda yakin ingin menghapus kelas <strong>{classToDelete?.name}</strong> secara permanen?
                </p>
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs leading-5 text-amber-800">
                  Kelas yang pernah digunakan PORPROV tidak dapat dihapus. Edit atau nonaktifkan kelas sebagai gantinya agar riwayat tetap aman.
                </p>
                {deleteError && (
                  <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
                    {deleteError}
                  </div>
                )}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
