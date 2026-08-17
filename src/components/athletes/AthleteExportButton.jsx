import { useState, useRef, useEffect } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Upload,
  Loader2,
  ChevronDown,
  FileDown
} from "lucide-react";
import { motion as Motion, AnimatePresence } from "framer-motion";

/**
 * AthleteExportButton
 * Modern dropdown menu for exporting data (CSV/PDF) and importing data (Download Template / Upload Excel).
 *
 * Props:
 *  - isExporting        {boolean}
 *  - isImporting        {boolean}
 *  - onExport           {(type: 'csv' | 'pdf') => void}
 *  - onDownloadTemplate {() => void}
 *  - onImport           {() => void}
 */
export function AthleteExportButton({
  isExporting = false,
  isImporting = false,
  onExport,
  onDownloadTemplate,
  onImport,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleExportSelect = (type) => {
    setIsOpen(false);
    onExport?.(type);
  };

  const handleTemplateClick = () => {
    setIsOpen(false);
    onDownloadTemplate?.();
  };

  const handleImportClick = () => {
    setIsOpen(false);
    onImport?.();
  };

  const isBusy = isExporting || isImporting;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isBusy}
        className={`flex items-center gap-2 px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium transition-all shadow-xs ${
          isOpen
            ? "border-red-500 ring-2 ring-red-100 text-red-700 bg-red-50/20"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Opsi ekspor dan impor data atlet"
      >
        {isBusy ? (
          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4 text-slate-600" />
        )}
        <span>Kelola Data</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-red-600" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden"
          >
            {/* Header: Ekspor */}
            <div className="px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Ekspor Data
            </div>

            <button
              type="button"
              onClick={() => handleExportSelect("csv")}
              disabled={isExporting}
              className="w-full px-3.5 py-2 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 group-hover:text-emerald-700">
                  Ekspor Excel / CSV
                </p>
                <p className="text-xs text-slate-400">File spreadsheet (.csv)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleExportSelect("pdf")}
              disabled={isExporting}
              className="w-full px-3.5 py-2 text-left flex items-center gap-3 hover:bg-slate-50 transition-colors group"
            >
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 group-hover:text-rose-700">
                  Ekspor Dokumen PDF
                </p>
                <p className="text-xs text-slate-400">Format dokumen (.pdf)</p>
              </div>
            </button>

            {/* Divider */}
            <div className="my-1.5 border-t border-slate-100" />

            {/* Header: Impor */}
            <div className="px-3.5 py-1.5 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Impor & Template
            </div>

            {onDownloadTemplate && (
              <button
                type="button"
                onClick={handleTemplateClick}
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
            )}

            {onImport && (
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
                  <p className="text-xs text-slate-400">Import data dari file .xlsx</p>
                </div>
              </button>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

