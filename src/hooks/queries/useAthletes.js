import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { coachAthleteKeys } from './useCoachAthletes';
import { buildAthleteListParams } from './listQueryParams';

// Query keys
export const athleteKeys = {
  all: ['athletes'],
  lists: () => [...athleteKeys.all, 'list'],
  list: (filters) => [...athleteKeys.lists(), filters],
  details: () => [...athleteKeys.all, 'detail'],
  detail: (id) => [...athleteKeys.details(), id],
};

// Fetch athletes with pagination and filters (page-based, kept for backward compat)
export function useAthletes({
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
  hasBPJSDocument = '',
  isActive = '',
  perPage = 10,
  enabled = true,
} = {}) {
  const params = buildAthleteListParams({
    page, search, caborId, gender, organizationId, clusterId, subClusterId,
    clusterType, subClusterType, hasNationalAthleteNumber, hasBPJSDocument, isActive, perPage,
  });

  return useQuery({
    queryKey: athleteKeys.list(params),
    queryFn: async () => {
      const response = await api.get('/api/athletes', { params });
      return response.data;
    },
    enabled,
  });
}

// Fetch athletes with infinite scroll (auto-load-on-scroll)
export function useInfiniteAthletes({
  search = '',
  caborId = '',
  gender = '',
  organizationId = '',
  clusterId = '',
  subClusterId = '',
  clusterType = '',
  subClusterType = '',
  hasNationalAthleteNumber = '',
  hasBPJSDocument = '',
  isActive = '',
  perPage = 20,
} = {}) {
  const params = buildAthleteListParams({
    page: 1, search, caborId, gender, organizationId, clusterId, subClusterId,
    clusterType, subClusterType, hasNationalAthleteNumber, hasBPJSDocument, isActive, perPage,
  });

  return useInfiniteQuery({
    queryKey: athleteKeys.list({ ...params, infinite: true }),
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/api/athletes', {
        params: { ...params, page: pageParam },
      });
      return response.data;
    },
    initialPageParam: 1,
    // Return next page number, or undefined when all pages are loaded
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page
        ? lastPage.current_page + 1
        : undefined,
  });
}
// Fetch single athlete
export function useAthlete(id) {
  return useQuery({
    queryKey: athleteKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/athletes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Delete athlete mutation
export function useDeleteAthlete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/athletes/${id}`);
    },
    onSuccess: (_data, id) => {
      // Keep loaded list pages in place while refreshing all data affected by cleanup.
      queryClient.invalidateQueries({ queryKey: athleteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: athleteKeys.detail(id), exact: true });
      queryClient.invalidateQueries({ queryKey: coachAthleteKeys.all });
    },
  });
}
