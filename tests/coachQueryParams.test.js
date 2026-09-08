import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAthleteListParams,
  buildClusterFilterParams,
} from '../src/hooks/queries/listQueryParams.js';
import {
  buildCoachListParams,
  flattenCoachPages,
  getNextCoachPageParam,
} from '../src/hooks/queries/coachQueryParams.js';

test('coach dropdown sends the API pagination and cabor parameters expected by /api/coaches', () => {
  const params = buildCoachListParams({
    page: 1,
    perPage: 20,
    search: 'Dodi Hartanto',
    caborId: 90,
    isActive: true,
  });

  assert.equal(params.page, 1);
  assert.equal(params.per_page, 20);
  assert.equal(params.search, 'Dodi Hartanto');
  assert.equal(params.cabor_id, 90);
  assert.equal(params.is_active, true);
  assert.equal(Object.hasOwn(params, 'limit'), false);
});

test('coach dropdown can continue past the first 15 records and retain coaches from later pages', () => {
  assert.equal(getNextCoachPageParam({ page: 1, per_page: 15, total: 28 }), 2);
  assert.equal(getNextCoachPageParam({ page: 2, per_page: 15, total: 28 }), undefined);

  const coaches = flattenCoachPages({
    pages: [
      { data: Array.from({ length: 15 }, (_, index) => ({ id: index + 1, name: `Pelatih ${index + 1}` })) },
      { data: [{ id: 48, name: 'Dodi Hartanto', cabor_id: 90 }] },
    ],
  });

  assert.equal(coaches.length, 16);
  assert.deepEqual(coaches.at(-1), { id: 48, name: 'Dodi Hartanto', cabor_id: 90 });
});
test('non-development cluster uses cluster_type without cluster_id or stale sub-cluster filters', () => {
  assert.deepEqual(buildClusterFilterParams({
    clusterId: 2,
    clusterType: 'non_development',
    subClusterId: 8,
    subClusterType: 'stale-sub-cluster',
  }), {
    cluster_type: 'non_development',
  });
});

test('development cluster keeps actual cluster and sub-cluster IDs', () => {
  assert.deepEqual(buildClusterFilterParams({
    clusterId: 7,
    clusterType: '',
    subClusterId: 12,
  }), {
    cluster_id: 7,
    sub_cluster_id: 12,
  });
});

test('athlete list canonical params contain every active filter used by the query key and request', () => {
  const params = buildAthleteListParams({
    page: 3,
    perPage: 25,
    search: 'ATL-001',
    caborId: 4,
    gender: 'female',
    organizationId: 9,
    clusterId: 7,
    subClusterId: 12,
    hasNationalAthleteNumber: 'true',
    isActive: 'false',
  });

  assert.deepEqual(params, {
    page: 3,
    search: 'ATL-001',
    cabor_id: 4,
    gender: 'female',
    organization_id: 9,
    cluster_id: 7,
    sub_cluster_id: 12,
    has_national_athlete_number: 'true',
    is_active: 'false',
    per_page: 25,
  });
});

test('empty athlete filters are omitted while pagination remains explicit', () => {
  assert.deepEqual(buildAthleteListParams({}), {
    page: 1,
    per_page: 20,
  });
});

test('athlete list, print, and export derive the same filter contract', () => {
  const filters = {
    search: 'Siti',
    caborId: 5,
    gender: 'female',
    organizationId: 11,
    clusterId: 2,
    clusterType: 'non_development',
    subClusterId: 99,
    hasNationalAthleteNumber: 'false',
    isActive: 'true',
  };
  const listParams = buildAthleteListParams({ ...filters, page: 1, perPage: 20 });
  const printParams = buildAthleteListParams({ ...filters, page: null, perPage: 100 });
  const exportParams = buildAthleteListParams({ ...filters, page: null, perPage: null });
  const withoutPagination = (params) => Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== 'page' && key !== 'per_page'),
  );

  assert.deepEqual(withoutPagination(listParams), withoutPagination(printParams));
  assert.deepEqual(withoutPagination(listParams), exportParams);
  assert.equal(Object.hasOwn(exportParams, 'cluster_id'), false);
  assert.equal(Object.hasOwn(exportParams, 'sub_cluster_id'), false);
});

test('coach non-development selection uses the shared cluster mapping', () => {
  const params = buildCoachListParams({
    clusterId: 2,
    clusterType: 'non_development',
    subClusterId: 8,
    organizationId: 17,
  });

  assert.equal(params.cluster_type, 'non_development');
  assert.equal(params.organization_id, 17);
  assert.equal(Object.hasOwn(params, 'cluster_id'), false);
  assert.equal(Object.hasOwn(params, 'sub_cluster_id'), false);
});
