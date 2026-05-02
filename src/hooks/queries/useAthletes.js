import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

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
  isActive = '',
  perPage = 10,
  enabled = true,
} = {}) {
  return useQuery({
    queryKey: athleteKeys.list({ page, search, caborId, gender, organizationId, clusterId, subClusterId, clusterType, subClusterType, hasNationalAthleteNumber, isActive, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/athletes', {
        params: {
          page,
          search: search || undefined,
          cabor_id: caborId || undefined,
          gender: gender || undefined,
          organization_id: organizationId || undefined,
          cluster_id: clusterId || undefined,
          sub_cluster_id: subClusterId || undefined,
          cluster_type: clusterType || undefined,
          sub_cluster_type: subClusterType || undefined,
          has_national_athlete_number: hasNationalAthleteNumber || undefined,
          is_active: isActive === '' ? undefined : isActive,
          per_page: perPage,
        }
      });
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
  hasNationalAthleteNumber = '',
  perPage = 20,
} = {}) {
  return useInfiniteQuery({
    queryKey: athleteKeys.list({
      search, caborId, gender, organizationId, clusterId,
      subClusterId, hasNationalAthleteNumber, perPage, infinite: true,
    }),
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/api/athletes', {
        params: {
          page: pageParam,
          search: search || undefined,
          cabor_id: caborId || undefined,
          gender: gender || undefined,
          organization_id: organizationId || undefined,
          cluster_id: clusterId || undefined,
          sub_cluster_id: subClusterId || undefined,
          has_national_athlete_number: hasNationalAthleteNumber || undefined,
          per_page: perPage,
        },
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
    onSuccess: () => {
      // Invalidate all athlete queries — TanStack Query re-fetches all loaded
      // infinite pages in-place without resetting scroll position
      queryClient.invalidateQueries({ queryKey: athleteKeys.all });
    },
  });
}
