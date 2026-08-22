import { useState, useEffect, useRef } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  Loader2,
  AlertCircle,
  Eye,
  Layers,
  Download,
  Upload,
  CheckCircle2,
  X,
  SlidersHorizontal,
  RotateCcw,
  Trophy,
  Sparkles,
  GitBranch,
  ChevronDown,
  FileDown,
  CheckCircle
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { CoachFormModal } from '../components/CoachFormModal';
import { CoachDetailModal } from '../components/CoachDetailModal';
import { ProtectedImage } from '../components/ProtectedImage';
import { useInfiniteCoaches, useDeleteCoach, coachKeys } from '../hooks/queries/useCoaches';
import { useCaborsAll } from '../hooks/queries/useCabors';
import { useCoachClustersAll, useCoachSubClustersByCluster } from '../hooks/queries/useCoachClusterMaster';
import { getCoachPhotoUrl } from '../lib/coachPhoto';
import api from '../api/axios';

export function CoachesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCabor, setFilterCabor] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterCluster, setFilterCluster] = useState('');
  const [filterSubCluster, setFilterSubCluster] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [isDataMenuOpen, setIsDataMenuOpen] = useState(false);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [coachToDelete, setCoachToDelete] = useState(null);

  // Export / Import / UI state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Refs & Query Client
  const importFileInputRef = useRef(null);
  const dataMenuRef = useRef(null);
  const successTimerRef = useRef(null);
  const queryClient = useQueryClient();

  // TanStack Query hooks
  const { data: cabors = [] } = useCaborsAll();
  const { data: clusters = [] } = useCoachClustersAll();
  const { data: subClusters = [] } = useCoachSubClustersByCluster(filterCluster);
  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteCoaches({
    search: debouncedSearch,
    caborId: filterCabor,
    isActive: filterActive,
    clusterId: filterCluster,
    subClusterId: filterSubCluster
  });

  const deleteCoachMutation = useDeleteCoach();

  const coaches = data?.pages.flatMap((responsePage) => responsePage.data || []) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const fetchNextPageRef = useRef(fetchNextPage);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);

  useEffect(() => {
    fetchNextPageRef.current = fetchNextPage;
  }, [fetchNextPage]);

  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
  }, [hasNextPage]);

  useEffect(() => {
    isFetchingNextPageRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');

    const getScrollMetrics = () => {
      const documentElement = document.documentElement;
      const windowScrollTop = window.scrollY || documentElement.scrollTop;
      const windowClientHeight = window.innerHeight;
      const windowScrollHeight = documentElement.scrollHeight;

      if (container && container.scrollHeight > container.clientHeight) {
        const isContainerScrolling = container.scrollTop > 0;
        const isWindowScrolling = windowScrollTop > 0;

        if (isContainerScrolling || !isWindowScrolling) {
          return {
            scrollTop: container.scrollTop,
            clientHeight: container.clientHeight,
            scrollHeight: container.scrollHeight,
          };
        }
      }

      return {
        scrollTop: windowScrollTop,
        clientHeight: windowClientHeight,
        scrollHeight: windowScrollHeight,
      };
    };

    const handleScroll = () => {
      if (!hasNextPageRef.current || isFetchingNextPageRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = getScrollMetrics();
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        isFetchingNextPageRef.current = true;
        void fetchNextPageRef.current();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    container?.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      container?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
  }, []);

  // Close data menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dataMenuRef.current && !dataMenuRef.current.contains(event.target)) {
        setIsDataMenuOpen(false);
      }
    };
    if (isDataMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDataMenuOpen]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (filterSubCluster && !subClusters.some((item) => String(item.id) === String(filterSubCluster))) {
      setFilterSubCluster('');
    }
  }, [filterSubCluster, subClusters]);

  const handleResetAll = () => {
    setSearch('');
    setFilterCabor('');
    setFilterActive('');
    setFilterCluster('');
    setFilterSubCluster('');
  };

  const showSuccessToast = (message) => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    setSuccessMessage(message);
    successTimerRef.current = setTimeout(() => {
      setSuccessMessage('');
      successTimerRef.current = null;
    }, 3000);
  };

  const openCreateModal = () => {
    setSelectedCoach(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = async (coach) => {
    try {
      const response = await api.get(`/api/coaches/${coach.id}`);
      setSelectedCoach(response.data);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch coach details:', error);
      setSelectedCoach(coach);
      setIsFormModalOpen(true);
    }
  };

  const openDetailModal = async (coach) => {
    try {
      const response = await api.get(`/api/coaches/${coach.id}`);
      setSelectedCoach(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch coach details:', error);
      setSelectedCoach(coach);
      setIsDetailModalOpen(true);
    }
  };

  const handleFormSuccess = () => {
    const message = selectedCoach
      ? 'Data pelatih berhasil diperbarui!'
      : 'Pelatih baru berhasil ditambahkan!';

    setIsFormModalOpen(false);
    showSuccessToast(message);
    queryClient.invalidateQueries({ queryKey: coachKeys.lists() });
  };

  const handleDelete = async () => {
    try {
      await deleteCoachMutation.mutateAsync(coachToDelete.id);
      setIsDeleteModalOpen(false);
      setCoachToDelete(null);
    } catch (error) {
      console.error('Failed to delete coach:', error);
    }
  };

  const handleDownloadImportTemplate = async () => {
    setIsExporting(true);
    setIsDataMenuOpen(false);
    try {
      const response = await api.get('/api/coaches/import/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_import_pelatih_koni.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download import template failed:', error);
      alert('Gagal mengunduh template import. Silakan coba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    setIsDataMenuOpen(false);
    importFileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      alert('File import harus berformat .xlsx');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/coaches/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(response.data);
      showSuccessToast('Import data pelatih selesai.');
      queryClient.invalidateQueries({ queryKey: coachKeys.all });
    } catch (error) {
      console.error('Import coaches failed:', error);
      alert(error.response?.data?.message || 'Gagal mengimport data pelatih. Silakan coba lagi.');
    } finally {
      setIsImporting(false);
    }
  };

  const activeFiltersCount = [
    Boolean(filterCabor),
    Boolean(filterActive),
    Boolean(filterCluster),
    Boolean(filterSubCluster),
  ].filter(Boolean).length;

  const hasActiveFilters = activeFiltersCount > 0 || Boolean(debouncedSearch);
  const selectedCabor = cabors.find((c) => String(c.id) === String(filterCabor));
  const selectedCluster = clusters.find((c) => String(c.id) === String(filterCluster));
  const selectedSubCluster = subClusters.find((s) => String(s.id) === String(filterSubCluster));

  return (
    <DashboardLayout title="Data Pelatih" subtitle="Kelola data pelatih dan informasi lengkapnya">
      <div className="space-y-4 min-w-0 max-w-full">
        {/* Success Toast */}
        <AnimatePresence>
          {successMessage && (
            <Motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/30"
            >
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="ml-2 p-0.5 hover:bg-green-500 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Master Control Card (Header, Actions & Filter) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
          {/* Top Row: Title Context & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Daftar Pelatih KONI
                </h2>
                <p className="text-xs text-slate-500">
                  Total <span className="font-semibold text-slate-700">{total}</span> pelatih terdaftar
                </p>
              </div>
            </div>

            {/* Action Buttons Group */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <input
                ref={importFileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleImportFile}
                className="hidden"
              />

              {/* Data Actions Dropdown */}
              <div className="relative inline-block text-left" ref={dataMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsDataMenuOpen((prev) => !prev)}
                  disabled={isExporting || isImporting}
                  className={`flex items-center gap-2 px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all shadow-xs ${
                    isDataMenuOpen
                      ? 'border-red-500 ring-2 ring-red-100 text-red-700 bg-red-50/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                  title="Opsi impor dan template data pelatih"
                >
                  {isExporting || isImporting ? (
                    <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4 text-slate-600" />
                  )}
                  <span>Kelola Data</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isDataMenuOpen ? 'rotate-180 text-red-600' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isDataMenuOpen && (
                    <Motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
                    >
                      <div className="px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                        Impor & Template
                      </div>

                      <button
                        type="button"
                        onClick={handleDownloadImportTemplate}
                        disabled={isExporting}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                          <Download className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700">
                            Unduh Template Excel
                          </p>
                          <p className="text-xs text-slate-400">Template import (.xlsx)</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">
                            Unggah / Impor Excel
                          </p>
                          <p className="text-xs text-slate-400">Import data pelatih (.xlsx)</p>
                        </div>
                      </button>
                    </Motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 shrink-0 cursor-pointer"
                title="Tambah data pelatih baru"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pelatih</span>
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
                  placeholder="Cari pelatih, NIK, atau spesialisasi..."
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

              {/* Filter Toggle & Quick Reset */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFilterExpanded((prev) => !prev)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-xs ${
                    isFilterExpanded
                      ? 'bg-slate-900 text-white border-slate-900 shadow-slate-900/10'
                      : activeFiltersCount > 0
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filter</span>
                  {activeFiltersCount > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${
                        isFilterExpanded ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {activeFiltersCount}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isFilterExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-medium transition-colors"
                    title="Reset semua filter dan pencarian"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Expandable Filter Grid Panel */}
            <AnimatePresence initial={false}>
              {isFilterExpanded && (
                <Motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* 1. Cabor */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>Cabang Olahraga</span>
                        </label>
                        <select
                          value={filterCabor}
                          onChange={(e) => setFilterCabor(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                        >
                          <option value="">Semua Cabor</option>
                          {cabors.map((cabor) => (
                            <option key={cabor.id} value={cabor.id}>
                              {cabor.display_name || cabor.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. Status Aktif */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Status</span>
                        </label>
                        <select
                          value={filterActive}
                          onChange={(e) => setFilterActive(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                        >
                          <option value="">Semua Status</option>
                          <option value="true">Aktif</option>
                          <option value="false">Tidak Aktif</option>
                        </select>
                      </div>

                      {/* 3. Kluster */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          <span>Kluster Pelatih</span>
                        </label>
                        <select
                          value={filterCluster}
                          onChange={(e) => setFilterCluster(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                        >
                          <option value="">Semua Cluster</option>
                          {clusters.map((cluster) => (
                            <option key={cluster.id} value={cluster.id}>
                              {cluster.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 4. Sub-Kluster */}
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <GitBranch className="w-3.5 h-3.5 text-teal-500" />
                          <span>Sub-Kluster</span>
                        </label>
                        <select
                          value={filterSubCluster}
                          onChange={(e) => setFilterSubCluster(e.target.value)}
                          disabled={!filterCluster || subClusters.length === 0}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {!filterCluster
                              ? 'Pilih kluster dulu'
                              : subClusters.length === 0
                              ? 'Tidak ada sub-kluster'
                              : 'Semua Sub-Kluster'}
                          </option>
                          {subClusters.map((subCluster) => (
                            <option key={subCluster.id} value={subCluster.id}>
                              {subCluster.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-400 font-medium">Filter Aktif:</span>

                {debouncedSearch && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                    <span>Cari: &ldquo;{debouncedSearch}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="hover:text-red-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filterCabor && selectedCabor && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-medium">
                    <span>Cabor: {selectedCabor.display_name || selectedCabor.name}</span>
                    <button
                      type="button"
                      onClick={() => setFilterCabor('')}
                      className="hover:text-amber-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filterActive && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium">
                    <span>Status: {filterActive === 'true' ? 'Aktif' : 'Tidak Aktif'}</span>
                    <button
                      type="button"
                      onClick={() => setFilterActive('')}
                      className="hover:text-emerald-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filterCluster && selectedCluster && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-medium">
                    <span>Kluster: {selectedCluster.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterCluster('');
                        setFilterSubCluster('');
                      }}
                      className="hover:text-blue-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filterSubCluster && selectedSubCluster && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg font-medium">
                    <span>Sub-Kluster: {selectedSubCluster.name}</span>
                    <button
                      type="button"
                      onClick={() => setFilterSubCluster('')}
                      className="hover:text-teal-950 p-0.5"
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
              Menampilkan <strong className="text-slate-900 font-bold">{coaches.length}</strong> dari{' '}
              <strong className="text-slate-900 font-bold">{total}</strong> pelatih
            </span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md font-semibold text-[11px]">
                Hasil Filter
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isFetchingNextPage ? (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Memuat lebih banyak...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Data terkini
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
          ) : coaches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <User className="w-12 h-12 mb-2" />
              <p>Belum ada data pelatih</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-slate-600">Pelatih</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Cabor</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Lisensi</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Kluster</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-600">Telepon</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-600">Status</th>
                    <th className="text-center py-4 px-4 font-semibold text-slate-600">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coaches.map((coach) => (
                    <tr key={coach.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <ProtectedImage
                              src={getCoachPhotoUrl(coach)}
                              alt={coach.name}
                              className="w-full h-full object-cover"
                              fallback={<User className="w-5 h-5 text-slate-400" />}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{coach.name}</p>
                            <p className="text-xs text-slate-400">{coach.nik || 'NIK tidak tersedia'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                          {coach.cabor?.display_name || coach.cabor?.name || '-'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {coach.license_level || '-'}
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {coach.active_cluster?.cluster?.name ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <Layers className="w-3 h-3" />
                            {coach.active_cluster.cluster.name}
                            {coach.active_cluster?.sub_cluster?.name
                              ? ` - ${coach.active_cluster.sub_cluster.name}`
                              : ''}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        {coach.phone || '-'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            coach.is_active
                              ? 'bg-green-50 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {coach.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openDetailModal(coach)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(coach)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCoachToDelete(coach);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Infinite scroll status */}
          <div className="flex min-h-14 items-center justify-center border-t border-slate-100 px-6 py-4">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memuat lebih banyak...</span>
              </div>
            ) : !hasNextPage && coaches.length > 0 ? (
              <span className="text-xs text-slate-400">
                Semua data sudah ditampilkan
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <CoachFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        coach={selectedCoach}
        onSuccess={handleFormSuccess}
      />

      {/* Detail Modal */}
      <CoachDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        coach={selectedCoach}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && coachToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <Motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Hapus Pelatih</h3>
                  <p className="text-slate-500 text-sm">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                Apakah Anda yakin ingin menghapus pelatih <strong>{coachToDelete.name}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteCoachMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {deleteCoachMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Hapus
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Result Modal */}
      <AnimatePresence>
        {importResult && (
          <>
            <Motion.div
              key="import-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setImportResult(null)}
            />
            <Motion.div
              key="import-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Hasil Import Data Pelatih
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {importResult.message || 'Import selesai'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportResult(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500">Total Diproses</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {importResult.total_rows || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-xs text-green-700">Berhasil</p>
                    <p className="text-2xl font-bold text-green-700">
                      {importResult.success_count || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-xs text-red-700">Gagal</p>
                    <p className="text-2xl font-bold text-red-700">
                      {importResult.failed_count || 0}
                    </p>
                  </div>
                </div>

                {importResult.errors?.length > 0 ? (
                  <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600 w-24">
                            Baris
                          </th>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importResult.errors.map((error, index) => (
                          <tr key={`${error.row}-${index}`}>
                            <td className="px-4 py-3 text-slate-700">
                              {error.row}
                            </td>
                            <td className="px-4 py-3 text-red-600">
                              {error.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm">
                    Tidak ada error pada file import.
                  </div>
                )}

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setImportResult(null)}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                  >
                    Tutup
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
