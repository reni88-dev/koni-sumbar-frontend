import assert from 'node:assert/strict';
import test from 'node:test';

import {
  QUALITY_REPORTS,
  QUALITY_SCAN_PERMISSION,
  getFirstAllowedQualityReport,
} from '../src/features/data-quality-report/reportConfig.js';
import {
  buildQualityApiParams,
  buildQualityExportRequest,
  buildQualityReportRequest,
  buildQualityScanRequest,
  buildQualityScanStatusRequest,
  buildQualitySearchParams,
  isQualityScanActive,
  isQualityScanTerminal,
  normalizeQualityFilters,
  parseQualitySearchParams,
  validateQualityFilterDraft,
} from '../src/features/data-quality-report/queryParams.js';
import { getFilenameFromContentDisposition } from '../src/features/data-quality-report/exportUtils.js';

const expectedContracts = [
  ['summary', '/laporan/kualitas-data/ringkasan', 'reports.quality.summary.view', 'summary'],
  ['athletes', '/laporan/kualitas-data/atlet', 'reports.quality.athletes.view', 'athletes'],
  ['coaches', '/laporan/kualitas-data/pelatih', 'reports.quality.coaches.view', 'coaches'],
  ['duplicates', '/laporan/kualitas-data/duplikat', 'reports.quality.duplicates.view', 'duplicates'],
  ['validity', '/laporan/kualitas-data/validitas', 'reports.quality.validity.view', 'validity'],
  ['documents', '/laporan/kualitas-data/dokumen', 'reports.quality.documents.view', 'documents'],
  ['distribution', '/laporan/kualitas-data/sebaran', 'reports.quality.distribution.view', 'distribution'],
];

test('quality report route, permission, and endpoint mapping is complete and stable', () => {
  assert.deepEqual(
    QUALITY_REPORTS.map((report) => [report.key, report.path, report.permission, report.endpoint]),
    expectedContracts,
  );
  assert.equal(getFirstAllowedQualityReport(['reports.quality.coaches.view'])?.key, 'coaches');
  assert.equal(getFirstAllowedQualityReport(['*'])?.key, 'summary');
  assert.equal(getFirstAllowedQualityReport([]), null);
});

test('manual quality scan contract is permission-gated and limited to the canonical scan endpoints', () => {
  assert.equal(QUALITY_SCAN_PERMISSION, 'reports.quality.scan');
  assert.deepEqual(buildQualityScanRequest(), {
    method: 'POST',
    url: '/api/reports/quality/scans',
  });
  assert.deepEqual(buildQualityScanStatusRequest(), {
    method: 'GET',
    url: '/api/reports/quality/scans/latest',
  });
  assert.deepEqual(buildQualityScanStatusRequest(42), {
    method: 'GET',
    url: '/api/reports/quality/scans/42',
  });
  assert.throws(() => buildQualityScanStatusRequest(0));
  assert.throws(() => buildQualityScanStatusRequest('invalid'));

  for (const request of [
    buildQualityScanRequest(),
    buildQualityScanStatusRequest(),
    buildQualityScanStatusRequest(42),
  ]) {
    assert.equal(request.url.startsWith('/api/reports/quality/scans'), true);
    assert.equal(request.url.includes('/findings'), false);
    assert.equal(request.url.includes('/api/data-summary'), false);
    assert.equal(request.url.includes('/api/data-analysis'), false);
    assert.equal('params' in request, false);
    assert.equal('data' in request, false);
    assert.equal(request.url.includes('sensitive=full'), false);
  }
});

test('quality scan status helpers distinguish active and terminal runs', () => {
  assert.equal(isQualityScanActive('queued'), true);
  assert.equal(isQualityScanActive('running'), true);
  assert.equal(isQualityScanActive('succeeded'), false);
  assert.equal(isQualityScanTerminal('succeeded'), true);
  assert.equal(isQualityScanTerminal('failed'), true);
  assert.equal(isQualityScanTerminal('running'), false);
});

