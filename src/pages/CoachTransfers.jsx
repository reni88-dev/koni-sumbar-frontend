import { useEffect, useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  History,
  Inbox,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { CoachTransferDetailModal } from '../components/coach-transfers/CoachTransferDetailModal';
import {
  transferStatusLabel,
  transferStatusStyle,
} from '../components/coach-transfers/transferPresentation';
import {
  useCoachTransfers,
  useCoachTransferSummary,
} from '../hooks/queries/useCoachTransfers';

const PER_PAGE = 15;

const tabs = [
  { id: 'inbox', label: 'Kotak Masuk', icon: Inbox },
  { id: 'outbox', label: 'Kotak Keluar', icon: Send },
  { id: 'history', label: 'Riwayat', icon: History },
];

const statuses = [
  '',
  'pending_destination',
  'pending_koni',
  'completed',
  'rejected_destination',
  'rejected_koni',
  'cancelled',
];

const emptyCopy = {
  inbox: {
    title: 'Tidak ada transfer yang menunggu tindakan',
    description: 'Pengajuan yang perlu Anda tinjau akan muncul di Kotak Masuk.',
  },
  outbox: {
    title: 'Belum ada pengajuan transfer keluar',
    description: 'Pengajuan dari organisasi Anda akan tampil di Kotak Keluar.',
  },
  history: {
    title: 'Riwayat transfer masih kosong',
    description: 'Transfer yang sudah diproses akan tersimpan di bagian Riwayat.',
  },
};

export function CoachTransfersPage() {
  const [box, setBox] = useState('inbox');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(() => ({
    box,
    status: box === 'inbox' ? undefined : status || undefined,
    search: debouncedSearch || undefined,
    page,
    per_page: PER_PAGE,
  }), [box, debouncedSearch, page, status]);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useCoachTransfers(filters);
  const { data: summary } = useCoachTransferSummary();

  const items = data?.data || [];
  const total = data?.total || 0;
  const lastPage = data?.last_page || 0;
  const currentPage = data?.current_page || page;
  const firstItem = total ? ((currentPage - 1) * PER_PAGE) + 1 : 0;
  const lastItem = total ? Math.min(currentPage * PER_PAGE, total) : 0;
  const hasActiveFilters = Boolean(searchInput || (box !== 'inbox' && status));
  const activeEmptyCopy = emptyCopy[box];

  const changeTab = (value) => {
    setBox(value);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setStatus('');
    setPage(1);
  };

  return (
    <DashboardLayout
      title="Transfer Pelatih"
      subtitle="Kelola perpindahan pelatih antar-KONI kabupaten/kota dengan alur persetujuan yang transparan."
    >
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="grid grid-cols-3 gap-1 border-b border-slate-100 bg-slate-50/80 p-1.5 sm:flex sm:gap-2 sm:p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = box === tab.id;
              const pendingCount = tab.id === 'inbox'
                ? summary?.pending_action_count || 0
                : 0;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => changeTab(tab.id)}
                  aria-pressed={isActive}
                  className={`relative inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 sm:min-w-36 sm:gap-2 sm:px-4 sm:text-sm ${
                    isActive
                      ? 'bg-white text-red-700 shadow-sm ring-1 ring-red-100'
                      : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{tab.label}</span>
                  {pendingCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className={`grid gap-3 p-4 ${box === 'inbox' ? 'sm:grid-cols-[minmax(0,1fr)_auto]' : 'sm:grid-cols-[minmax(0,1fr)_260px_auto]'}`}>
            <label className="relative block min-w-0">
              <span className="sr-only">Cari transfer pelatih</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari pelatih atau organisasi..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-500/20"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </label>

            {box !== 'inbox' && (
              <label className="block">
                <span className="sr-only">Filter status transfer</span>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                    setPage(1);
                  }}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                >
                  {statuses.map((value) => (
                    <option key={value} value={value}>
                      {value ? transferStatusLabel(value) : 'Semua status'}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800">
                {tabs.find((tab) => tab.id === box)?.label}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                {isFetching && !isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-red-600" aria-hidden="true" />
                    <span>Memperbarui data...</span>
                  </>
                ) : dataUpdatedAt ? (
                  <>
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Diperbarui {formatUpdatedTime(dataUpdatedAt)}</span>
                  </>
                ) : (
                  <span>Daftar pengajuan transfer pelatih</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              Segarkan
            </button>
          </div>
          {isError && items.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:px-5">
              <span>Data terbaru gagal dimuat. Daftar tersimpan masih ditampilkan.</span>
              <button
                type="button"
                onClick={() => refetch()}
                className="font-bold underline decoration-amber-400 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Coba lagi
              </button>
            </div>
          )}

          {isLoading ? (
            <TransferListSkeleton />
          ) : isError && !items.length ? (
            <StateMessage
              icon={RefreshCw}
              iconClassName="bg-red-50 text-red-600"
              title="Data transfer gagal dimuat"
              description="Periksa koneksi Anda, lalu coba muat ulang daftar transfer."
              actionLabel="Coba Lagi"
              onAction={() => refetch()}
              actionPending={isFetching}
            />
          ) : !items.length ? (
            <StateMessage
              icon={hasActiveFilters ? Search : Inbox}
              iconClassName="bg-slate-100 text-slate-400"
              title={hasActiveFilters ? 'Transfer tidak ditemukan' : activeEmptyCopy.title}
              description={hasActiveFilters
                ? 'Coba ubah kata kunci atau reset filter yang sedang digunakan.'
                : activeEmptyCopy.description}
              actionLabel={hasActiveFilters ? 'Reset Filter' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px]">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5">Pelatih</th>
                      <th className="px-5 py-3.5">Rute Organisasi</th>
                      <th className="px-5 py-3.5">Tanggal Efektif</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="transition-colors hover:bg-slate-50/80">
                        <td className="px-5 py-4 align-top">
                          <p className="font-bold text-slate-800">
                            {item.coach_name_snapshot || '-'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.cabor_name_snapshot || 'Cabor tidak tersedia'}
                          </p>
                        </td>
                        <td className="max-w-md px-5 py-4 align-top">
                          <OrganizationRoute item={item} />
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
                            {formatDate(item.effective_date)}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            Diajukan {formatDateTime(item.submitted_at)}
                          </p>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <TransferStatusBadge status={item.status} />
                        </td>
                        <td className="px-5 py-4 text-right align-top">
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 md:hidden">
                {items.map((item, index) => (
                  <Motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.15) }}
                    className="space-y-4 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800">
                          {item.coach_name_snapshot || '-'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.cabor_name_snapshot || 'Cabor tidak tersedia'}
                        </p>
                      </div>
                      <TransferStatusBadge status={item.status} compact />
                    </div>

                    <OrganizationRoute item={item} stacked />

                    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Tanggal Efektif
                          </p>
                          <p className="truncate text-sm font-semibold text-slate-700">
                            {formatDate(item.effective_date)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        aria-label={`Lihat detail transfer ${item.coach_name_snapshot || 'pelatih'}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-red-500/20 transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                      >
                        Detail
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </Motion.article>
                ))}
              </div>
            </>
          )}
        </section>
        {!isLoading && (!isError || items.length > 0) && total > 0 && (
          <nav
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
            aria-label="Paginasi transfer pelatih"
          >
            <p className="text-center text-sm text-slate-500 sm:text-left">
              Menampilkan <span className="font-bold text-slate-700">{firstItem}-{lastItem}</span> dari{' '}
              <span className="font-bold text-slate-700">{total}</span> transfer
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1 || isFetching}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
              <span className="min-w-24 text-center text-sm font-semibold text-slate-600">
                {currentPage} / {Math.max(lastPage, 1)}
              </span>
              <button
                type="button"
                disabled={currentPage >= lastPage || isFetching}
                onClick={() => setPage((value) => value + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </nav>
        )}
      </div>

      <CoachTransferDetailModal
        id={selectedId}
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
      />
    </DashboardLayout>
  );
}

