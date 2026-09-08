const hasQueryValue = (value) =>
  value !== undefined && value !== null && value !== '';

export function compactQueryParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => hasQueryValue(value)),
  );
}

export function buildClusterFilterParams({
  clusterId = '',
  clusterType = '',
  subClusterId = '',
  subClusterType = '',
} = {}) {
  if (clusterType === 'non_development') {
    return { cluster_type: 'non_development' };
  }

  return compactQueryParams({
    cluster_id: clusterId,
    cluster_type: hasQueryValue(clusterId) ? undefined : clusterType,
    sub_cluster_id: subClusterId,
    sub_cluster_type: hasQueryValue(subClusterId) ? undefined : subClusterType,
  });
}

export function buildAthleteListParams({
  page = 1,
  search = '',
  caborId = '',
  gender = '',
  organizationId = '',
  clusterId = '',
  subClusterId = '',
  clusterType = '',
  subClusterType = '',
  hasNationalAthleteNumber = '',
  isActive = '',
  perPage = 20,
} = {}) {
  return compactQueryParams({
    page,
    search,
    cabor_id: caborId,
    gender,
    organization_id: organizationId,
    ...buildClusterFilterParams({ clusterId, clusterType, subClusterId, subClusterType }),
    has_national_athlete_number: hasNationalAthleteNumber,
    is_active: isActive,
    per_page: perPage,
  });
}

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
  return compactQueryParams({
    page,
    search,
    cabor_id: caborId,
    organization_id: organizationId,
    ...buildClusterFilterParams({ clusterId, clusterType, subClusterId, subClusterType }),
    is_active: isActive,
    per_page: perPage,
  });
}