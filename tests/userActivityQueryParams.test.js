import assert from 'node:assert/strict';
import test from 'node:test';

import { buildUserActivityQueryParams } from '../src/hooks/queries/userActivityQueryParams.js';

test('user activity canonical params send page, per_page, and search to the API', () => {
  const params = buildUserActivityQueryParams({
    page: 3,
    per_page: 15,
    search: 'Siti Rahma',
  });

  assert.deepEqual(params, {
    page: 3,
    per_page: 15,
    search: 'Siti Rahma',
  });
  assert.equal(new URLSearchParams(params).toString(), 'page=3&per_page=15&search=Siti+Rahma');
});

test('user activity canonical params omit empty values', () => {
  assert.deepEqual(buildUserActivityQueryParams({
    page: '',
    per_page: null,
    search: undefined,
  }), {});
});