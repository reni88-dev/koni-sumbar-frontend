import { Loader2 } from "lucide-react";
import { AthleteTableRow } from "./AthleteTableRow";

/**
 * AthleteTable
 * Full table including <thead> and <tbody>.
 * Handles loading spinner, empty state, and infinite-scroll sentinel.
 *
 * Props:
 *  - athletes           {array}
 *  - loading            {boolean}   - true only on initial load
 *  - isFetchingNextPage {boolean}   - true when loading next page
 *  - hasNextPage        {boolean}   - false when all data is loaded
 *  - sentinelRef        {ref}       - ref attached to the sentinel div
 *  - onView             {(athlete)=>void}
 *  - onEdit             {(athlete)=>void}
 *  - onDelete           {(athlete)=>void}
 */
export function AthleteTable({
  athletes,
  loading,
  isFetchingNextPage,
  hasNextPage,
  sentinelRef,
  onView,
  onEdit,
  onDelete,
}) {
  const thClass =
    "text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider";

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className={thClass}>Atlet</th>
              <th className={thClass}>Cabor</th>
              <th className={thClass}>TTL</th>
              <th className={thClass}>Gender</th>
              <th className={thClass}>Kluster</th>
              <th className={thClass}>No. Nasional</th>
              <th className={thClass}>Status</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                </td>
              </tr>
            ) : athletes.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  Tidak ada data atlet
                </td>
              </tr>
            ) : (
              athletes.map((athlete) => (
                <AthleteTableRow
                  key={athlete.id}
                  athlete={athlete}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Infinite Scroll Sentinel ──────────────────────────────────────── */}
      <div ref={sentinelRef} className="px-6 py-4 flex justify-center">
        {isFetchingNextPage ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Memuat lebih banyak...</span>
          </div>
        ) : !hasNextPage && athletes.length > 0 ? (
          <span className="text-xs text-slate-400">
            Semua data sudah ditampilkan
          </span>
        ) : null}
      </div>
    </div>
  );
}
