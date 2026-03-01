import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Loader2, ChevronDown, Check } from 'lucide-react';
import { useCoaches } from '../../hooks/queries/useCoaches';

export function CoachSearchDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const ref = useRef(null);

  const { data: coachesData, isLoading } = useCoaches({ search: debouncedSearch, perPage: 20 });
  const coaches = coachesData?.data || [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedCoach = value ? coaches.find(c => c.id === value) : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-left focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400"
      >
        {value ? (
          <span className="truncate">
            <span className="font-medium">{selectedCoach?.name || `Coach #${value}`}</span>
            {selectedCoach?.cabor?.name && <span className="text-slate-400 ml-1">• {selectedCoach.cabor.name}</span>}
          </span>
        ) : (
          <span className="text-slate-400">Pilih Pelatih...</span>
        )}
        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama / NIK pelatih..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : coaches.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Tidak ditemukan</p>
              ) : (
                coaches.map(coach => (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => { onChange(coach.id); setOpen(false); setSearch(''); }}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                      value === coach.id ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-800 truncate">{coach.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {coach.cabor?.name || 'Tanpa Cabor'}
                        {coach.nik && ` • NIK: ${coach.nik}`}
                      </p>
                    </div>
                    {value === coach.id && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
