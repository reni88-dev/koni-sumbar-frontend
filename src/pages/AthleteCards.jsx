import { useMemo, useState } from 'react';
import { CalendarDays, CreditCard, Loader2, Printer, Search } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { AthleteIdCardBack, AthleteIdCardFront } from '../components/athletes/AthleteIdCard';
import { formatCardDate } from '../components/athletes/athleteCardUtils';
import {
  useAthleteCardBatch,
  useAthleteCardSettings,
  useUpdateAthleteCardSettings,
} from '../hooks/queries/useAthleteCards';
import { useCaborsAll } from '../hooks/queries/useCabors';
import { useOrganizationsAll } from '../hooks/queries/useOrganizations';

const MAX_BATCH = 500;
const SELECT_CLASS =
  'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

const SOURCE_LABEL = {
  database: 'Diatur dari menu ini',
  env: 'Nilai bawaan server (belum diatur dari menu)',
  none: 'Belum diatur',
};

function settingsErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 403) return 'Hanya pengguna dengan izin "Atur Tanggal Berlaku ID Card" yang dapat mengubah tanggal.';
  if (status === 400) return 'Tanggal tidak valid.';
  return error?.response?.data?.message || error?.response?.data?.error || 'Gagal menyimpan tanggal berlaku.';
}

function ValidUntilPanel({ settings, isLoading, isError }) {
  const updateMutation = useUpdateAthleteCardSettings();
  const [draft, setDraft] = useState(null);
  const value = draft ?? settings?.valid_until ?? '';
  const dirty = draft !== null && draft !== (settings?.valid_until ?? '');
  const canEdit = Boolean(settings?.can_edit);

  const save = (next) => {
    updateMutation.mutate(next, { onSuccess: () => setDraft(null) });
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <CalendarDays className="h-4 w-4 text-red-600" aria-hidden="true" /> Tanggal berlaku kartu (Berlaku s.d.)
          </h2>
          {isLoading ? (
            <p className="mt-1 text-xs text-slate-500">Memuat...</p>
          ) : isError ? (
            <p className="mt-1 text-xs text-red-600">Pengaturan tanggal gagal dimuat.</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              {settings?.valid_until ? formatCardDate(settings.valid_until) : '-'} - {SOURCE_LABEL[settings?.source] || SOURCE_LABEL.none}.
              Satu tanggal untuk semua kartu; halaman publik selalu memakai tanggal terkini.
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Tanggal berlaku kartu"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              value={value}
              onChange={(e) => setDraft(e.target.value)}
              disabled={updateMutation.isPending}
            />
            <button
              type="button"
              onClick={() => save(value)}
              disabled={!dirty || !value || updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Simpan
            </button>
            {settings?.source === 'database' && (
              <button
                type="button"
                onClick={() => save('')}
                disabled={updateMutation.isPending}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Hapus tanggal
              </button>
            )}
          </div>
        )}
      </div>
      {!canEdit && settings && (
        <p className="mt-2 text-xs text-slate-500">Hanya pengguna dengan izin pengaturan ID Card (super admin) yang dapat mengubah tanggal.</p>
      )}
      {updateMutation.isError && (
        <p role="alert" className="mt-2 text-xs text-red-600">{settingsErrorMessage(updateMutation.error)}</p>
      )}
    </section>
  );
}

function batchErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 503) return 'Fitur ID Card belum dikonfigurasi di server (ATHLETE_CARD_SECRET).';
  if (status === 403) return 'Anda tidak memiliki izin mencetak ID Card.';
  return error?.response?.data?.message || error?.response?.data?.error || 'Gagal memuat data kartu.';
}

