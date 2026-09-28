import {
  QUALITY_REPORT_API_BASE,
  getQualityReportByKey,
} from './reportConfig.js';

export const QUALITY_REPORT_PER_PAGE_OPTIONS = [25, 50, 100];

const ARRAY_FIELDS = [
  'region_ids',
  'organization_ids',
  'federation_ids',
  'cabor_ids',
  'pengcab_ids',
];

const SCOPE_FIELDS = [...ARRAY_FIELDS];
const RANGE_FIELDS = ['date_from', 'date_to', 'date_basis'];
const PAGINATION_FIELDS = ['page', 'per_page'];
const SORT_FIELDS = ['sort_by', 'sort_dir'];

export const QUALITY_REPORT_QUERY_FIELDS = {
  summary: [...SCOPE_FIELDS, 'as_of_date'],
  athletes: [
    ...SCOPE_FIELDS,
    ...RANGE_FIELDS,
    'gender',
    'record_status',
    'account_status',
    'completeness_category',
    'priority',
    'search',
    ...SORT_FIELDS,
    ...PAGINATION_FIELDS,
  ],
  coaches: [
    ...SCOPE_FIELDS,
    ...RANGE_FIELDS,
    'gender',
    'record_status',
    'account_status',
    'completeness_category',
    'priority',
    'search',
    ...SORT_FIELDS,
    ...PAGINATION_FIELDS,
  ],
  duplicates: [
    ...SCOPE_FIELDS,
    ...RANGE_FIELDS,
    'finding_type',
    'priority',
    'finding_status',
    'search',
    ...SORT_FIELDS,
    ...PAGINATION_FIELDS,
  ],
  validity: [
    ...SCOPE_FIELDS,
    ...RANGE_FIELDS,
    'finding_type',
    'priority',
    'finding_status',
    'search',
    ...SORT_FIELDS,
    ...PAGINATION_FIELDS,
  ],
  documents: [
    ...SCOPE_FIELDS,
    ...RANGE_FIELDS,
    'document_type',
    'document_status',
    'search',
    ...PAGINATION_FIELDS,
  ],
  distribution: [...SCOPE_FIELDS, 'as_of_date', ...PAGINATION_FIELDS],
};

const ENUM_VALUES = {
  gender: ['male', 'female'],
  record_status: ['active', 'inactive'],
  account_status: ['linked', 'unlinked', 'verified', 'unverified'],
  completeness_category: ['complete', 'needs_completion', 'many_gaps', 'critical'],
  priority: ['critical', 'medium', 'low'],
  finding_status: ['open', 'in_progress', 'resolved', 'ignored'],
  document_type: ['photo', 'identity', 'bpjs', 'certificate'],
  document_status: ['available', 'missing_reference', 'missing_object', 'invalid_type', 'expired', 'duplicate_object', 'unverified'],
  sort_dir: ['asc', 'desc'],
};

const FINDING_TYPES = {
  duplicates: ['certain_duplicate', 'identity_conflict', 'possible_duplicate', 'shared_contact'],
  validity: ['invalid_nik', 'invalid_kk', 'invalid_phone', 'invalid_email'],
};

const SORT_VALUES = {
  athletes: ['score', 'name', 'updated_at', 'issue_count', 'organization', 'cabor'],
  coaches: ['score', 'name', 'updated_at', 'issue_count', 'organization', 'cabor'],
  duplicates: ['priority', 'last_seen_at', 'first_seen_at', 'status', 'finding_type'],
  validity: ['priority', 'last_seen_at', 'first_seen_at', 'status', 'finding_type'],
};

function baseDefaults() {
  return {
    region_ids: [],
    organization_ids: [],
    federation_ids: [],
    cabor_ids: [],
    pengcab_ids: [],
    date_from: '',
    date_to: '',
    date_basis: '',
    as_of_date: '',
    gender: '',
    record_status: '',
    account_status: '',
    completeness_category: '',
    finding_type: '',
    priority: '',
    finding_status: '',
    document_type: '',
    document_status: '',
    search: '',
    sort_by: '',
    sort_dir: '',
    page: 1,
    per_page: 25,
  };
}

export function getDefaultQualityFilters(reportKey) {
  const defaults = baseDefaults();
  if (reportKey === 'athletes' || reportKey === 'coaches') {
    defaults.date_basis = 'updated_at';
    defaults.sort_by = 'score';
    defaults.sort_dir = 'asc';
  } else if (reportKey === 'duplicates' || reportKey === 'validity') {
    defaults.date_basis = 'finding_at';
    defaults.sort_by = 'last_seen_at';
    defaults.sort_dir = 'desc';
  } else if (reportKey === 'documents') {
    defaults.date_basis = 'document_at';
  }
  return defaults;
}

