import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  formatQualityDate,
  formatQualityDateTime,
  qualityLabel,
} from '../../features/data-quality-report/formatters.js';
import { QUALITY_REPORT_PER_PAGE_OPTIONS } from '../../features/data-quality-report/queryParams.js';

const SCOPE_FILTERS = [
  ['region_ids', 'Wilayah', 'regions'],
  ['organization_ids', 'Organisasi', 'organizations'],
  ['federation_ids', 'Federasi', 'federations'],
  ['cabor_ids', 'Cabor', 'cabors'],
  ['pengcab_ids', 'Pengcab', 'pengcabs'],
];

const PROFILE_CATEGORY_OPTIONS = [
  ['complete', 'Lengkap'],
  ['needs_completion', 'Perlu dilengkapi'],
  ['many_gaps', 'Banyak kekurangan'],
  ['critical', 'Kritis'],
];

const PRIORITY_OPTIONS = [
  ['critical', 'Kritis'],
  ['medium', 'Sedang'],
  ['low', 'Rendah'],
];

const FINDING_STATUS_OPTIONS = [
  ['open', 'Terbuka'],
  ['in_progress', 'Diproses'],
  ['resolved', 'Selesai'],
  ['ignored', 'Diabaikan'],
];

const FINDING_TYPE_OPTIONS = {
  duplicates: [
    ['certain_duplicate', 'Duplikat pasti'],
    ['identity_conflict', 'Konflik identitas'],
    ['possible_duplicate', 'Kemungkinan duplikat'],
    ['shared_contact', 'Kontak bersama'],
  ],
  validity: [
    ['invalid_nik', 'NIK tidak valid'],
    ['invalid_kk', 'KK tidak valid'],
    ['invalid_phone', 'Telepon tidak valid'],
    ['invalid_email', 'Email tidak valid'],
  ],
};

const DOCUMENT_TYPE_OPTIONS = [
  ['photo', 'Foto'],
  ['identity', 'Identitas'],
  ['bpjs', 'BPJS'],
  ['certificate', 'Sertifikat'],
];

const DOCUMENT_STATUS_OPTIONS = [
  ['available', 'Tersedia'],
  ['missing_reference', 'Referensi kosong'],
  ['missing_object', 'File tidak ditemukan'],
  ['invalid_type', 'Tipe file tidak valid'],
  ['expired', 'Kedaluwarsa'],
  ['duplicate_object', 'File terduplikasi'],
  ['unverified', 'Belum diverifikasi'],
];

const SORT_OPTIONS = {
  athletes: [
    ['score', 'Skor'],
    ['name', 'Nama'],
    ['updated_at', 'Waktu pembaruan'],
    ['issue_count', 'Jumlah masalah'],
    ['organization', 'Organisasi'],
    ['cabor', 'Cabor'],
  ],
  coaches: [
    ['score', 'Skor'],
    ['name', 'Nama'],
    ['updated_at', 'Waktu pembaruan'],
    ['issue_count', 'Jumlah masalah'],
    ['organization', 'Organisasi'],
    ['cabor', 'Cabor'],
  ],
  duplicates: [
    ['priority', 'Prioritas'],
    ['last_seen_at', 'Terakhir terdeteksi'],
    ['first_seen_at', 'Pertama terdeteksi'],
    ['status', 'Status'],
    ['finding_type', 'Klasifikasi'],
  ],
  validity: [
    ['priority', 'Prioritas'],
    ['last_seen_at', 'Terakhir terdeteksi'],
    ['first_seen_at', 'Pertama terdeteksi'],
    ['status', 'Status'],
    ['finding_type', 'Jenis masalah'],
  ],
};

