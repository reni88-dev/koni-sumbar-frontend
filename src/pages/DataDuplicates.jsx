import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  RefreshCw,
  Save,
  Search,
  ShieldQuestion,
  Sparkles,
  UserRoundSearch,
  UsersRound,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { usePermission } from '../hooks/usePermission';
import {
  useDataDuplicates,
  useRefreshDataDuplicates,
  useReviewDataDuplicate,
} from '../hooks/queries/useDataAnalysis';

const ENTITY_TABS = [
  { key: 'athlete', label: 'Atlet', icon: UserRoundSearch },
  { key: 'coach', label: 'Pelatih', icon: ShieldQuestion },
  { key: 'dual_role', label: 'Peran Ganda', icon: UsersRound },
];

const REVIEW_OPTIONS = [
  { value: 'needs_review', label: 'Perlu Review' },
  { value: 'same_person', label: 'Orang yang Sama' },
  { value: 'different_person', label: 'Orang Berbeda' },
];

function apiErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

function number(value) {
  return Number(value || 0).toLocaleString('id-ID');
}

function confidenceStyle(confidence) {
  return confidence === 'high'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';
}

function reviewLabel(status, entity) {
  if (status === 'same_person') {
    return entity === 'dual_role' ? 'Peran Ganda Terkonfirmasi' : 'Duplikat Terkonfirmasi';
  }
  if (status === 'different_person') return 'Orang Berbeda';
  if (status === 'needs_review') return 'Perlu Review';
  return 'Belum Direview';
}

function reviewStyle(status) {
  if (status === 'same_person') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'different_person') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (status === 'needs_review') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function matchStyle(status) {
  if (status === 'same') return 'border-emerald-200 bg-emerald-50/70';
  if (status === 'similar' || status === 'swapped' || status === 'near') return 'border-amber-200 bg-amber-50/70';
  if (status === 'missing') return 'border-slate-200 bg-slate-50';
  if (status === 'conflict') return 'border-red-200 bg-red-50/70';
  return 'border-slate-200 bg-white';
}

function fieldValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

function genderLabel(value) {
  if (value === 'male') return 'Laki-laki';
  if (value === 'female') return 'Perempuan';
  return fieldValue(value);
}

