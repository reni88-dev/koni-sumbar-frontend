import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ExternalLink, Eye, Loader2, RefreshCw, Search, X } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { EvidenceFileList } from '../components/athletes/external-achievements/EvidenceFileList';
import {
  CATEGORY_LABELS, LEVEL_LABELS, STATUS_META, formatPeriod, formatResult,
} from '../components/athletes/external-achievements/externalAchievementUtils';
import { useCaborsAll } from '../hooks/queries/useCabors';
import {
  getExternalAchievementError,
  useDecideExternalAchievement,
  useExternalAchievementVerifications,
} from '../hooks/queries/useExternalAchievements';

const PER_PAGE = 15;

const tabs = [
  { id: 'submitted', label: 'Menunggu', empty: 'Tidak ada prestasi yang menunggu verifikasi.' },
  { id: 'approved', label: 'Disetujui', empty: 'Belum ada prestasi yang disetujui.' },
  { id: 'rejected', label: 'Ditolak', empty: 'Belum ada prestasi yang ditolak.' },
];

const selectClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100';

const formatDateTime = (value) => (
  value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
);

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="break-words text-sm font-medium text-slate-800">{value || '-'}</dd>
    </div>
  );
}

function VerificationModal({ item, onClose }) {
  const [reasonAction, setReasonAction] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const decide = useDecideExternalAchievement();
  const meta = STATUS_META[item.status] || STATUS_META.draft;

  const submit = async (action) => {
    if (decide.isPending) return;
    if (action !== 'approve' && !reason.trim()) {
      setError('Alasan wajib diisi');
      return;
    }
    setError('');
    try {
      await decide.mutateAsync({ id: item.id, action, reason: reason.trim() });
      onClose();
    } catch (decideError) {
      setError(getExternalAchievementError(decideError, 'Gagal memproses verifikasi'));
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="verification-title" className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <h3 id="verification-title" className="break-words text-lg font-bold text-slate-800">{item.event_name}</h3>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${meta.className}`}>{meta.label}</span>
          </div>
          <button type="button" onClick={onClose} disabled={decide.isPending} aria-label="Tutup" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 overflow-y-auto p-5">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Detail label="Atlet" value={item.athlete_name} />
            <Detail label="Cabang Olahraga" value={item.cabor_name} />
            <Detail label="Organisasi" value={item.organization_name} />
            <Detail label="Hasil" value={formatResult(item)} />
            <Detail label="Nomor / Kelas" value={item.competition_class} />
            <Detail label="Kategori" value={CATEGORY_LABELS[item.category]} />
            <Detail label="Tingkat" value={LEVEL_LABELS[item.level]} />
            <Detail label="Tanggal" value={formatPeriod(item)} />
            <Detail label="Lokasi" value={item.location} />
            <Detail label="Penyelenggara" value={item.organizer} />
            <Detail label="Diajukan" value={formatDateTime(item.submitted_at)} />
            {item.verified_at && <Detail label="Diputuskan" value={`${formatDateTime(item.verified_at)}${item.verified_by_name ? ` oleh ${item.verified_by_name}` : ''}`} />}
          </dl>
          {item.notes && <Detail label="Catatan" value={item.notes} />}
          {item.rejection_reason && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"><strong>Alasan ditolak:</strong> {item.rejection_reason}</p>}
          {item.evidence_url && (
            <a href={item.evidence_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm font-semibold text-red-600 hover:underline">
              <ExternalLink className="h-4 w-4 shrink-0" />{item.evidence_url}
            </a>
          )}
          <div>
            <h4 className="mb-2 text-sm font-bold text-slate-800">File Bukti</h4>
            <EvidenceFileList files={item.files} fileUrl={(file) => `/api/external-achievements/${item.id}/files/${file.id}`} />
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 p-5">
          {reasonAction && (
            <div>
              <label htmlFor="verification-reason" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Alasan {reasonAction === 'reject' ? 'penolakan' : 'pencabutan'} <span className="text-red-500">*</span>
              </label>
              <textarea id="verification-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={2000} rows={3} placeholder="Jelaskan yang perlu diperbaiki" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
            </div>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            {reasonAction ? (
              <>
                <button type="button" onClick={() => { setReasonAction(''); setError(''); }} disabled={decide.isPending} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Batal</button>
                <button type="button" onClick={() => submit(reasonAction)} disabled={decide.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  {decide.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {reasonAction === 'reject' ? 'Tolak Prestasi' : 'Cabut Persetujuan'}
                </button>
              </>
            ) : (
              <>
                {item.status === 'submitted' && (
                  <>
                    <button type="button" onClick={() => setReasonAction('reject')} disabled={decide.isPending} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Tolak</button>
                    <button type="button" onClick={() => submit('approve')} disabled={decide.isPending} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                      {decide.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Setujui
                    </button>
                  </>
                )}
                {item.status === 'approved' && (
                  <button type="button" onClick={() => setReasonAction('revoke')} className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cabut Persetujuan</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ExternalAchievementVerificationPage() {
  const [status, setStatus] = useState('submitted');
  const [level, setLevel] = useState('');
  const [caborId, setCaborId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { data: cabors = [] } = useCaborsAll();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const query = useExternalAchievementVerifications({ status, level, caborId, search, page, perPage: PER_PAGE });
  const items = query.data?.data || [];
  const total = query.data?.total || 0;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const activeTab = tabs.find((tab) => tab.id === status);

  // After a decision the last page can become empty; step back during render.
  if (query.data && page > lastPage) setPage(lastPage);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const viewButton = (item) => (
    <button type="button" onClick={() => setSelected(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
      <Eye className="h-3.5 w-3.5" />{status === 'submitted' ? 'Periksa' : 'Detail'}
    </button>
  );

  return (
    <DashboardLayout title="Verifikasi Prestasi" subtitle="Prestasi atlet dari event di luar Sirimau (PON, POPDA, Kejurnas, dan lainnya)">
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b border-slate-100">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => changeFilter(setStatus)(tab.id)} className={`min-w-max px-5 py-3.5 text-sm font-semibold ${status === tab.id ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} aria-label="Cari atlet atau event" placeholder="Cari nama atlet atau event" className={`${selectClass} w-full pl-9`} />
          </div>
          <select aria-label="Tingkat" value={level} onChange={(event) => changeFilter(setLevel)(event.target.value)} className={selectClass}>
            <option value="">Semua tingkat</option>
            {Object.entries(LEVEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Cabang olahraga" value={caborId} onChange={(event) => changeFilter(setCaborId)(event.target.value)} className={`${selectClass} md:max-w-xs`}>
            <option value="">Semua cabor</option>
            {cabors.map((cabor) => <option key={cabor.id} value={cabor.id}>{cabor.name}</option>)}
          </select>
        </div>

        {query.isLoading ? (
          <p className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Memuat data...</p>
        ) : query.isError ? (
          <div className="p-10 text-center text-sm text-red-700">
            <p>{getExternalAchievementError(query.error, 'Antrean verifikasi gagal dimuat.')}</p>
            <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 disabled:opacity-50">
              <RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`} />Coba Lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">{search || level || caborId ? 'Tidak ada data yang cocok dengan filter.' : activeTab.empty}</p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {items.map((item) => (
                <li key={item.id} className="space-y-1 p-4">
                  <p className="text-sm font-bold text-slate-800">{item.athlete_name}</p>
                  <p className="text-sm text-slate-700">{formatResult(item)} — {item.event_name}</p>
                  <p className="text-xs text-slate-500">{item.cabor_name} · {formatPeriod(item)} · {item.file_count} file</p>
                  <div className="pt-1">{viewButton(item)}</div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Atlet</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Hasil</th>
                    <th className="px-4 py-3">{status === 'submitted' ? 'Diajukan' : 'Diputuskan'}</th>
                    <th className="px-4 py-3"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{item.athlete_name}</p>
                        <p className="text-xs text-slate-500">{[item.cabor_name, item.organization_name].filter(Boolean).join(' · ')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{item.event_name}</p>
                        <p className="text-xs text-slate-500">{LEVEL_LABELS[item.level]} · {formatPeriod(item)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{formatResult(item)}</p>
                        <p className="text-xs text-slate-500">{item.competition_class || '-'} · {item.file_count} file</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(status === 'submitted' ? item.submitted_at : item.verified_at)}</td>
                      <td className="px-4 py-3 text-right">{viewButton(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {total > PER_PAGE && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm text-slate-600">
            <span>Halaman {page} dari {lastPage} · {total} data</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} aria-label="Halaman sebelumnya" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => setPage(page + 1)} disabled={page >= lastPage} aria-label="Halaman berikutnya" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </div>

      {selected && <VerificationModal key={selected.id} item={selected} onClose={() => setSelected(null)} />}
    </DashboardLayout>
  );
}
