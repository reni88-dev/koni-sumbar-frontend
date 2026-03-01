import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Loader2, ChevronDown, Check, X } from 'lucide-react';
import { useAthletes } from '../../hooks/queries/useAthletes';

export function AthleteMultiSelect({ value = [], onChange, disabled, caborId }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const ref = useRef(null);

  const { data: athletesData, isLoading } = useAthletes({ search: debouncedSearch, perPage: 20, caborId: caborId || '' });
  const athletes = athletesData?.data || [];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleAthlete = (athleteId) => {
    if (value.includes(athleteId)) {
      onChange(value.filter(id => id !== athleteId));
    } else {
      onChange([...value, athleteId]);
    }
  };

  const removeAthlete = (athleteId) => {
    onChange(value.filter(id => id !== athleteId));
  };

  // Resolve names for selected athletes from current data
  const selectedNames = value.map(id => {
    const ath = athletes.find(a => a.id === id);
    return ath ? ath.name : `Atlet #${id}`;
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-left focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none bg-white disabled:bg-slate-50 min-h-[42px]"
      >
        {value.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selectedNames.map((name, i) => (
              <span key={value[i]} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                {name}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeAthlete(value[i]); }} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-slate-400">Pilih Atlet...</span>
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
                  placeholder="Cari nama atlet..."
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
              ) : athletes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Tidak ditemukan</p>
              ) : (
                athletes.map(athlete => {
                  const selected = value.includes(athlete.id);
                  return (
                    <button
                      key={athlete.id}
                      type="button"
                      onClick={() => toggleAthlete(athlete.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                        selected ? 'bg-purple-50' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">{athlete.name}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {athlete.cabor?.name || 'Tanpa Cabor'}
                          {athlete.nik && ` • NIK: ${athlete.nik}`}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'
                      }`}>
                        {selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            {value.length > 0 && (
              <div className="p-2 border-t border-slate-100 text-xs text-slate-500 text-center">
                {value.length} atlet dipilih
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
