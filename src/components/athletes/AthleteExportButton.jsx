import { useState } from "react";
import { Download, Loader2, ChevronDown, FileSpreadsheet, FileText } from "lucide-react";

/**
 * AthleteExportButton
 * Dropdown button to export athlete data as CSV or PDF.
 *
 * Props:
 *  - isExporting  {boolean}       - shows spinner while export is in progress
 *  - onExport     {(type) => void} - called with "csv" or "pdf"
 */
export function AthleteExportButton({ isExporting, onExport }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (type) => {
    setIsOpen(false);
    onExport(type);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isExporting}
        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
      >
        {isExporting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        <span>Export</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu on outside click */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-20">
            <button
              onClick={() => handleSelect("csv")}
              className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Excel / CSV (.csv)</span>
            </button>
            <button
              onClick={() => handleSelect("pdf")}
              className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium">PDF (.pdf)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
