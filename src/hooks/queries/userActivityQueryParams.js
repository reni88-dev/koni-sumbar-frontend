import { compactQueryParams } from './listQueryParams.js';

export function buildUserActivityQueryParams({
  page,
  per_page: perPage,
  search = '',
} = {}) {
  return compactQueryParams({
    page,
    per_page: perPage,
    search,
  });
}