function SelectField({ id, label, value, options, onChange }) {
  return (
    <label htmlFor={id} className="space-y-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        id={id}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
      >
        <option value="">Semua</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function ScopeCheckboxDropdown({ field, label, options, value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownOpen = isOpen && !disabled;
  const panelId = `quality-${field}-options`;
  const selectedValues = (value || []).map(String);
  const selectedSet = new Set(selectedValues);
  const normalizedSearch = search.trim().toLocaleLowerCase('id-ID');
  const filteredOptions = normalizedSearch
    ? options.filter((option) => String(option.name || '').toLocaleLowerCase('id-ID').includes(normalizedSearch))
    : options;

  let summary = 'Semua';
  if (selectedValues.length === 1) {
    const selectedOption = options.find((option) => String(option.id) === selectedValues[0]);
    summary = selectedOption?.name || `ID ${selectedValues[0]}`;
  } else if (selectedValues.length > 1) {
    summary = `${selectedValues.length} dipilih`;
  }

  useEffect(() => {
    if (!dropdownOpen) return undefined;

    const closeDropdown = () => {
      setIsOpen(false);
      setSearch('');
    };
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) closeDropdown();
    };
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeDropdown();
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const toggleDropdown = () => {
    if (dropdownOpen) {
      setIsOpen(false);
      setSearch('');
      return;
    }
    setIsOpen(true);
  };

  const toggleOption = (optionId, checked) => {
    const optionValue = String(optionId);
    onChange(checked
      ? [...selectedValues, optionValue]
      : selectedValues.filter((selectedValue) => selectedValue !== optionValue));
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5 text-sm font-medium text-slate-700">
      <span id={`quality-${field}-label`} className="block">{label}</span>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        aria-label={`${label}: ${summary}`}
        aria-expanded={dropdownOpen}
        aria-controls={panelId}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2.5 text-left text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${dropdownOpen ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropdownOpen && (
        <div
          id={panelId}
          role="group"
          aria-labelledby={`quality-${field}-label`}
          className="absolute left-0 right-0 z-30 mt-2 min-w-0 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <label htmlFor={`quality-${field}-search`} className="sr-only">Cari {label}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id={`quality-${field}-search`}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
              }}
              placeholder={`Cari ${label.toLocaleLowerCase('id-ID')}`}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-normal outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {selectedValues.length > 0 && (
            <div className="mt-2 flex items-center justify-between gap-2 border-b border-slate-100 px-1 pb-2">
              <span className="text-xs font-normal text-slate-500">{selectedValues.length} dipilih</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                Bersihkan
              </button>
            </div>
          )}

          <div className="mt-2 max-h-56 overflow-y-auto overscroll-contain">
            {options.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs font-normal text-slate-500">Pilihan tidak tersedia.</p>
            ) : filteredOptions.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs font-normal text-slate-500">Pilihan tidak ditemukan.</p>
            ) : (
              filteredOptions.map((option) => {
                const optionValue = String(option.id);
                const checkboxId = `quality-${field}-option-${optionValue}`;
                return (
                  <label
                    key={optionValue}
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 font-normal text-slate-700 hover:bg-slate-50"
                  >
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={selectedSet.has(optionValue)}
                      onChange={(event) => toggleOption(optionValue, event.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
                    />
                    <span className="min-w-0 break-words leading-5">{option.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DateRangeFields({ report, draft, setField, errors }) {
  if (!['athletes', 'coaches', 'duplicates', 'validity', 'documents'].includes(report.key)) {
    return null;
  }
  const label = report.dateMode === 'finding'
    ? 'Rentang terakhir terdeteksi'
    : report.dateMode === 'document'
      ? 'Rentang pemeriksaan dokumen'
      : 'Rentang tanggal profil';
  return (
    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(report.key === 'athletes' || report.key === 'coaches') && (
          <SelectField
            id="quality-date-basis"
            label="Basis tanggal"
            value={draft.date_basis}
            options={[
              ['updated_at', 'Diperbarui pada'],
              ['created_at', 'Dibuat pada'],
            ]}
            onChange={(value) => setField('date_basis', value)}
          />
        )}
        <label htmlFor="quality-date-from" className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Tanggal awal</span>
          <input
            id="quality-date-from"
            type="date"
            value={draft.date_from || ''}
            onChange={(event) => setField('date_from', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <label htmlFor="quality-date-to" className="space-y-1.5 text-sm font-medium text-slate-700">
          <span>Tanggal akhir</span>
          <input
            id="quality-date-to"
            type="date"
            value={draft.date_to || ''}
            onChange={(event) => setField('date_to', event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </label>
      </div>
      {errors.date_range && <p className="text-xs font-medium text-red-600">{errors.date_range}</p>}
      <p className="text-xs text-slate-400">Tanggal ditampilkan dalam WIB. Rentang maksimal satu tahun.</p>
    </div>
  );
}

function ReportSpecificFilters({ report, draft, setField, errors }) {
  if (report.key === 'summary' || report.key === 'distribution') {
    return (
      <label htmlFor="quality-as-of-date" className="space-y-1.5 text-sm font-medium text-slate-700">
        <span>Posisi historis (opsional)</span>
        <input
          id="quality-as-of-date"
          type="date"
          value={draft.as_of_date || ''}
          onChange={(event) => setField('as_of_date', event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        {errors.as_of_date && <span className="block text-xs font-medium text-red-600">{errors.as_of_date}</span>}
      </label>
    );
  }

  if (report.key === 'athletes' || report.key === 'coaches') {
    return (
      <>
        <SelectField id="quality-gender" label="Jenis kelamin" value={draft.gender} options={[["male", "Laki-laki"], ["female", "Perempuan"]]} onChange={(value) => setField('gender', value)} />
        <SelectField id="quality-completeness" label="Kategori kelengkapan" value={draft.completeness_category} options={PROFILE_CATEGORY_OPTIONS} onChange={(value) => setField('completeness_category', value)} />
        <SelectField id="quality-priority" label="Prioritas" value={draft.priority} options={PRIORITY_OPTIONS} onChange={(value) => setField('priority', value)} />
        <SelectField id="quality-record-status" label="Status profil" value={draft.record_status} options={[["active", "Aktif"], ["inactive", "Tidak aktif"]]} onChange={(value) => setField('record_status', value)} />
        <SelectField id="quality-account-status" label="Status akun" value={draft.account_status} options={[["linked", "Terhubung"], ["unlinked", "Belum terhubung"], ["verified", "Terverifikasi"], ["unverified", "Belum terverifikasi"]]} onChange={(value) => setField('account_status', value)} />
      </>
    );
  }

  if (report.key === 'duplicates' || report.key === 'validity') {
    return (
      <>
        <SelectField id="quality-finding-type" label={report.key === 'duplicates' ? 'Klasifikasi' : 'Jenis masalah'} value={draft.finding_type} options={FINDING_TYPE_OPTIONS[report.key]} onChange={(value) => setField('finding_type', value)} />
        <SelectField id="quality-priority" label="Prioritas" value={draft.priority} options={PRIORITY_OPTIONS} onChange={(value) => setField('priority', value)} />
        <SelectField id="quality-finding-status" label="Status temuan" value={draft.finding_status} options={FINDING_STATUS_OPTIONS} onChange={(value) => setField('finding_status', value)} />
      </>
    );
  }

  return (
    <>
      <SelectField id="quality-document-type" label="Jenis dokumen" value={draft.document_type} options={DOCUMENT_TYPE_OPTIONS} onChange={(value) => setField('document_type', value)} />
      <SelectField id="quality-document-status" label="Status pemeriksaan" value={draft.document_status} options={DOCUMENT_STATUS_OPTIONS} onChange={(value) => setField('document_status', value)} />
    </>
  );
}

export function QualityReportNavigation({ reports, currentKey }) {
  return (
    <nav aria-label="Navigasi laporan kualitas data" className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {reports.map((report) => (
          <Link
            key={report.key}
            to={report.path}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${report.key === currentKey
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-600'}`}
          >
            {report.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function QualityFilterPanel({ report, draft, setDraft, options, optionsQuery, errors, onApply, onReset }) {
  const setField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const scopeFiltersDisabled = optionsQuery.isLoading || optionsQuery.isError;
  const showsSearch = ['athletes', 'coaches', 'duplicates', 'validity', 'documents'].includes(report.key);

  return (
    <form onSubmit={onApply} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-800"><Filter className="h-4 w-4 text-red-600" /> Filter Laporan</div>
          <p className="mt-1 text-xs text-slate-500">Perubahan belum meminta data sampai tombol Terapkan Filter dipilih.</p>
        </div>
        {optionsQuery.isFetching && <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500"><LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Memuat pilihan scope</span>}
      </div>

      {optionsQuery.isError && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <span>Pilihan scope gagal dimuat. Filter lain tetap dapat digunakan.</span>
          <button type="button" onClick={() => optionsQuery.refetch()} className="font-bold underline">Coba lagi</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {SCOPE_FILTERS.map(([field, label, optionKey]) => (
          <ScopeCheckboxDropdown
            key={`${field}-${scopeFiltersDisabled ? 'disabled' : 'enabled'}`}
            field={field}
            label={label}
            options={options?.[optionKey] || []}
            value={draft[field]}
            onChange={(value) => setField(field, value)}
            disabled={scopeFiltersDisabled}
          />
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DateRangeFields report={report} draft={draft} setField={setField} errors={errors} />
        <ReportSpecificFilters report={report} draft={draft} setField={setField} errors={errors} />
        {showsSearch && (
          <label htmlFor="quality-search" className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-1">
            <span>Pencarian</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                id="quality-search"
                type="search"
                value={draft.search || ''}
                onChange={(event) => setField('search', event.target.value)}
                placeholder="Minimal 3 karakter"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
            {errors.search && <span className="block text-xs font-medium text-red-600">{errors.search}</span>}
          </label>
        )}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onReset} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <RotateCcw className="h-4 w-4" /> Reset Filter
        </button>
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
          <Filter className="h-4 w-4" /> Terapkan Filter
        </button>
      </div>
    </form>
  );
}

function optionNames(ids, options) {
  const index = new Map((options || []).map((option) => [Number(option.id), option.name]));
  return (ids || []).map((id) => index.get(Number(id)) || `ID ${id}`).join(', ');
}

export function QualityActiveFilterChips({ reportKey, filters, options, onRemove }) {
  const chips = [];
  for (const [field, label, optionKey] of SCOPE_FILTERS) {
    if (filters[field]?.length) chips.push([field, `${label}: ${optionNames(filters[field], options?.[optionKey])}`]);
  }
  if (filters.as_of_date) chips.push(['as_of_date', `Posisi: ${formatQualityDate(filters.as_of_date)}`]);
  if (filters.date_from && filters.date_to) chips.push(['date_range', `${formatQualityDate(filters.date_from)} – ${formatQualityDate(filters.date_to)}`]);
  for (const [field, label] of [
    ['gender', 'Jenis kelamin'],
    ['record_status', 'Status profil'],
    ['account_status', 'Status akun'],
    ['completeness_category', 'Kelengkapan'],
    ['finding_type', reportKey === 'duplicates' ? 'Klasifikasi' : 'Jenis masalah'],
    ['priority', 'Prioritas'],
    ['finding_status', 'Status temuan'],
    ['document_type', 'Jenis dokumen'],
    ['document_status', 'Status dokumen'],
  ]) {
    if (filters[field]) chips.push([field, `${label}: ${qualityLabel(filters[field])}`]);
  }
  if (filters.search) chips.push(['search', `Pencarian: “${filters.search}”`]);

  if (!chips.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filter aktif">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filter aktif</span>
      {chips.map(([field, label]) => (
        <button
          key={field}
          type="button"
          onClick={() => onRemove(field)}
          className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
          aria-label={`Hapus filter ${label}`}
        >
          {label} ×
        </button>
      ))}
    </div>
  );
}

export function QualitySortControls({ reportKey, filters, onChange }) {
  const options = SORT_OPTIONS[reportKey];
  if (!options) return null;
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor="quality-sort-by" className="text-xs font-semibold uppercase tracking-wide text-slate-400">Urutkan</label>
      <select id="quality-sort-by" value={filters.sort_by} onChange={(event) => onChange('sort_by', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select aria-label="Arah pengurutan" value={filters.sort_dir} onChange={(event) => onChange('sort_dir', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <option value="asc">Naik</option>
        <option value="desc">Turun</option>
      </select>
    </div>
  );
}

export function QualityMetadata({ metadata }) {
  if (!metadata) return null;
  const coverage = Object.entries(metadata.source_coverage || {});
  const versions = Object.entries(metadata.score_definition_version || {});
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Metadata laporan">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scan berhasil terakhir</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{formatQualityDateTime(metadata.last_successful_scan?.finished_at || metadata.last_successful_scan?.queued_at)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Snapshot</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{metadata.snapshot_date ? formatQualityDate(metadata.snapshot_date) : 'Data terkini'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Scope</p>
          <p className="mt-1 text-sm font-bold text-slate-800">{metadata.scope?.breadcrumb?.join(' › ') || metadata.scope?.label || 'Scope pengguna'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status data</p>
          <p className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${metadata.stale ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{metadata.stale ? 'Perlu diperbarui' : 'Mutakhir'}</p>
        </div>
      </div>
      {(versions.length > 0 || coverage.length > 0) && (
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Versi definisi skor</p>
            <div className="mt-2 flex flex-wrap gap-2">{versions.map(([key, value]) => <span key={key} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{qualityLabel(key)}: {value}</span>)}</div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cakupan sumber</p>
            <div className="mt-2 flex flex-wrap gap-2">{coverage.map(([key, value]) => <span key={key} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{qualityLabel(key)}: {value ? 'tersedia' : 'belum tersedia'}</span>)}</div>
          </div>
        </div>
      )}
      {metadata.warnings?.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
          {metadata.warnings.map((warning) => <p key={warning} className="flex items-start gap-2 text-sm text-amber-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {warning}</p>)}
        </div>
      )}
    </section>
  );
}

const QUALITY_SCAN_STATUS = {
  queued: {
    label: 'Menunggu worker',
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
    message: 'Scan sudah masuk antrean dan akan diproses oleh worker.',
  },
  running: {
    label: 'Sedang berjalan',
    tone: 'border-blue-200 bg-blue-50 text-blue-800',
    message: 'Scan sedang memeriksa profil dan dokumen. Halaman ini memperbarui status secara otomatis.',
  },
  succeeded: {
    label: 'Berhasil',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    message: 'Scan terakhir selesai. Data laporan diperbarui secara otomatis.',
  },
  failed: {
    label: 'Gagal',
    tone: 'border-red-200 bg-red-50 text-red-800',
    message: 'Scan terakhir tidak berhasil diselesaikan. Silakan jalankan ulang atau periksa log backend.',
  },
};

export function QualityScanControl({
  run,
  isStatusLoading,
  isStatusFetching,
  isStatusError,
  isStarting,
  startError,
  onRetryStatus,
  onRequestScan,
}) {
  const status = QUALITY_SCAN_STATUS[run?.status];
  const isActive = run?.status === 'queued' || run?.status === 'running';
  const finishedAt = run?.finished_at || run?.started_at || run?.queued_at;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Scan kualitas data manual">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">Scan Kualitas Data</h2>
            {status && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${status.tone}`}>
                {isActive && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                {status.label}
              </span>
            )}
            {isStatusFetching && !isStatusLoading && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Memperbarui status
              </span>
            )}
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-600" aria-live="polite">
            {isStatusLoading && !run ? (
              <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" /> Memeriksa status scan terakhir...</span>
            ) : run ? (
              <>
                <p>{status?.message || 'Status scan terakhir tersedia.'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Run #{run.id} · {formatQualityDateTime(finishedAt)}
                  {run.status === 'succeeded' && ` · ${Number(run.record_count || 0).toLocaleString('id-ID')} profil · ${Number(run.finding_count || 0).toLocaleString('id-ID')} temuan`}
                </p>
              </>
            ) : !isStatusError ? (
              <p>Belum ada riwayat scan. Jalankan scan manual untuk membuat baseline laporan pertama.</p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={onRequestScan}
          disabled={isStarting || isActive || isStatusLoading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Jalankan scan kualitas data manual"
        >
          {isStarting || isActive ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isStarting ? 'Memulai Scan...' : isActive ? 'Scan Sedang Diproses' : 'Jalankan Scan Manual'}
        </button>
      </div>
      {isStatusError && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Status scan terakhir gagal dimuat.</span>
          <button type="button" onClick={onRetryStatus} className="font-bold underline underline-offset-2">Coba lagi</button>
        </div>
      )}
      {startError && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{startError}</p>
      )}
    </section>
  );
}

export function QualityExportActions({ formats, canExport, exportingFormat, exportError, onExport }) {
  if (!canExport) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2" aria-label="Ekspor laporan">
        {formats.map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => onExport(format)}
            disabled={Boolean(exportingFormat)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold uppercase text-slate-700 hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportingFormat === format ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {format}
          </button>
        ))}
      </div>
      {exportError && <p className="text-sm font-medium text-red-600">{exportError}</p>}
    </div>
  );
}

export function QualityLoadingState() {
  return (
    <div className="space-y-3" aria-label="Memuat laporan">
      {[0, 1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-slate-100 bg-white" />)}
    </div>
  );
}

function errorDetails(error) {
  return {
    status: error?.response?.status,
    code: error?.response?.data?.code,
    message: error?.response?.data?.message || error?.response?.data?.error,
    earliest: error?.response?.data?.earliest_snapshot_date,
  };
}

export function QualityErrorState({ error, onRetry, canStartScan = false }) {
  const details = errorDetails(error);
  let title = 'Laporan gagal dimuat';
  let message = details.message || 'Terjadi kesalahan saat memuat laporan kualitas data.';
  let icon = <AlertCircle className="h-10 w-10 text-red-500" />;
  let tone = 'border-red-200 bg-red-50';
  let showRetry = true;

  if (details.status === 503 || details.code === 'REPORT_BASELINE_NOT_AVAILABLE') {
    title = 'Baseline kualitas data belum tersedia';
    message = canStartScan
      ? 'Belum ada hasil scan berhasil yang dapat dipakai sebagai baseline. Jalankan scan manual pada panel di atas.'
      : 'Belum ada hasil scan berhasil yang dapat dipakai sebagai baseline laporan. Hubungi administrator sistem.';
    icon = <CalendarDays className="h-10 w-10 text-amber-500" />;
    tone = 'border-amber-200 bg-amber-50';
    showRetry = false;
  } else if (details.status === 404 || details.code === 'REPORT_SNAPSHOT_NOT_AVAILABLE') {
    title = 'Snapshot pada tanggal tersebut tidak tersedia';
    message = details.earliest
      ? `Pilih tanggal pada atau setelah ${formatQualityDate(details.earliest)}.`
      : 'Pilih tanggal posisi lain yang memiliki snapshot.';
    icon = <CalendarDays className="h-10 w-10 text-amber-500" />;
    tone = 'border-amber-200 bg-amber-50';
    showRetry = false;
  } else if (details.status === 403 || details.code === 'REPORT_FILTER_OUT_OF_SCOPE') {
    title = 'Filter berada di luar scope akses';
    message = 'Reset atau ubah filter agar hanya mencakup data yang diizinkan untuk akun Anda.';
    icon = <ShieldCheck className="h-10 w-10 text-amber-500" />;
    tone = 'border-amber-200 bg-amber-50';
    showRetry = false;
  }

  return (
    <div className={`rounded-2xl border p-8 text-center ${tone}`}>
      <div className="mx-auto flex justify-center">{icon}</div>
      <h2 className="mt-3 text-lg font-bold text-slate-800">{title}</h2>
      <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-slate-600">{message}</p>
      {showRetry && (
        <button type="button" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </button>
      )}
    </div>
  );
}

export function QualityEmptyState({ filtered }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <Filter className="mx-auto h-10 w-10 text-slate-300" />
      <h2 className="mt-3 text-lg font-bold text-slate-800">Tidak ada data</h2>
      <p className="mt-1 text-sm text-slate-500">{filtered ? 'Tidak ada hasil yang cocok dengan filter aktif.' : 'Belum ada data pada laporan ini.'}</p>
    </div>
  );
}

export function QualityPagination({ pagination, onPageChange, onPerPageChange }) {
  if (!pagination) return null;
  const page = pagination.page || 1;
  const totalPages = Math.max(1, pagination.total_pages || 1);
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">Halaman <strong className="text-slate-700">{page}</strong> dari <strong className="text-slate-700">{totalPages}</strong> · {Number(pagination.total || 0).toLocaleString('id-ID')} data</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="quality-per-page" className="flex items-center gap-2 text-sm text-slate-500">
          Per halaman
          <select id="quality-per-page" value={pagination.per_page || 25} onChange={(event) => onPerPageChange(Number(event.target.value))} className="rounded-lg border border-slate-200 px-2 py-1.5 text-slate-700">
            {QUALITY_REPORT_PER_PAGE_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="button" aria-label="Halaman sebelumnya" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Sebelumnya</button>
          <button type="button" aria-label="Halaman berikutnya" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Berikutnya <ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
