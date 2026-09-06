import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { Search, Loader2, ChevronDown, Check } from 'lucide-react';
import { useCoach, useInfiniteCoaches } from '../../hooks/queries/useCoaches';
import { flattenCoachPages } from '../../hooks/queries/coachQueryParams';

function coachCaborName(coach) {
  return coach?.cabor?.display_name || coach?.cabor?.name || '';
}

function coachOrganizationName(coach) {
  return coach?.organization?.name || '';
}

function coachMetadata(coach) {
  return [
    coach?.nik ? `NIK: ${coach.nik}` : '',
    coachCaborName(coach),
    coachOrganizationName(coach),
  ].filter(Boolean);
}

export function CoachSearchDropdown({
  value,
  onChange,
  disabled = false,
  caborId = '',
  requireCabor = false,
  placeholder = 'Pilih Pelatih...',
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const ref = useRef(null);
  const canLoadOptions = open && !disabled && (!requireCabor || Boolean(caborId));

  const {
    data: coachesData,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCoaches({
    search: debouncedSearch,
    caborId,
    isActive: true,
    perPage: 20,
    enabled: canLoadOptions,
  });
  const { data: selectedCoachData, isLoading: isSelectedCoachLoading } = useCoach(value);
  const coaches = flattenCoachPages(coachesData);
  const selectedCoach = value
    ? coaches.find((coach) => String(coach.id) === String(value)) || selectedCoachData
    : null;
  const total = Number(coachesData?.pages?.[0]?.total) || coaches.length;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (coach) => {
    onChange(coach.id, coach);
    setOpen(false);
    setSearch('');
    setDebouncedSearch('');
  };

  const handleOptionsScroll = (event) => {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 48;
    if (isNearBottom && hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  const selectedMetadata = coachMetadata(selectedCoach);
  const resolvedPlaceholder = requireCabor && !caborId
    ? 'Pilih cabor terlebih dahulu'
    : placeholder;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-left focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none bg-white disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        {value ? (
          <span className="min-w-0">
            <span className="block font-medium truncate">
              {selectedCoach?.name || (isSelectedCoachLoading ? 'Memuat pelatih...' : `Pelatih #${value}`)}
            </span>
            {selectedMetadata.length > 0 && (
              <span className="block text-xs text-slate-400 truncate mt-0.5">
                {selectedMetadata.join(' • ')}
              </span>
            )}
          </span>
        ) : (
          <span className="text-slate-400 truncate">{resolvedPlaceholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <Motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full min-w-[18rem] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setOpen(false);
                  }}
                  placeholder="Cari nama / NIK pelatih..."
                  aria-label="Cari pelatih"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                  autoFocus
                />
              </div>
              {!isLoading && !isError && (
                <p className="px-1 pt-2 text-[11px] text-slate-400">
                  Menampilkan {coaches.length} dari {total} pelatih
                </p>
              )}
            </div>
            <div
              role="listbox"
              aria-label="Daftar pelatih"
              className="max-h-60 overflow-y-auto overscroll-contain"
              onScroll={handleOptionsScroll}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : isError ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-sm text-red-600">Gagal memuat daftar pelatih.</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-2 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : coaches.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Pelatih tidak ditemukan</p>
              ) : (
                <>
                  {coaches.map((coach) => {
                    const metadata = coachMetadata(coach);
                    const isSelected = String(value) === String(coach.id);
                    return (
                      <button
                        key={coach.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelect(coach)}
                        className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 ${
                          isSelected ? 'bg-red-50' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-slate-800 truncate">{coach.name}</p>
                          {metadata.length > 0 && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{metadata.join(' • ')}</p>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-red-600 flex-shrink-0" />}
                      </button>
                    );
                  })}
                  {isFetchingNextPage && (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  )}
                  {hasNextPage && !isFetchingNextPage && (
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      className="w-full px-4 py-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Muat pelatih berikutnya
                    </button>
                  )}
                </>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