function toSearchParams(input) {
  if (input instanceof URLSearchParams) {
    return input;
  }
  return new URLSearchParams(typeof input === 'string' ? input : '');
}

function normalizeIds(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(values
    .map((item) => Number.parseInt(String(item).trim(), 10))
    .filter((item) => Number.isInteger(item) && item > 0))]
    .sort((first, second) => first - second);
}

function normalizeEnum(value, allowed) {
  const normalized = String(value || '').trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : '';
}

function normalizeText(value, maxLength = 100) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizePage(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePerPage(value) {
  const parsed = Number.parseInt(value, 10);
  return QUALITY_REPORT_PER_PAGE_OPTIONS.includes(parsed) ? parsed : 25;
}

function parseISODate(value) {
  const normalized = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return '';
  }
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return '';
  }
  return normalized;
}

function normalizeFindingType(reportKey, value) {
  return normalizeEnum(value, FINDING_TYPES[reportKey] || []);
}

function normalizeSort(reportKey, value, fallback) {
  return normalizeEnum(value, SORT_VALUES[reportKey] || []) || fallback;
}

export function normalizeQualityFilters(reportKey, source = {}) {
  const defaults = getDefaultQualityFilters(reportKey);
  const fields = new Set(QUALITY_REPORT_QUERY_FIELDS[reportKey] || []);
  const result = { ...defaults };

  for (const field of ARRAY_FIELDS) {
    result[field] = fields.has(field) ? normalizeIds(source[field]) : [];
  }

  for (const field of ['date_from', 'date_to', 'as_of_date']) {
    result[field] = fields.has(field) ? parseISODate(source[field]) : '';
  }

  for (const field of Object.keys(ENUM_VALUES)) {
    if (fields.has(field)) {
      result[field] = normalizeEnum(source[field], ENUM_VALUES[field]);
    }
  }

  if (fields.has('finding_type')) {
    result.finding_type = normalizeFindingType(reportKey, source.finding_type);
  }
  if (fields.has('search')) {
    const search = normalizeText(source.search);
    result.search = search.length === 0 || search.length >= 3 ? search : '';
  }
  if (fields.has('date_basis')) {
    result.date_basis = defaults.date_basis;
    if (reportKey === 'athletes' || reportKey === 'coaches') {
      result.date_basis = normalizeEnum(source.date_basis, ['created_at', 'updated_at']) || defaults.date_basis;
    }
  }
  if (fields.has('sort_by')) {
    result.sort_by = normalizeSort(reportKey, source.sort_by, defaults.sort_by);
  }
  if (fields.has('sort_dir')) {
    result.sort_dir = normalizeEnum(source.sort_dir, ENUM_VALUES.sort_dir) || defaults.sort_dir;
  }
  if (fields.has('page')) {
    result.page = normalizePage(source.page);
  }
  if (fields.has('per_page')) {
    result.per_page = normalizePerPage(source.per_page);
  }

  return result;
}

export function parseQualitySearchParams(reportKey, input) {
  const params = toSearchParams(input);
  const raw = {};
  for (const field of QUALITY_REPORT_QUERY_FIELDS[reportKey] || []) {
    raw[field] = params.get(field) || '';
  }
  return normalizeQualityFilters(reportKey, raw);
}

export function buildQualitySearchParams(reportKey, source, options = {}) {
  const filters = normalizeQualityFilters(reportKey, source);
  const defaults = getDefaultQualityFilters(reportKey);
  const params = new URLSearchParams();
  const fields = QUALITY_REPORT_QUERY_FIELDS[reportKey] || [];

  for (const field of fields) {
    const value = filters[field];
    if (ARRAY_FIELDS.includes(field)) {
      if (value.length) {
        params.set(field, value.join(','));
      }
      continue;
    }
    if (field === 'page') {
      if (!options.resetPage && value > 1) {
        params.set(field, String(value));
      }
      continue;
    }
    if (field === 'per_page') {
      if (value !== defaults.per_page) {
        params.set(field, String(value));
      }
      continue;
    }
    if ((field === 'sort_by' || field === 'sort_dir' || field === 'date_basis') && value === defaults[field]) {
      continue;
    }
    if (value !== '') {
      params.set(field, String(value));
    }
  }
  return params;
}

