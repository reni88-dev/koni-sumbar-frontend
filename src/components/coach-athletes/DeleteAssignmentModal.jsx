import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export function DeleteAssignmentModal({ isOpen, onClose, assignment, onDelete, isDeleting, deleteError }) {
  if (!isOpen) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Assignment?</h3>
          <p className="text-slate-500 text-sm mb-4">
            Hapus assignment <strong>{assignment?.coach?.name}</strong> → <strong>{assignment?.athlete?.name}</strong>?
          </p>
          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
