import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const DEFAULT_MENU_HEIGHT = 252;
const SEARCH_AREA_HEIGHT = 58;

function findVerticalScrollParent(element) {
  let parent = element?.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (/(auto|scroll|overlay)/.test(overflowY)) return parent;
    parent = parent.parentElement;
  }

  return null;
}

/**
 * SearchableSelect — a dropdown with inline search filtering.
 * Props:
 *  - options: [{ id, name, code? }]
 *  - value: currently selected id (string or number)
 *  - onChange(value): called with the selected id as string
 *  - placeholder: text shown when nothing selected
 *  - disabled: boolean
 *  - className: extra wrapper classes
 *  - dropdownPlacement: "bottom", "top", or "auto"
 */
export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Pilih...',
  disabled = false,
  className = '',
  dropdownPlacement = 'bottom',
  name,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const [menuLayout, setMenuLayout] = useState({
    placement: 'bottom',
    maxHeight: DEFAULT_MENU_HEIGHT,
  });

  // Selected option label
  const selected = options.find(o => String(o.id) === String(value));

  // Filter options
  const filtered = search
    ? options.filter(o =>
        (o.display_name || o.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.code && o.code.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  const labelFor = (option) => option ? (option.display_name || option.name || '') + (option.code ? ` (${option.code})` : '') : '';

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      const clickedTrigger = containerRef.current?.contains(e.target);
      const clickedMenu = menuRef.current?.contains(e.target);

      if (!clickedTrigger && !clickedMenu) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keep auto-positioned menus inside the visible part of a scrollable modal/page.
  useLayoutEffect(() => {
    if (!isOpen || dropdownPlacement !== 'auto' || !containerRef.current) return undefined;

    const scrollParent = findVerticalScrollParent(containerRef.current);
    const updateMenuLayout = () => {
      if (!containerRef.current) return;

      const triggerRect = containerRef.current.getBoundingClientRect();
      const boundaryRect = scrollParent?.getBoundingClientRect();
      const boundaryTop = Math.max(0, boundaryRect?.top ?? 0);
      const boundaryBottom = Math.min(window.innerHeight, boundaryRect?.bottom ?? window.innerHeight);
      const spaceAbove = Math.max(0, triggerRect.top - boundaryTop - 8);
      const spaceBelow = Math.max(0, boundaryBottom - triggerRect.bottom - 8);
      const placement = spaceBelow >= DEFAULT_MENU_HEIGHT || spaceBelow >= spaceAbove
        ? 'bottom'
        : 'top';
      const availableSpace = placement === 'bottom' ? spaceBelow : spaceAbove;
      const maxHeight = Math.max(112, Math.min(DEFAULT_MENU_HEIGHT, Math.floor(availableSpace)));

      setMenuLayout((current) => (
        current.placement === placement && current.maxHeight === maxHeight
          ? current
          : { placement, maxHeight }
      ));
    };

    updateMenuLayout();
    scrollParent?.addEventListener('scroll', updateMenuLayout, { passive: true });
    window.addEventListener('resize', updateMenuLayout);

    return () => {
      scrollParent?.removeEventListener('scroll', updateMenuLayout);
      window.removeEventListener('resize', updateMenuLayout);
    };
  }, [dropdownPlacement, isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isOpen]);

  const resolvedPlacement = dropdownPlacement === 'auto'
    ? menuLayout.placement
    : dropdownPlacement;
  const optionListMaxHeight = dropdownPlacement === 'auto'
    ? Math.max(48, menuLayout.maxHeight - SEARCH_AREA_HEIGHT)
    : undefined;

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
        name={name}
        data-field={name}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none text-left flex items-center justify-between gap-2 bg-white transition-[border-color,box-shadow] ${
          isOpen ? 'border-red-400 ring-4 ring-red-50 shadow-sm' : 'border-slate-200'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
        }`}
      >
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? labelFor(selected) : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-slate-100 rounded"
            >
              <X className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden ${
            resolvedPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={dropdownPlacement === 'auto' ? { maxHeight: menuLayout.maxHeight } : undefined}
        >
          {/* Search input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                    setSearch('');
                  }
                }}
                aria-label={`Cari ${placeholder}`}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                placeholder="Cari..."
              />
            </div>
          </div>

          {/* Options list */}
          <div
            role="listbox"
            aria-label={placeholder}
            className="max-h-48 overflow-y-auto overscroll-contain"
            style={optionListMaxHeight ? { maxHeight: optionListMaxHeight } : undefined}
          >
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
                  role="option"
                  aria-selected={String(option.id) === String(value)}
                  className={`w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center justify-between ${
                    String(option.id) === String(value)
                      ? 'bg-red-50 text-red-700 font-medium'
                      : 'text-slate-700'
                  }`}
                >
                  <span>{labelFor(option)}</span>
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