test('quality URL state round-trips arrays and omits empty/default filters', () => {
  const params = buildQualitySearchParams('athletes', {
    region_ids: ['3', 1, 3],
    organization_ids: [9, 4],
    cabor_ids: [],
    search: '  Siti Rahma  ',
    date_basis: 'created_at',
    page: 3,
    per_page: 50,
    sort_by: 'name',
    sort_dir: 'desc',
  });
  assert.equal(
    params.toString(),
    'region_ids=1%2C3&organization_ids=4%2C9&date_basis=created_at&search=Siti+Rahma&sort_by=name&sort_dir=desc&page=3&per_page=50',
  );
  assert.deepEqual(parseQualitySearchParams('athletes', params), normalizeQualityFilters('athletes', {
    region_ids: [1, 3],
    organization_ids: [4, 9],
    search: 'Siti Rahma',
    date_basis: 'created_at',
    page: 3,
    per_page: 50,
    sort_by: 'name',
    sort_dir: 'desc',
  }));
});

test('applying filters resets page and pagination is restricted to 25, 50, or 100', () => {
  const resetParams = buildQualitySearchParams('documents', {
    document_status: 'missing_object',
    page: 8,
    per_page: 100,
  }, { resetPage: true });
  assert.equal(resetParams.get('page'), null);
  assert.equal(resetParams.get('per_page'), '100');
  assert.equal(normalizeQualityFilters('documents', { per_page: 15 }).per_page, 25);
  assert.equal(normalizeQualityFilters('documents', { per_page: 50 }).per_page, 50);
});

test('search and date validation enforce minimum search and a maximum one-year range', () => {
  assert.equal(validateQualityFilterDraft('athletes', { search: 'ab' }).valid, false);
  assert.equal(validateQualityFilterDraft('athletes', { search: 'abc' }).valid, true);
  assert.equal(validateQualityFilterDraft('athletes', {
    date_from: '2025-01-01',
    date_to: '2026-01-01',
  }).valid, true);
  assert.equal(validateQualityFilterDraft('athletes', {
    date_from: '2025-01-01',
    date_to: '2026-01-02',
  }).errors.date_range, 'Rentang tanggal maksimal satu tahun.');
  assert.equal(validateQualityFilterDraft('summary', {
    as_of_date: '2026-09-17',
  }, new Date('2026-09-16T05:00:00Z')).valid, false);
});

test('API params serialize IDs as comma-separated values and omit invalid short search', () => {
  assert.deepEqual(buildQualityApiParams('validity', {
    region_ids: [3, 1],
    organization_ids: [],
    finding_type: 'invalid_email',
    search: 'ab',
    page: 2,
    per_page: 50,
  }), {
    region_ids: '1,3',
    date_basis: 'finding_at',
    finding_type: 'invalid_email',
    sort_by: 'last_seen_at',
    sort_dir: 'desc',
    page: 2,
    per_page: 50,
  });
});

test('all report builders are GET-only, masked, and isolated from legacy or mutation endpoints', () => {
  for (const report of QUALITY_REPORTS) {
    const request = buildQualityReportRequest(report.key, {
      search: 'atlet',
      page: 2,
      per_page: 25,
      sensitive: 'full',
    });
    assert.equal(request.method, 'GET');
    assert.equal(request.url, `/api/reports/quality/${report.endpoint}`);
    assert.equal('sensitive' in request.params, false);
    assert.equal(request.url.includes('/api/data-summary'), false);
    assert.equal(request.url.includes('/api/data-analysis'), false);
    assert.equal(/\/(scans|findings)(\/|$)/.test(request.url), false);
  }
});

test('export builder keeps applied filters, removes pagination, and never requests full sensitive data', () => {
  const request = buildQualityExportRequest('athletes', {
    organization_ids: [9, 4],
    search: 'Rahma',
    page: 7,
    per_page: 100,
    sensitive: 'full',
  }, 'xlsx');
  assert.deepEqual(request, {
    method: 'GET',
    url: '/api/reports/quality/export',
    params: {
      organization_ids: '4,9',
      date_basis: 'updated_at',
      search: 'Rahma',
      sort_by: 'score',
      sort_dir: 'asc',
      report: 'athletes',
      format: 'xlsx',
    },
  });
  assert.throws(() => buildQualityExportRequest('athletes', {}, 'pdf'));
  assert.equal(buildQualityExportRequest('summary', {}, 'pdf').params.format, 'pdf');
});

test('export filename supports quoted and RFC 5987 content disposition values', () => {
  assert.equal(
    getFilenameFromContentDisposition('attachment; filename="laporan-kualitas.csv"', 'fallback.csv'),
    'laporan-kualitas.csv',
  );
  assert.equal(
    getFilenameFromContentDisposition("attachment; filename*=UTF-8''laporan%20kualitas.xlsx", 'fallback.xlsx'),
    'laporan kualitas.xlsx',
  );
});
