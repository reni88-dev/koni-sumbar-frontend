import { useState, useEffect, useRef } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, X, CheckCircle2, Users, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePermission } from "../hooks/usePermission";
import {
  getSafeApiMessage,
  isAccountBlockedError,
  isPermissionDeniedError,
  isSessionInvalidError,
} from "../lib/authAccess";

import { DashboardLayout } from "../components/DashboardLayout";
import { AthleteFormModal } from "../components/AthleteFormModal";
import { AthleteDetailModal } from "../components/AthleteDetailModal";
import { PrintAthleteList } from "../components/PrintAthleteList";

import { AthleteFilters } from "../components/athletes/AthleteFilters";
import { AthleteExportButton } from "../components/athletes/AthleteExportButton";
import { AthleteTable } from "../components/athletes/AthleteTable";
import { AthleteDeleteModal } from "../components/athletes/AthleteDeleteModal";

import { useInfiniteAthletes, useDeleteAthlete, athleteKeys } from "../hooks/queries/useAthletes";
import { useCaborsAll } from "../hooks/queries/useCabors";
import { useOrganizationsAll } from "../hooks/queries/useOrganizations";
import {
  useAthleteClustersAll,
  useAthleteSubClustersByCluster,
} from "../hooks/queries/useAthleteClusterMaster";
import api from "../api/axios";

