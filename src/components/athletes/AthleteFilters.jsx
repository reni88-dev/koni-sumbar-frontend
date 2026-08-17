import { useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Trophy,
  Users,
  Building2,
  Layers,
  GitBranch,
  Award,
  ChevronDown,
} from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

/**
 * AthleteFilters
 * Renders the search bar, filter toggle, responsive filter grid, and active filter pills.
 */
export function AthleteFilters({
  search,
  setSearch,
  filterCabor,
  setFilterCabor,
  filterGender,
  setFilterGender,
  filterOrganization,
  setFilterOrganization,
  filterCluster,
  setFilterCluster,
  filterSubCluster,
  setFilterSubCluster,
  filterNationalNumber,
  setFilterNationalNumber,
  cabors = [],
  organizations = [],
  clusters = [],
  subClusters = [],
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Count active dropdown filters (excluding search query)
  const activeFiltersCount = [
    Boolean(filterCabor),
    Boolean(filterGender),
    Boolean(filterOrganization),
    Boolean(filterCluster),
    Boolean(filterSubCluster),
    Boolean(filterNationalNumber),
  ].filter(Boolean).length;

  const hasAnyFilter = activeFiltersCount > 0 || Boolean(search);

  const handleResetAll = () => {
    setSearch("");
    setFilterCabor("");
    setFilterGender("");
    setFilterOrganization("");
    setFilterCluster("");
    setFilterSubCluster("");
    setFilterNationalNumber("");
  };

  // Helper labels for active pills
  const selectedCabor = cabors.find((c) => String(c.id) === String(filterCabor));
  const selectedOrg = organizations.find((o) => String(o.id) === String(filterOrganization));
  const selectedCluster = clusters.find((c) => String(c.id) === String(filterCluster));
  const selectedSubCluster = subClusters.find((s) => String(s.id) === String(filterSubCluster));

  return (
    <div className="w-full space-y-3">
      {/* Top Search & Filter Trigger Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Box */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atlet, NIK, atau nomor nasional..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
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
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all shadow-xs ${
              isExpanded
                ? "bg-slate-900 text-white border-slate-900 shadow-slate-900/10"
                : activeFiltersCount > 0
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full ${
                  isExpanded
                    ? "bg-red-500 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {hasAnyFilter && (
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
        {isExpanded && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {/* 1. Cabang Olahraga */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cabang Olahraga</span>
                  </label>
                  <div className="relative">
                    <select
                      value={filterCabor}
                      onChange={(e) => setFilterCabor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                    >
                      <option value="">Semua Cabor</option>
                      {cabors.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.display_name || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Jenis Kelamin */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>Jenis Kelamin</span>
                  </label>
                  <div className="relative">
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                    >
                      <option value="">Semua Gender</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                </div>

                {/* 3. Organisasi */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    <span>Organisasi / Pengcab</span>
                  </label>
                  <div className="relative">
                    <select
                      value={filterOrganization}
                      onChange={(e) => setFilterOrganization(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                    >
                      <option value="">Semua Organisasi</option>
                      {organizations.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Kluster */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Kluster Atlet</span>
                  </label>
                  <div className="relative">
                    <select
                      value={filterCluster}
                      onChange={(e) => setFilterCluster(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                    >
                      <option value="">Semua Kluster</option>
                      {clusters.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5. Sub-Kluster */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <GitBranch className="w-3.5 h-3.5 text-teal-500" />
                    <span>Sub-Kluster</span>
                  </label>
                  <div className="relative">
                    <select
                      value={filterSubCluster}
                      onChange={(e) => setFilterSubCluster(e.target.value)}
                      disabled={!filterCluster || subClusters.length === 0}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!filterCluster
                          ? "Pilih kluster dulu"
                          : subClusters.length === 0
                          ? "Tidak ada sub-kluster"
                          : "Semua Sub-Kluster"}
                      </option>
                      {subClusters.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 6. Nomor Nasional */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                    <Award className="w-3.5 h-3.5 text-rose-500" />
                    <span>No. Nasional</span>
                  </label>
                  <div className="relative">
                    <select
                      value={filterNationalNumber}
                      onChange={(e) => setFilterNationalNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all cursor-pointer hover:border-slate-300"
                    >
                      <option value="">Semua Status</option>
                      <option value="true">Sudah Punya</option>
                      <option value="false">Belum Punya</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Chips / Pills */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-medium">Filter Aktif:</span>

          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
              <span>Cari: &ldquo;{search}&rdquo;</span>
              <button
                type="button"
                onClick={() => setSearch("")}
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
                onClick={() => setFilterCabor("")}
                className="hover:text-amber-950 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterGender && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-medium">
              <span>Gender: {filterGender === "male" ? "Laki-laki" : "Perempuan"}</span>
              <button
                type="button"
                onClick={() => setFilterGender("")}
                className="hover:text-blue-950 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterOrganization && selectedOrg && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg font-medium">
              <span>Org: {selectedOrg.name}</span>
              <button
                type="button"
                onClick={() => setFilterOrganization("")}
                className="hover:text-purple-950 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterCluster && selectedCluster && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium">
              <span>Kluster: {selectedCluster.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFilterCluster("");
                  setFilterSubCluster("");
                }}
                className="hover:text-emerald-950 p-0.5"
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
                onClick={() => setFilterSubCluster("")}
                className="hover:text-teal-950 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filterNationalNumber && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg font-medium">
              <span>
                No. Nasional: {filterNationalNumber === "true" ? "Sudah Punya" : "Belum Punya"}
              </span>
              <button
                type="button"
                onClick={() => setFilterNationalNumber("")}
                className="hover:text-rose-950 p-0.5"
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
  );
}
