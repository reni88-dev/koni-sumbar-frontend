import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';

export function CompetitionClassFormModal({ isOpen, onClose, competitionClass, cabors, onSuccess }) {
  const [selectedCabor, setSelectedCabor] = useState('');
  const [items, setItems] = useState([{ name: '', code: '', description: '' }]);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEditMode = !!competitionClass;

  useEffect(() => {
    if (isOpen) {
      setFormErrors({});
      if (competitionClass) {
        // Edit mode: single item
        setSelectedCabor(competitionClass.cabor_id || '');
        setItems([{
          name: competitionClass.name || '',
          code: competitionClass.code || '',
          description: competitionClass.description || '',
          is_active: competitionClass.is_active ?? true
        }]);
      } else {
        // Create mode: empty batch
        setSelectedCabor('');
        setItems([{ name: '', code: '', description: '' }]);
      }
    }
  }, [isOpen, competitionClass]);

  // Add new item row
  const addItem = () => {
    setItems([...items, { name: '', code: '', description: '' }]);
  };

  // Remove item row
  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item field
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!selectedCabor) {
      setFormErrors({ cabor_id: ['Cabang olahraga wajib dipilih'] });
      return;
    }

    const validItems = items.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      setFormErrors({ items: ['Minimal 1 kelas harus diisi'] });
      return;
    }

    setLoading(true);
    setFormErrors({});

    try {
      if (isEditMode) {
        // Edit mode: update single item
        await api.put(`/api/master/competition-classes/${competitionClass.id}`, {
          cabor_id: selectedCabor,
          name: items[0].name,
          code: items[0].code,
          description: items[0].description,
          is_active: items[0].is_active ?? true
        });
      } else {
        // Create mode: batch create with single request
        await api.post('/api/master/competition-classes/batch', {
          cabor_id: selectedCabor,
          items: validItems.map(item => ({
            name: item.name,
            code: item.code || null,
            description: item.description || null
          }))
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if can add more items
  const canAddMore = items.length < 20 && !isEditMode;

  // Get selected cabor name for display
  const selectedCaborName = cabors.find(c => c.id == selectedCabor)?.name || '';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isEditMode ? 'Edit Kelas Pertandingan' : 'Tambah Kelas Pertandingan'}
              </h2>
              {!isEditMode && (
                <p className="text-sm text-slate-500 mt-1">
                  Tambahkan satu atau beberapa kelas untuk cabor yang dipilih
                </p>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            {/* Cabor Selection */}
            <div className="p-6 border-b border-slate-100 flex-shrink-0">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cabang Olahraga *</label>
              <select
                value={selectedCabor}
                onChange={e => setSelectedCabor(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                required
                disabled={isEditMode}
              >
                <option value="">Pilih Cabor</option>
                {cabors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {formErrors.cabor_id && <p className="text-red-500 text-xs mt-1">{formErrors.cabor_id[0]}</p>}
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedCabor ? (
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
                    <div className="col-span-5">Nama Kelas *</div>
                    <div className="col-span-2">Kode</div>
                    <div className="col-span-4">Deskripsi</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Item Rows */}
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateItem(index, 'name', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                          placeholder="Contoh: 80kg, U-21"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={item.code}
                          onChange={e => updateItem(index, 'code', e.target.value.toUpperCase())}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm font-mono"
                          placeholder="A"
                          maxLength={10}
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => updateItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-sm"
                          placeholder="Keterangan"
                        />
                      </div>
                      <div className="col-span-1">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2.5 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Edit mode: is_active checkbox */}
                  {isEditMode && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={items[0]?.is_active ?? true}
                        onChange={e => updateItem(0, 'is_active', e.target.checked)}
                        className="w-4 h-4 accent-red-600"
                      />
                      <label htmlFor="is_active" className="text-sm text-slate-700">Aktif</label>
                    </div>
                  )}

                  {/* Add More Button */}
                  {canAddMore && (
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-red-300 hover:text-red-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Kelas Lainnya
                    </button>
                  )}

                  {formErrors.items && <p className="text-red-500 text-xs mt-2">{formErrors.items[0]}</p>}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <p>Pilih cabang olahraga terlebih dahulu</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedCabor}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isEditMode ? 'Update' : `Simpan ${items.filter(i => i.name.trim()).length} Kelas`}
                </button>
              </div>
              {!isEditMode && selectedCabor && (
                <p className="text-xs text-slate-400 text-center mt-3">
                  {items.filter(i => i.name.trim()).length} kelas akan ditambahkan untuk {selectedCaborName}
                </p>
              )}
            </div>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
