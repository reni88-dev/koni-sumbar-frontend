import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { coachAthleteKeys } from './useCoachAthletes';
import { buildCoachListParams, getNextCoachPageParam } from './coachQueryParams';

// Query keys
export const coachKeys = {
  all: ['coaches'],
  lists: () => [...coachKeys.all, 'list'],
  list: (filters) => [...coachKeys.lists(), filters],
  infiniteList: (filters) => [...coachKeys.lists(), 'infinite', filters],
  details: () => [...coachKeys.all, 'detail'],
  detail: (id) => [...coachKeys.details(), id],
};

// Fetch coaches with pagination and filters
export function useCoaches({ page = 1, search = '', caborId = '', organizationId = '', isActive = '', clusterId = '', subClusterId = '', clusterType = '', subClusterType = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: coachKeys.list({ page, search, caborId, organizationId, isActive, clusterId, subClusterId, clusterType, subClusterType, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/coaches', {
        params: buildCoachListParams({
          page,
          search,
          caborId,
          organizationId,
          isActive,
          clusterId,
          subClusterId,
          clusterType,
          subClusterType,
          perPage,
        }),
      });
      return response.data;
    },
  });
}

// Fetch coaches with infinite scroll while keeping the page-based hook available.
export function useInfiniteCoaches({
  search = '',
  caborId = '',
  organizationId = '',
  isActive = '',
  clusterId = '',
  subClusterId = '',
  clusterType = '',
  subClusterType = '',
  perPage = 20,
  enabled = true,
} = {}) {
  return useInfiniteQuery({
    queryKey: coachKeys.infiniteList({
      search,
      caborId,
      organizationId,
      isActive,
      clusterId,
      subClusterId,
      clusterType,
      subClusterType,
      perPage,
    }),
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/api/coaches', {
        params: buildCoachListParams({
          page: pageParam,
          search,
          caborId,
          organizationId,
          isActive,
          clusterId,
          subClusterId,
          clusterType,
          subClusterType,
          perPage,
        }),
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => getNextCoachPageParam(lastPage, perPage),

    enabled,
  });
}

// Fetch single coach
export function useCoach(id) {
  return useQuery({
    queryKey: coachKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/coaches/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Create coach mutation
export function useCreateCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/coaches', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}

// Update coach mutation
export function useUpdateCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/coaches/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}

// Delete coach mutation
export function useDeleteCoach() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/coaches/${id}`);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: coachKeys.lists() });
      queryClient.invalidateQueries({ queryKey: coachKeys.detail(id), exact: true });
      queryClient.invalidateQueries({ queryKey: coachAthleteKeys.all });
    },
  });
}