function RecordPanel({ record, matchDetails, canOpen, onOpen }) {
  const fields = [
    { key: 'name', label: 'Nama', value: record.name, match: matchDetails.name },
    { key: 'nik', label: 'NIK', value: record.nik_display, match: matchDetails.nik },
    { key: 'birth_date', label: 'Tanggal lahir', value: record.birth_date, match: matchDetails.birth_date },
    { key: 'gender', label: 'Gender', value: genderLabel(record.gender) },
    { key: 'cabor', label: 'Cabang olahraga', value: record.cabor_name },
    { key: 'organization', label: 'Organisasi', value: record.organization_name },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {record.entity_type === 'athlete' ? 'Atlet' : 'Pelatih'} #{record.id}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-800">{record.name}</h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${record.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {record.is_active ? 'Aktif' : 'Tidak aktif'}
        </span>
      </div>

      <div className="space-y-2.5">
        {fields.map((field) => (
          <div key={field.key} className={`rounded-xl border p-3 ${matchStyle(field.match?.status)}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500">{field.label}</p>
              {field.key === 'nik' && record.nik_visibility !== 'full' && record.nik_visibility !== 'missing' && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {record.nik_visibility === 'masked' ? 'Disamarkan' : 'Tidak tersedia'}
                </span>
              )}
            </div>
            <p className="mt-1 break-words text-sm font-semibold text-slate-800">{fieldValue(field.value)}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{record.has_linked_user ? 'Akun user terhubung' : 'Belum terhubung akun user'}</span>
        {canOpen && (
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 font-semibold text-red-600 hover:text-red-700"
          >
            Buka data
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewEditor({ candidate, canReview }) {
  const initialStatus = candidate.review?.stale
    ? ''
    : (candidate.review?.stored_status || (candidate.review?.status === 'unreviewed' ? '' : candidate.review?.status) || '');
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(candidate.review?.note || '');
  const [feedback, setFeedback] = useState('');
  const mutation = useReviewDataDuplicate();

  if (!canReview) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Anda dapat meninjau hasil, tetapi tidak memiliki izin untuk mengubah status review.
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setFeedback('');
    if (!status) {
      setFeedback('Pilih status review terlebih dahulu.');
      return;
    }
    try {
      await mutation.mutateAsync({ pair_key: candidate.pair_key, status, note: note.trim() });
      setFeedback('Review berhasil disimpan.');
    } catch (error) {
      setFeedback(apiErrorMessage(error, 'Review gagal disimpan. Silakan coba lagi.'));
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto] lg:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Status review</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          >
            <option value="">Pilih status</option>
            {REVIEW_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value === 'same_person'
                  ? (candidate.entity === 'dual_role' ? 'Peran Ganda Terkonfirmasi' : 'Duplikat Terkonfirmasi')
                  : option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
            Catatan opsional
            <span className="font-normal text-slate-400">{note.length}/500</span>
          </span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 500))}
            placeholder="Contoh: diverifikasi dari dokumen sumber"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {mutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan
        </button>
      </div>
      {feedback && (
        <p className={`mt-3 text-sm ${mutation.isError ? 'text-red-600' : 'text-emerald-600'}`}>{feedback}</p>
      )}
    </form>
  );
}

function CandidateCard({ candidate, canReview, canOpenAthlete, canOpenCoach }) {
  const navigate = useNavigate();
  const canOpen = (record) => record.entity_type === 'athlete' ? canOpenAthlete : canOpenCoach;
  const openRecord = (record) => {
    const path = record.entity_type === 'athlete' ? '/atlet' : '/pelatih';
    navigate(`${path}?search=${encodeURIComponent(record.name)}`);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${confidenceStyle(candidate.confidence)}`}>
            Skor {candidate.score} · {candidate.confidence === 'high' ? 'Tinggi' : 'Suspek'}
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${reviewStyle(candidate.review?.status)}`}>
            {reviewLabel(candidate.review?.status, candidate.entity)}
          </span>
          {candidate.review?.stale && (
            <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              <CircleAlert className="h-3.5 w-3.5" />
              Review kedaluwarsa
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">{candidate.pair_key}</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {candidate.reasons?.map((reason) => (
          <span key={reason} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            {reason}
          </span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecordPanel
          record={candidate.record_a}
          matchDetails={candidate.match_details}
          canOpen={canOpen(candidate.record_a)}
          onOpen={() => openRecord(candidate.record_a)}
        />
        <RecordPanel
          record={candidate.record_b}
          matchDetails={candidate.match_details}
          canOpen={canOpen(candidate.record_b)}
          onOpen={() => openRecord(candidate.record_b)}
        />
      </div>

      <div className="mt-5">
        <ReviewEditor candidate={candidate} canReview={canReview} />
      </div>
    </article>
  );
}

function MetricCard({ label, value, icon, tone }) {
  const IconComponent = icon;
  const tones = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{number(value)}</p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="space-y-5">
      {[1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-5 h-6 w-56 rounded bg-slate-200" />
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((panel) => (
              <div key={panel} className="space-y-3 rounded-xl border border-slate-100 p-4">
                <div className="h-5 w-2/3 rounded bg-slate-200" />
                {[1, 2, 3, 4].map((row) => <div key={row} className="h-14 rounded bg-slate-100" />)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DataDuplicatesPage() {
  const { can } = usePermission();
  const canReview = can('data_duplicates.review');
  const [entity, setEntity] = useState('athlete');
  const [confidence, setConfidence] = useState('all');
  const [reviewStatus, setReviewStatus] = useState('all');
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshMessage, setRefreshMessage] = useState('');
  const filters = { entity, confidence, reviewStatus, search, page, perPage: 20 };
  const query = useDataDuplicates(filters);
  const refresh = useRefreshDataDuplicates();
  const counts = query.data?.counts || {};

  const changeEntity = (value) => {
    setEntity(value);
    setPage(1);
  };

  const rerun = async () => {
    setRefreshMessage('');
    try {
      const result = await refresh.mutateAsync();
      const total = Object.values(result.counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      setRefreshMessage(`Analisis ulang selesai. ${number(total)} kandidat ditemukan.`);
    } catch (error) {
      setRefreshMessage(apiErrorMessage(error, 'Analisis ulang gagal. Silakan coba lagi.'));
    }
  };

  return (
    <DashboardLayout
      title="Analisis Duplikat"
      subtitle="Tinjau kemiripan data tanpa mengubah atau menggabungkan data utama."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Confidence tinggi" value={counts.high} icon={BadgeCheck} tone="red" />
          <MetricCard label="Kandidat suspek" value={counts.suspect} icon={AlertCircle} tone="amber" />
          <MetricCard label="Belum direview" value={counts.unreviewed} icon={CalendarDays} tone="blue" />
          <MetricCard label="Terkonfirmasi" value={counts.same_person} icon={CheckCircle2} tone="emerald" />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1">
              {ENTITY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => changeEntity(tab.key)}
                  className={`inline-flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${entity === tab.key ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] text-slate-600">
                    {number(counts.by_entity?.[tab.key])}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={rerun}
              disabled={refresh.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refresh.isPending ? 'animate-spin' : ''}`} />
              Analisis Ulang
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_190px_210px_auto]">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(searchDraft.trim());
                setPage(1);
              }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Cari nama pada pasangan..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </form>
            <select
              value={confidence}
              onChange={(event) => { setConfidence(event.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">Semua confidence</option>
              <option value="high">Tinggi</option>
              <option value="suspect">Suspek</option>
            </select>
            <select
              value={reviewStatus}
              onChange={(event) => { setReviewStatus(event.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="all">Semua status review</option>
              <option value="unreviewed">Belum direview</option>
              <option value="needs_review">Perlu review</option>
              <option value="same_person">Orang yang sama</option>
              <option value="different_person">Orang berbeda</option>
            </select>
            <button
              type="button"
              onClick={() => { setSearch(searchDraft.trim()); setPage(1); }}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Terapkan
            </button>
          </div>

          {refreshMessage && (
            <p className={`mt-3 text-sm ${refresh.isError ? 'text-red-600' : 'text-emerald-600'}`}>{refreshMessage}</p>
          )}
        </section>

        {query.isLoading ? (
          <LoadingCards />
        ) : query.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-3 font-bold text-red-800">Data analisis gagal dimuat</h2>
            <p className="mt-1 text-sm text-red-600">{apiErrorMessage(query.error, 'Terjadi kesalahan saat memuat kandidat.')}</p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
          </div>
        ) : query.data?.data?.length ? (
          <div className="space-y-5">
            {query.data.data.map((candidate) => (
              <CandidateCard
                key={`${candidate.pair_key}-${candidate.review?.reviewed_at || candidate.review?.status}-${candidate.review?.stale}-${candidate.record_a?.updated_at}-${candidate.record_b?.updated_at}`}
                candidate={candidate}
                canReview={canReview}
                canOpenAthlete={can('athletes.view')}
                canOpenCoach={can('coaches.view')}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">Tidak ada kandidat</h2>
            <p className="mt-1 text-sm text-slate-500">Tidak ada pasangan yang cocok dengan kategori dan filter saat ini.</p>
          </div>
        )}

        {query.data && query.data.last_page > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row">
            <p className="text-sm text-slate-500">
              Halaman {query.data.current_page} dari {query.data.last_page} · {number(query.data.total)} kandidat
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1 || query.isFetching}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </button>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(query.data.last_page, value + 1))}
                disabled={page >= query.data.last_page || query.isFetching}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Berikutnya
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
