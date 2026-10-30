import { useEffect, useState } from 'react';
import { Award, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { CertificateDownloadButton } from '../components/certificates/CertificateDownloadButton';
import {
  fetchAdminCertificatePdf,
  useAdminCertificates,
  usePorprovCertificateEvents,
} from '../hooks/queries/usePorprovCertificates';
import { certificateBadgeClass, certificateFilename } from '../lib/certificate';

const PAGE_SIZE = 20;
const TABS = [
  { type: 'athlete', label: 'Atlet' },
  { type: 'official', label: 'Official' },
];

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const headerClass = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500';

// Daftar dan cetak sertifikat Porprov untuk admin; backend membatasi data sesuai scope akun.
export function PorprovCertificatesPage() {
  const eventsQuery = usePorprovCertificateEvents();
  const events = eventsQuery.data || [];
  const [selectedEventId, setSelectedEventId] = useState('');
  const [type, setType] = useState('athlete');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());

  // Event terbaru (urutan dari backend) menjadi pilihan awal.
  const eventId = selectedEventId || (events[0]?.id ? String(events[0].id) : '');
  const query = useAdminCertificates(eventId, { type, search: debouncedSearch, page, limit: PAGE_SIZE });
  const isOfficial = type === 'official';
  const rows = query.data?.data || [];
  const lastPage = query.data?.last_page || 1;

  const switchTab = (next) => {
    setType(next);
    setPage(1);
  };

  return (
    <DashboardLayout title="Sertifikat Porprov" subtitle="Cari dan unduh sertifikat atlet dan official sesuai cakupan akun Anda">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex self-start rounded-xl border border-slate-200 bg-white p-1" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.type}
                type="button"
                role="tab"
                aria-selected={type === tab.type}
                onClick={() => switchTab(tab.type)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${type === tab.type ? 'bg-red-50 text-red-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              aria-label="Event"
              value={eventId}
              onChange={(event) => { setSelectedEventId(event.target.value); setPage(1); }}
              disabled={events.length === 0}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              {events.length === 0 && <option value="">Belum ada event</option>}
              {events.map((event) => (
                <option key={event.id} value={event.id}>{event.name}{event.year ? ` ${event.year}` : ''}</option>
              ))}
            </select>
            <label className="relative block w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Cari nama atau kontingen"
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
              />
            </label>
          </div>
        </div>

        {eventsQuery.isLoading || (query.isLoading && !!eventId) ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
          </div>
        ) : eventsQuery.isError || query.isError ? (
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="font-semibold text-amber-800">Daftar sertifikat gagal dimuat.</p>
            <p className="mt-1 text-sm text-amber-700">
              {query.error?.response?.status === 403 ? 'Akun Anda tidak berhak melihat sertifikat.' : 'Periksa koneksi Anda lalu coba kembali.'}
            </p>
            <button
              type="button"
              onClick={() => (eventsQuery.isError ? eventsQuery.refetch() : query.refetch())}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
          </div>
        ) : !eventId ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Belum ada event Porprov.</p>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <Award className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 font-semibold text-slate-700">Belum ada sertifikat</h3>
            <p className="mt-1 text-sm text-slate-500">Sertifikat muncul setelah pendaftaran disahkan dan hasil event dipublikasikan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className={headerClass}>Nama</th>
                  <th className={headerClass}>Kontingen</th>
                  <th className={headerClass}>Cabang Olahraga</th>
                  <th className={headerClass}>{isOfficial ? 'Jabatan' : 'Kelas'}</th>
                  {!isOfficial && <th className={headerClass}>Sertifikat</th>}
                  <th className={headerClass}>Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {rows.map((row) => {
                  const id = isOfficial ? row.official_id : row.participant_id;
                  return (
                    <tr key={`${type}-${id}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.recipient_name}</td>
                      <td className="px-4 py-3">{row.contingent_name}</td>
                      <td className="px-4 py-3">{row.cabor_name}</td>
                      <td className="px-4 py-3">
                        {isOfficial ? <span className={certificateBadgeClass(0)}>{row.title}</span> : row.class_name}
                      </td>
                      {!isOfficial && (
                        <td className="px-4 py-3"><span className={certificateBadgeClass(row.medal_rank)}>{row.title}</span></td>
                      )}
                      <td className="px-4 py-3">
                        <CertificateDownloadButton
                          loadBlob={() => fetchAdminCertificatePdf(isOfficial ? 'official' : 'athlete', id)}
                          filename={certificateFilename(row)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {lastPage > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Total {query.data?.total ?? 0} sertifikat</p>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Halaman sebelumnya" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-sm font-medium">{query.data?.page ?? page} / {lastPage}</span>
              <button type="button" aria-label="Halaman berikutnya" onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
