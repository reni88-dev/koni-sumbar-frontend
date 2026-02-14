import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

/**
 * SearchableSelect — a dropdown with inline search filtering.
 * Props:
 *  - options: [{ id, name, code? }]
 *  - value: currently selected id (string or number)
 *  - onChange(value): called with the selected id as string
 *  - placeholder: text shown when nothing selected
 *  - disabled: boolean
 *  - className: extra wrapper classes
 */
export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  disabled = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Selected option label
  const selected = options.find(o => String(o.id) === String(value));

  // Filter options
  const filtered = search
    ? options.filter(o =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        (o.code && o.code.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (id) => {
    onChange(String(id));
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-left flex items-center justify-between gap-2 bg-white ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
        }`}
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? selected.name + (selected.code ? ` (${selected.code})` : '') : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 rounded"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                placeholder="Cari..."
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                Tidak ditemukan
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center justify-between ${
                    String(option.id) === String(value)
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-slate-700'
                  }`}
                >
                  <span>{option.name}{option.code ? ` (${option.code})` : ''}</span>
                  {String(option.id) === String(value) && (
                    <span className="text-red-600 text-xs">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