function formatJakartaDateParts(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function dateToUTC(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function validateQualityFilterDraft(reportKey, draft, now = new Date()) {
  const errors = {};
  const rawSearch = normalizeText(draft.search);
  if (rawSearch.length > 0 && rawSearch.length < 3) {
    errors.search = 'Pencarian minimal 3 karakter.';
  }

  if (['athletes', 'coaches', 'duplicates', 'validity', 'documents'].includes(reportKey)) {
    const from = parseISODate(draft.date_from);
    const to = parseISODate(draft.date_to);
    if (Boolean(draft.date_from) !== Boolean(draft.date_to)) {
      errors.date_range = 'Tanggal awal dan akhir harus diisi bersama.';
    } else if ((draft.date_from && !from) || (draft.date_to && !to)) {
      errors.date_range = 'Format rentang tanggal tidak valid.';
    } else if (from && to) {
      const fromDate = dateToUTC(from);
      const toDate = dateToUTC(to);
      const maximum = new Date(fromDate);
      maximum.setUTCFullYear(maximum.getUTCFullYear() + 1);
      if (fromDate > toDate) {
        errors.date_range = 'Tanggal awal tidak boleh setelah tanggal akhir.';
      } else if (toDate > maximum) {
        errors.date_range = 'Rentang tanggal maksimal satu tahun.';
      }
    }
  }

  if (['summary', 'distribution'].includes(reportKey) && draft.as_of_date) {
    const asOf = parseISODate(draft.as_of_date);
    if (!asOf) {
      errors.as_of_date = 'Tanggal posisi tidak valid.';
    } else if (asOf > formatJakartaDateParts(now)) {
      errors.as_of_date = 'Tanggal posisi tidak boleh di masa depan.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildQualityApiParams(reportKey, source, options = {}) {
  const filters = normalizeQualityFilters(reportKey, source);
  const fields = QUALITY_REPORT_QUERY_FIELDS[reportKey] || [];
  const params = {};

  for (const field of fields) {
    if (options.exportRequest && PAGINATION_FIELDS.includes(field)) {
      continue;
    }
    const value = filters[field];
    if (ARRAY_FIELDS.includes(field)) {
      if (value.length) {
        params[field] = value.join(',');
      }
    } else if (value !== '') {
      params[field] = value;
    }
  }
  return params;
}

export function buildQualityReportRequest(reportKey, source) {
  const report = getQualityReportByKey(reportKey);
  if (!report) {
    throw new Error('Laporan kualitas data tidak dikenal.');
  }
  return {
    method: 'GET',
    url: `${QUALITY_REPORT_API_BASE}/${report.endpoint}`,
    params: buildQualityApiParams(reportKey, source),
  };
}

export function buildQualityFiltersRequest(source = {}) {
  const filters = normalizeQualityFilters('summary', source);
  const params = filters.as_of_date ? { as_of_date: filters.as_of_date } : {};
  return {
    method: 'GET',
    url: `${QUALITY_REPORT_API_BASE}/filters`,
    params,
  };
}

export function buildQualityScanRequest() {
  return {
    method: 'POST',
    url: `${QUALITY_REPORT_API_BASE}/scans`,
  };
}

export function buildQualityScanStatusRequest(runId) {
  if (runId === undefined || runId === null || runId === '') {
    return {
      method: 'GET',
      url: `${QUALITY_REPORT_API_BASE}/scans/latest`,
    };
  }
  const normalizedRunId = Number(runId);
  if (!Number.isInteger(normalizedRunId) || normalizedRunId <= 0) {
    throw new Error('ID scan kualitas data tidak valid.');
  }
  return {
    method: 'GET',
    url: `${QUALITY_REPORT_API_BASE}/scans/${normalizedRunId}`,
  };
}

export function isQualityScanActive(status) {
  return status === 'queued' || status === 'running';
}

export function isQualityScanTerminal(status) {
  return status === 'succeeded' || status === 'failed';
}

export function buildQualityExportRequest(reportKey, source, format) {
  const report = getQualityReportByKey(reportKey);
  if (!report || !report.formats.includes(format)) {
    throw new Error('Format ekspor laporan tidak valid.');
  }
  return {
    method: 'GET',
    url: `${QUALITY_REPORT_API_BASE}/export`,
    params: {
      ...buildQualityApiParams(reportKey, source, { exportRequest: true }),
      report: report.exportReport,
      format,
    },
  };
}

// buildQualityPrintAllRequest keeps the applied filters/sorting and drops
// pagination like the regular export request, but always targets PDF so the
// "cetak seluruh hasil" action can preview it in a new tab. Unlike
// buildQualityExportRequest, it does not require the report to list "pdf" in
// its export formats, so the format never shows up as a regular export button.
export function buildQualityPrintAllRequest(reportKey, source) {
  const report = getQualityReportByKey(reportKey);
  if (!report) {
    throw new Error('Laporan kualitas data tidak dikenal.');
  }
  return {
    method: 'GET',
    url: `${QUALITY_REPORT_API_BASE}/export`,
    params: {
      ...buildQualityApiParams(reportKey, source, { exportRequest: true }),
      report: report.exportReport,
      format: 'pdf',
    },
  };
}

export function withQualityPagination(reportKey, source, page) {
  return normalizeQualityFilters(reportKey, { ...source, page });
}