export function AthleteCardsPage() {
  const [organizationId, setOrganizationId] = useState('');
  const [sportId, setSportId] = useState('');
  const [disciplineId, setDisciplineId] = useState('');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(20);
  const [deselected, setDeselected] = useState(() => new Set());

  const { data: organizations = [] } = useOrganizationsAll();
  const { data: sports = [] } = useCaborsAll({ level: 'sport' });
  const { data: disciplines = [] } = useCaborsAll({ level: 'discipline', parentId: sportId });
  const batchMutation = useAthleteCardBatch();
  const batch = batchMutation.data;
  const settingsQuery = useAthleteCardSettings();
  // Pratinjau memakai tanggal terkini dari pengaturan, bukan salinan lama di batch.
  const validUntil = settingsQuery.data ? settingsQuery.data.valid_until : batch?.valid_until;

  const selectedItems = useMemo(
    () => (batch?.items || []).filter((item) => !deselected.has(item.athlete_id)),
    [batch, deselected],
  );

  const limitValid = Number.isInteger(limit) && limit >= 1 && limit <= MAX_BATCH;

  const loadBatch = (event) => {
    event.preventDefault();
    if (!limitValid) return;
    setDeselected(new Set());
    batchMutation.mutate({
      organization_id: organizationId ? Number(organizationId) : 0,
      cabor_id: Number(disciplineId || sportId || 0),
      search: search.trim(),
      limit,
    });
  };

  const toggle = (id) => {
    setDeselected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <DashboardLayout
      title="ID Card Atlet"
      subtitle="Cetak kartu anggota atlet dengan QR yang membuka halaman data atlet. Filter per organisasi, cabor, dan disiplin, lalu tentukan jumlah kartu."
    >
      <div className="space-y-5">
        <ValidUntilPanel settings={settingsQuery.data} isLoading={settingsQuery.isLoading} isError={settingsQuery.isError} />

        <form onSubmit={loadBatch} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Organisasi (Asal KONI)">
              <select className={SELECT_CLASS} value={organizationId} onChange={(e) => setOrganizationId(e.target.value)}>
                <option value="">Semua organisasi</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Cabor">
              <select
                className={SELECT_CLASS}
                value={sportId}
                onChange={(e) => {
                  setSportId(e.target.value);
                  setDisciplineId('');
                }}
              >
                <option value="">Semua cabor</option>
                {sports.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Disiplin">
              <select
                className={SELECT_CLASS}
                value={disciplineId}
                disabled={!sportId}
                onChange={(e) => setDisciplineId(e.target.value)}
              >
                <option value="">{sportId ? 'Semua disiplin' : 'Pilih cabor dahulu'}</option>
                {disciplines.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Cari nama / ID nasional">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  className={`${SELECT_CLASS} pl-9`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nama atlet"
                />
              </div>
            </Field>
            <Field label={`Jumlah kartu dicetak (1-${MAX_BATCH})`}>
              <input
                type="number"
                min={1}
                max={MAX_BATCH}
                className={SELECT_CLASS}
                value={Number.isNaN(limit) ? '' : limit}
                onChange={(e) => setLimit(e.target.value === '' ? NaN : Number(e.target.value))}
              />
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={!limitValid || batchMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {batchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
                Siapkan kartu
              </button>
            </div>
          </div>
          {!limitValid && (
            <p className="mt-2 text-xs text-red-600">Jumlah kartu harus bilangan bulat 1 sampai {MAX_BATCH}.</p>
          )}
        </form>

        {batchMutation.isError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {batchErrorMessage(batchMutation.error)}
          </div>
        )}

        {batch && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedItems.length} kartu siap dicetak
                </h2>
                <p className="text-xs text-slate-500">
                  Menampilkan {batch.items.length} dari {batch.total} atlet aktif sesuai filter.
                  {validUntil ? '' : ' Tanggal berlaku belum diatur.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={selectedItems.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Printer className="h-4 w-4" aria-hidden="true" /> Cetak
              </button>
            </div>

            {batch.items.length === 0 ? (
              <p className="mt-6 text-center text-sm text-slate-500">Tidak ada atlet aktif yang cocok dengan filter.</p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {batch.items.map((item) => (
                  <li key={item.athlete_id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={!deselected.has(item.athlete_id)}
                        onChange={() => toggle(item.athlete_id)}
                      />
                      <span className="min-w-0 text-sm">
                        <span className="block truncate font-semibold text-slate-900">{item.name}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {item.organization_name || '-'} - {item.cabor_name || '-'}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {selectedItems.length > 0 && (
          <section className="rounded-2xl border border-slate-200/80 bg-slate-100 p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold text-slate-600">Pratinjau lembar cetak (A4 lanskap, 4 atlet per halaman)</p>
            <div className="kic-print-root overflow-x-auto">
              <div className="kic-sheet">
                {selectedItems.map((item) => (
                  <div className="kic-pair" key={item.athlete_id}>
                    <AthleteIdCardFront item={item} validUntil={validUntil} />
                    <AthleteIdCardBack item={item} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
