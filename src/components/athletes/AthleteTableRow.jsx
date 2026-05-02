import { Eye, Edit2, Trash2 } from "lucide-react";
import { ProtectedImage } from "../ProtectedImage";
import { toTitleCase, formatDate } from "./athleteUtils";

const genderLabels = { male: "Laki-laki", female: "Perempuan" };

/**
 * AthleteTableRow
 * Renders a single <tr> for one athlete in the athletes table.
 *
 * Props:
 *  - athlete  {object}         - athlete data object
 *  - onView   {(athlete)=>void}
 *  - onEdit   {(athlete)=>void}
 *  - onDelete {(athlete)=>void}
 */
export function AthleteTableRow({ athlete, onView, onEdit, onDelete }) {
  const initial = athlete.name?.charAt(0).toUpperCase() || "?";

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* Nama & Foto */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {athlete.photo ? (
            <ProtectedImage
              src={athlete.photo}
              alt={athlete.name}
              className="w-10 h-10 rounded-full object-cover"
              fallback={
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium">
                  {initial}
                </div>
              }
            />
          ) : (
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-medium">
              {initial}
            </div>
          )}
          <span className="font-medium text-slate-800">
            {toTitleCase(athlete.name)}
          </span>
        </div>
      </td>

      {/* Cabor */}
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm whitespace-nowrap">
          {athlete.cabor?.name || "-"}
        </span>
      </td>

      {/* TTL */}
      <td className="px-6 py-4 text-sm text-slate-600">
        {athlete.birth_place ? `${athlete.birth_place}, ` : ""}
        {formatDate(athlete.birth_date)}
      </td>

      {/* Gender */}
      <td className="px-6 py-4">
        <span
          className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
            athlete.gender === "male"
              ? "bg-blue-100 text-blue-700"
              : "bg-pink-100 text-pink-700"
          }`}
        >
          {genderLabels[athlete.gender] || "-"}
        </span>
      </td>

      {/* Kluster */}
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span
            className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${
              athlete.is_development_cluster
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {athlete.current_cluster_label || "Atlet Non Binaan"}
          </span>
          {athlete.current_sub_cluster_label && (
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 whitespace-nowrap">
              {athlete.current_sub_cluster_label}
            </span>
          )}
        </div>
      </td>

      {/* No. Nasional */}
      <td className="px-6 py-4">
        <span className="font-mono text-sm text-slate-600 whitespace-nowrap">
          {athlete.national_athlete_number || "-"}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            athlete.is_active
              ? "bg-green-100 text-green-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {athlete.is_active ? "Aktif" : "Nonaktif"}
        </span>
      </td>

      {/* Aksi */}
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onView(athlete)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(athlete)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(athlete)}
            className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
