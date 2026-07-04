import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, CheckCircle2, Download, Upload, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
  // Uses a scroll listener instead of IntersectionObserver to avoid cascade-
  // loading bugs. Only triggers when the user actually scrolls near the bottom.
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
      // Trigger when user is within 300px of the bottom
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
    setSelectedAthlete(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = async (athlete) => {
    try {
      const response = await api.get(`/api/athletes/${athlete.id}`);
      setSelectedAthlete(response.data);
      setIsFormModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch athlete details:", error);
      setSelectedAthlete(athlete);
      setIsFormModalOpen(true);
    }
  };

  const openDetailModal = async (athlete) => {
    try {
      const response = await api.get(`/api/athletes/${athlete.id}`);
      setSelectedAthlete(response.data);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch athlete details:", error);
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

    // Invalidate all loaded pages — TanStack Query refetches them in-place
    // without resetting scroll position.
    queryClient.invalidateQueries({ queryKey: athleteKeys.lists() });
  };

  const handleDeleteRequest = (athlete) => {
    setAthleteToDelete(athlete);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAthleteMutation.mutateAsync(athleteToDelete.id);
      // useDeleteAthlete.onSuccess already calls invalidateQueries for us
      setIsDeleteModalOpen(false);
      setAthleteToDelete(null);
    } catch (error) {
      console.error("Failed to delete athlete:", error);
    }
  };

  const handleExport = async (type) => {
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
      console.error("Export failed:", error);
      alert("Gagal mengekspor data. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadImportTemplate = async () => {
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
      console.error("Download import template failed:", error);
      alert("Gagal mengunduh template import. Silakan coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
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
      console.error("Import athletes failed:", error);
      alert(error.response?.data?.message || "Gagal mengimport data atlet. Silakan coba lagi.");
    } finally {
      setIsImporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="Data Atlet"
      subtitle="Kelola data atlet dan informasi lengkapnya"
    >
      <div className="min-w-0 max-w-full">
        {/* Success Toast */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6 min-w-0 max-w-full">
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
          />

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <input
              ref={importFileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleImportFile}
              className="hidden"
            />

            <AthleteExportButton
              isExporting={isExporting}
              onExport={handleExport}
            />

            <button
              type="button"
              onClick={handleDownloadImportTemplate}
              disabled={isExporting || isImporting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-xl font-medium hover:bg-blue-50 transition-colors disabled:opacity-50"
              title="Download template Excel untuk import data atlet"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Template Excel</span>
            </button>

            <button
              type="button"
              onClick={handleImportClick}
              disabled={isImporting || isExporting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              title="Import data atlet dari file Excel .xlsx"
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span>Import Excel</span>
            </button>

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

            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
            >
              <Plus className="w-5 h-5" />
              <span>Tambah</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 p-4 bg-white rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-2 min-w-0">
          <span className="text-sm text-slate-600">
            Total:{" "}
            <strong className="text-slate-800">{total}</strong> atlet
          </span>
          <span className="text-sm text-slate-400">
            Menampilkan {athletes.length} dari {total}
          </span>
        </div>

        {/* Table with infinite scroll sentinel */}
        <AthleteTable
          athletes={athletes}
          loading={loading}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          sentinelRef={sentinelRef}
          onView={openDetailModal}
          onEdit={openEditModal}
          onDelete={handleDeleteRequest}
        />
      </div>

      {/* Import Result Modal */}
      <AnimatePresence>
        {importResult && (
          <>
            <motion.div
              key="import-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
              onClick={() => setImportResult(null)}
            />
            <motion.div
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
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AthleteFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        athlete={selectedAthlete}
        onSuccess={handleFormSuccess}
      />

      {/* Detail Modal */}
      <AthleteDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        athlete={selectedAthlete}
      />

      {/* Delete Modal */}
      <AthleteDeleteModal
        isOpen={isDeleteModalOpen}
        athlete={athleteToDelete}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
        isPending={deleteAthleteMutation.isPending}
      />
    </DashboardLayout>
  );
}






