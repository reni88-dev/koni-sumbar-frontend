import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, CheckCircle2 } from "lucide-react";
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
  const [successMessage, setSuccessMessage] = useState("");

  // ── Refs ──────────────────────────────────────────────────────────────────
  const sentinelRef = useRef(null);
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title="Data Atlet"
      subtitle="Kelola data atlet dan informasi lengkapnya"
    >
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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

        <div className="flex items-center gap-3">
          <AthleteExportButton
            isExporting={isExporting}
            onExport={handleExport}
          />

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
                ? cabors.find((c) => String(c.id) === String(filterCabor))?.name
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
      <div className="mb-6 p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
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
