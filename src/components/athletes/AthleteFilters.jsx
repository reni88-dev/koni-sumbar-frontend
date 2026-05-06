import { Search } from "lucide-react";

const selectClass =
  "px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none max-w-full";

/**
 * AthleteFilters
 * Renders the search input and all dropdown filters for the athletes page.
 *
 * Props:
 *  - search, setSearch
 *  - filterCabor, setFilterCabor
 *  - filterGender, setFilterGender
 *  - filterOrganization, setFilterOrganization
 *  - filterCluster, setFilterCluster
 *  - filterSubCluster, setFilterSubCluster
 *  - filterNationalNumber, setFilterNationalNumber
 *  - cabors, organizations, clusters, subClusters (array data from API)
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
  cabors,
  organizations,
  clusters,
  subClusters,
}) {
  return (
    <div className="flex flex-wrap gap-3 min-w-0 flex-1 max-w-full">
      {/* Search */}
      <div className="relative w-full sm:w-64 max-w-full">
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Cari nama atau NIK..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none w-full"
        />
      </div>

      {/* Cabor */}
      <select
        value={filterCabor}
        onChange={(e) => setFilterCabor(e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Cabor</option>
        {cabors.map((c) => (
          <option key={c.id} value={c.id}>
            {c.display_name || c.name}
          </option>
        ))}
      </select>

      {/* Gender */}
      <select
        value={filterGender}
        onChange={(e) => setFilterGender(e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Gender</option>
        <option value="male">Laki-laki</option>
        <option value="female">Perempuan</option>
      </select>

      {/* Organisasi */}
      <select
        value={filterOrganization}
        onChange={(e) => setFilterOrganization(e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Organisasi</option>
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      {/* Kluster */}
      <select
        value={filterCluster}
        onChange={(e) => setFilterCluster(e.target.value)}
        className={selectClass}
      >
        <option value="">Semua Cluster</option>
        {clusters.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      {/* Sub-Kluster (hanya tampil jika kluster dipilih dan ada data) */}
      {filterCluster && subClusters.length > 0 && (
        <select
          value={filterSubCluster}
          onChange={(e) => setFilterSubCluster(e.target.value)}
          className={selectClass}
        >
          <option value="">Semua Sub-Kluster</option>
          {subClusters.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      )}

      {/* Nomor Nasional */}
      <select
        value={filterNationalNumber}
        onChange={(e) => setFilterNationalNumber(e.target.value)}
        className={selectClass}
      >
        <option value="">Semua No. Nasional</option>
        <option value="true">Sudah punya nomor nasional</option>
        <option value="false">Belum punya nomor nasional</option>
      </select>
    </div>
  );
}
