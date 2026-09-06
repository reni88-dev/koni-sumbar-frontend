export function buildCoachListParams({
  page = 1,
  search = '',
  caborId = '',
  organizationId = '',
  isActive = '',
  clusterId = '',
  subClusterId = '',
  clusterType = '',
  subClusterType = '',
  perPage = 20,
} = {}) {
  return {
    page,
    search: search || undefined,
    cabor_id: caborId || undefined,
    organization_id: organizationId || undefined,
    cluster_id: clusterId || undefined,
    sub_cluster_id: subClusterId || undefined,
    cluster_type: clusterType || undefined,
    sub_cluster_type: subClusterType || undefined,
    is_active: isActive !== '' ? isActive : undefined,
    per_page: perPage,
  };
}

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
