import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { toTitleCase } from "./athleteUtils";

/**
 * AthleteDeleteModal
 * Animated confirmation modal before deleting an athlete.
 *
 * Props:
 *  - isOpen    {boolean}
 *  - athlete   {object|null}   - the athlete to be deleted
 *  - onConfirm {()=>void}      - called when user clicks "Hapus"
 *  - onClose   {()=>void}      - called when user cancels or clicks backdrop
 *  - isPending {boolean}       - shows loading state on confirm button
 */
export function AthleteDeleteModal({
  isOpen,
  athlete,
  onConfirm,
  onClose,
  isPending,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="delete-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            key="delete-content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Hapus Atlet?
              </h3>

              <p className="text-slate-500 text-sm mb-6">
                Anda yakin ingin menghapus atlet{" "}
                <strong>{toTitleCase(athlete?.name)}</strong>?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
