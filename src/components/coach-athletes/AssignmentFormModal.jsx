import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { CoachSearchDropdown } from './CoachSearchDropdown';
import { AthleteMultiSelect } from './AthleteMultiSelect';

export function AssignmentFormModal({
  isOpen,
  onClose,
  modalMode,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  formLoading,
  allCabors,
}) {
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
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-lg font-bold text-slate-800">
              {modalMode === 'create' ? 'Tambah Assignment Baru' : 'Edit Assignment'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <form onSubmit={onSubmit} className="p-6 space-y-4">
            {/* Coach Dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Pelatih</label>
              <CoachSearchDropdown
                value={formData.coach_id}
                onChange={(id) => setFormData({...formData, coach_id: id})}
                disabled={modalMode === 'edit'}
              />
              {formErrors.coach_id && <p className="text-red-500 text-xs mt-1">{formErrors.coach_id}</p>}
            </div>

            {/* Cabor — placed before athletes so it filters the athlete list */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cabor</label>
              <select
                value={formData.cabor_id}
                onChange={e => setFormData({...formData, cabor_id: e.target.value, athlete_ids: []})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
              >
                <option value="">-- Pilih Cabor --</option>
                {allCabors.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Athletes Multi-Select — filtered by selected cabor */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Atlet {modalMode === 'create' && <span className="text-slate-400 font-normal">(multi-pilih)</span>}
              </label>
              {modalMode === 'create' ? (
                <AthleteMultiSelect
                  value={formData.athlete_ids}
                  onChange={(ids) => setFormData({...formData, athlete_ids: ids})}
                  caborId={formData.cabor_id}
                />
              ) : (
                <AthleteMultiSelect
                  value={formData.athlete_ids}
                  onChange={(ids) => setFormData({...formData, athlete_ids: ids.slice(-1)})}
                  caborId={formData.cabor_id}
                  disabled
                />
              )}
              {!formData.cabor_id && modalMode === 'create' && (
                <p className="text-amber-500 text-xs mt-1">Pilih cabor terlebih dahulu untuk memfilter atlet</p>
              )}
              {formErrors.athlete_id && <p className="text-red-500 text-xs mt-1">{formErrors.athlete_id}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peran</label>
              <select
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
              >
                <option value="head_coach">Pelatih Utama</option>
                <option value="assistant_coach">Asisten Pelatih</option>
                <option value="specialist_coach">Pelatih Spesialis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none resize-none"
                rows={2}
                placeholder="Catatan opsional..."
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ca_is_active"
                checked={formData.is_active}
                onChange={e => setFormData({...formData, is_active: e.target.checked})}
                className="w-4 h-4 accent-red-600"
              />
              <label htmlFor="ca_is_active" className="text-sm text-slate-700">Aktif</label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={formLoading || !formData.coach_id || formData.athlete_ids.length === 0}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {modalMode === 'create' ? 'Simpan' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}
