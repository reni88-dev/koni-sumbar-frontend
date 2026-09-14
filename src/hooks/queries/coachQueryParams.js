export { buildCoachListParams } from './listQueryParams.js';

export function getNextCoachPageParam(lastPage, fallbackPerPage = 20) {
  const currentPage = Number(lastPage?.page) || 1;
  const perPage = Number(lastPage?.per_page) || fallbackPerPage;
  const total = Number(lastPage?.total) || 0;

  return currentPage * perPage < total ? currentPage + 1 : undefined;
}

export function flattenCoachPages(data) {
  const seen = new Set();

  return (data?.pages || []).flatMap((page) => (page?.data || []).filter((coach) => {
    if (!coach?.id || seen.has(coach.id)) return false;
    seen.add(coach.id);
    return true;
  }));
}