function OrganizationRoute({ item, stacked = false }) {
  if (stacked) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
        <OrganizationName label="Asal" name={item.source_organization_name_snapshot} />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
        <OrganizationName
          label="Tujuan"
          name={item.destination_organization_name_snapshot}
          alignRight
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <span className="max-w-[180px] truncate">
        {item.source_organization_name_snapshot || '-'}
      </span>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="max-w-[180px] truncate font-bold text-slate-800">
        {item.destination_organization_name_snapshot || '-'}
      </span>
    </div>
  );
}

function OrganizationName({ label, name, alignRight = false }) {
  return (
    <div className={`min-w-0 ${alignRight ? 'text-right' : ''}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-700">
        {name || '-'}
      </p>
    </div>
  );
}

function TransferStatusBadge({ status, compact = false }) {
  return (
    <span className={`inline-flex max-w-48 items-center rounded-full border font-bold ${transferStatusStyle(status)} ${
      compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'
    }`}>
      <span className="truncate">{transferStatusLabel(status)}</span>
    </span>
  );
}

function StateMessage({
  icon,
  iconClassName,
  title,
  description,
  actionLabel,
  onAction,
  actionPending = false,
}) {
  const Icon = icon;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-80 flex-col items-center justify-center px-5 py-14 text-center"
    >
      <span className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconClassName}`}>
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={actionPending}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-500/20 transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          {actionPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {actionLabel}
        </button>
      )}
    </Motion.div>
  );
}

function TransferListSkeleton() {
  return (
    <div className="divide-y divide-slate-100" aria-label="Memuat daftar transfer">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="grid animate-pulse gap-4 p-5 md:grid-cols-[1.1fr_1.5fr_1fr_1fr_auto]">
          <div className="space-y-2">
            <div className="h-4 w-36 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
          <div className="h-9 rounded-xl bg-slate-100" />
          <div className="h-9 rounded-xl bg-slate-100" />
          <div className="h-7 w-32 rounded-full bg-slate-100" />
          <div className="h-9 w-20 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatUpdatedTime(value) {
  return new Date(value).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
