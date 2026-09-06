import assert from 'node:assert/strict';
import test from 'node:test';

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