export function AthletesPage() {
  const { can } = usePermission();
  const canView = can("athletes.view");
  const canCreate = can("athletes.create");
  const canEdit = can("athletes.edit");
  const canDelete = can("athletes.delete");
  const canViewSensitive = can("athletes.sensitive.read");
  const canExport = canView && canViewSensitive;
  const canCreateSensitive = canCreate && canViewSensitive;
  const canEditSensitive = canEdit && canViewSensitive;
  // ── Filter state ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterCabor, setFilterCabor] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterOrganization, setFilterOrganization] = useState("");
  const [filterCluster, setFilterCluster] = useState("");
  const [filterSubCluster, setFilterSubCluster] = useState("");
  const [filterNationalNumber, setFilterNationalNumber] = useState("");

  // ── Modal state ───────────────────────────────────────────────────────────
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState(null);

  // ── Export / UI state ─────────────────────────────────────────────────────
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // ── Refs ──────────────────────────────────────────────────────────────────
  const sentinelRef = useRef(null);
  const importFileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: cabors = [] } = useCaborsAll();
  const { data: organizations = [] } = useOrganizationsAll();
  const { data: clusters = [] } = useAthleteClustersAll();
  const { data: subClusters = [] } =
    useAthleteSubClustersByCluster(filterCluster);

  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteAthletes({
    search: debouncedSearch,
    caborId: filterCabor,
    gender: filterGender,
    organizationId: filterOrganization,
    clusterId: filterCluster,
    subClusterId: filterSubCluster,
    hasNationalAthleteNumber: filterNationalNumber,
  });

  const deleteAthleteMutation = useDeleteAthlete();

  // Flatten all pages into a single athlete array
  const athletes = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  // ── Infinite Scroll: Scroll Event Listener ─────────────────────────────────
  const fetchNextPageRef = useRef(fetchNextPage);
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingRef = useRef(isFetchingNextPage);

  useEffect(() => { fetchNextPageRef.current = fetchNextPage; }, [fetchNextPage]);
  useEffect(() => { hasNextPageRef.current = hasNextPage; }, [hasNextPage]);
  useEffect(() => { isFetchingRef.current = isFetchingNextPage; }, [isFetchingNextPage]);

  useEffect(() => {
    const container = document.getElementById("main-scroll-container");

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
      if (!hasNextPageRef.current || isFetchingRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = getScrollMetrics();
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        fetchNextPageRef.current();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    container?.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      container?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Clear sub-cluster when it no longer exists in the fetched list
  useEffect(() => {
    if (
      filterSubCluster &&
      !subClusters.some((item) => String(item.id) === String(filterSubCluster))
    ) {
      setFilterSubCluster("");
    }
  }, [filterSubCluster, subClusters]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreateModal = () => {
    if (!canCreateSensitive) return;
    setSelectedAthlete(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = async (athlete) => {
    if (!canEditSensitive) return;
    try {
      const response = await api.get(`/api/athletes/${athlete.id}`);
      setSelectedAthlete(response.data);
      setIsFormModalOpen(true);
    } catch (error) {
      if (
        isPermissionDeniedError(error) ||
        isSessionInvalidError(error) ||
        isAccountBlockedError(error)
      ) return;
      setSelectedAthlete(athlete);
      setIsFormModalOpen(true);
    }
  };

  const openDetailModal = async (athlete) => {
    if (!canView) return;
    try {
      const response = await api.get(`/api/athletes/${athlete.id}`);
      setSelectedAthlete(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      if (
        isPermissionDeniedError(error) ||
        isSessionInvalidError(error) ||
        isAccountBlockedError(error)
      ) return;
      setSelectedAthlete(athlete);
      setIsDetailModalOpen(true);
    }
  };

  const handleFormSuccess = () => {
    const message = selectedAthlete
      ? "Data atlet berhasil diupdate!"
      : "Atlet baru berhasil ditambahkan!";
    setIsFormModalOpen(false);
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);

    queryClient.invalidateQueries({ queryKey: athleteKeys.lists() });
  };

  const handleDeleteRequest = (athlete) => {
    if (!canDelete) return;
    setAthleteToDelete(athlete);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!canDelete || !athleteToDelete) return;
    try {
      await deleteAthleteMutation.mutateAsync(athleteToDelete.id);
      setIsDeleteModalOpen(false);
      setAthleteToDelete(null);
    } catch (error) {
      if (
        isPermissionDeniedError(error) ||
        isSessionInvalidError(error) ||
        isAccountBlockedError(error)
      ) return;
      alert(getSafeApiMessage(error, "Gagal menghapus atlet. Silakan coba lagi."));
    }
  };

  const handleExport = async (type) => {
    if (!canExport) return;
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (filterCabor) params.append("cabor_id", filterCabor);
      if (filterGender) params.append("gender", filterGender);
      if (filterCluster) params.append("cluster_id", filterCluster);
      if (filterSubCluster) params.append("sub_cluster_id", filterSubCluster);
      if (filterNationalNumber)
        params.append("has_national_athlete_number", filterNationalNumber);

      const response = await api.get(
        `/api/athletes/export/${type}?${params.toString()}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `data_atlet_koni_${new Date().toISOString().split("T")[0]}.${type}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (
        isPermissionDeniedError(error) ||
        isSessionInvalidError(error) ||
        isAccountBlockedError(error)
      ) return;
      alert("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImportTemplate = async () => {
    if (!canCreateSensitive) return;
    setIsExporting(true);
    try {
      const response = await api.get("/api/athletes/import/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_import_atlet_koni.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (
        isPermissionDeniedError(error) ||
        isSessionInvalidError(error) ||
        isAccountBlockedError(error)
      ) return;
      alert("Gagal mengunduh template import. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    if (!canCreateSensitive) return;
    importFileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    if (!canCreateSensitive) {
      event.target.value = "";
      return;
    }
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      alert("File import harus berformat .xlsx");
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/athletes/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(response.data);
      setSuccessMessage("Import data atlet selesai.");
      setTimeout(() => setSuccessMessage(""), 3000);
      queryClient.invalidateQueries({ queryKey: athleteKeys.lists() });
    } catch (error) {
      if (
        isPermissionDeniedError(error) ||
        isSessionInvalidError(error) ||
        isAccountBlockedError(error)
      ) return;
      alert(error.response?.data?.message || "Gagal mengimport data atlet. Silakan coba lagi.");
    } finally {
      setIsImporting(false);
    }
  };

  const hasActiveFilters = Boolean(
    debouncedSearch ||
    filterCabor ||
    filterGender ||
    filterOrganization ||
    filterCluster ||
    filterSubCluster ||
    filterNationalNumber
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="Data Atlet"
      subtitle="Kelola data atlet dan informasi lengkapnya"
    >
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
                onClick={() => setSuccessMessage("")}
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
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Daftar Atlet KONI
                </h2>
                <p className="text-xs text-slate-500">
                  Total <span className="font-semibold text-slate-700">{total}</span> atlet terdata
                </p>
              </div>
            </div>

            {/* Action Buttons Group */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {canCreateSensitive && (
                <input
                  ref={importFileInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleImportFile}
                  className="hidden"
                />
              )}

              <PrintAthleteList
                total={total}
                filterParams={{
                  search: debouncedSearch,
                  caborId: filterCabor,
                  gender: filterGender,
                  organizationId: filterOrganization,
                  clusterId: filterCluster,
                  subClusterId: filterSubCluster,
                  hasNationalAthleteNumber: filterNationalNumber,
                }}
                filters={{
                  cabor: filterCabor
                    ? (() => {
                      const cabor = cabors.find(
                        (c) => String(c.id) === String(filterCabor)
                      );
                      return cabor?.display_name || cabor?.name;
                    })()
                    : "",
                  gender: filterGender,
                  organization: filterOrganization
                    ? organizations.find(
                      (o) => String(o.id) === String(filterOrganization)
                    )?.name
                    : "",
                  cluster: filterCluster
                    ? clusters.find((c) => String(c.id) === String(filterCluster))
                      ?.name
                    : "",
                  subCluster: filterSubCluster
                    ? subClusters.find(
                      (c) => String(c.id) === String(filterSubCluster)
                    )?.name
                    : "",
                  search: debouncedSearch,
                }}
              />

              {(canExport || canCreateSensitive) && (
                <AthleteExportButton
                  isExporting={isExporting}
                  isImporting={isImporting}
                  canExport={canExport}
                  canImport={canCreateSensitive}
                  onExport={handleExport}
                  onDownloadTemplate={handleDownloadImportTemplate}
                  onImport={handleImportClick}
                />
              )}

              {canCreateSensitive && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 shrink-0 cursor-pointer"
                  title="Tambah atlet baru"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Atlet</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter Component */}
          <AthleteFilters
            search={search}
            setSearch={setSearch}
            filterCabor={filterCabor}
            setFilterCabor={setFilterCabor}
            filterGender={filterGender}
            setFilterGender={setFilterGender}
            filterOrganization={filterOrganization}
            setFilterOrganization={setFilterOrganization}
            filterCluster={filterCluster}
            setFilterCluster={setFilterCluster}
            filterSubCluster={filterSubCluster}
            setFilterSubCluster={setFilterSubCluster}
            filterNationalNumber={filterNationalNumber}
            setFilterNationalNumber={setFilterNationalNumber}
            cabors={cabors}
            organizations={organizations}
            clusters={clusters}
            subClusters={subClusters}
            canViewSensitive={canViewSensitive}
          />
        </div>

        {/* Stats & Table Counter Strip */}
        <div className="px-4 py-3 bg-white rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">
              Menampilkan <strong className="text-slate-900 font-bold">{athletes.length}</strong> dari{" "}
              <strong className="text-slate-900 font-bold">{total}</strong> atlet
            </span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md font-semibold text-[11px]">
                Hasil Filter
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isFetchingNextPage && (
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Memuat data...
              </span>
            )}
            {!isFetchingNextPage && (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Data terkini
              </span>
            )}
          </div>
        </div>

        {/* Table with infinite scroll sentinel */}
        <AthleteTable
          athletes={athletes}
          loading={loading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          sentinelRef={sentinelRef}
          onView={openDetailModal}
          onEdit={canEditSensitive ? openEditModal : undefined}
          onDelete={canDelete ? handleDeleteRequest : undefined}
        />
      </div>

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
                      Hasil Import Data Atlet
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {importResult.message || "Import selesai"}
                    </p>
                  </div>
                  <button
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

      {/* Form Modal */}
      {(selectedAthlete ? canEditSensitive : canCreateSensitive) && (
        <AthleteFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          athlete={selectedAthlete}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Detail Modal */}
      {canView && (
        <AthleteDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          athlete={selectedAthlete}
          canViewSensitive={canViewSensitive}
        />
      )}

      {/* Delete Modal */}
      {canDelete && (
        <AthleteDeleteModal
          isOpen={isDeleteModalOpen}
          athlete={athleteToDelete}
          onConfirm={handleDeleteConfirm}
          onClose={() => setIsDeleteModalOpen(false)}
          isPending={deleteAthleteMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}






