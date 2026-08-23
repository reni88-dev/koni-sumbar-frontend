import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

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
export function useCoaches({ page = 1, search = '', caborId = '', isActive = '', clusterId = '', subClusterId = '', clusterType = '', subClusterType = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: coachKeys.list({ page, search, caborId, isActive, clusterId, subClusterId, clusterType, subClusterType, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/coaches', {
        params: { 
          page, 
          search: search || undefined, 
          cabor_id: caborId || undefined, 
          cluster_id: clusterId || undefined,
          sub_cluster_id: subClusterId || undefined,
          cluster_type: clusterType || undefined,
          sub_cluster_type: subClusterType || undefined,
          is_active: isActive !== '' ? isActive : undefined, 
          per_page: perPage 
        }
      });
      return response.data;
    },
  });
}

// Fetch coaches with infinite scroll while keeping the page-based hook available.
export function useInfiniteCoaches({
  search = '',
  caborId = '',
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
      isActive,
      clusterId,
      subClusterId,
      clusterType,
      subClusterType,
      perPage,
    }),
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/api/coaches', {
        params: {
          page: pageParam,
          search: search || undefined,
          cabor_id: caborId || undefined,
          cluster_id: clusterId || undefined,
          sub_cluster_id: subClusterId || undefined,
          cluster_type: clusterType || undefined,
          sub_cluster_type: subClusterType || undefined,
          is_active: isActive !== '' ? isActive : undefined,
          per_page: perPage,
        },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = Number(lastPage?.page) || 1;
      const responsePerPage = Number(lastPage?.per_page) || perPage;
      const total = Number(lastPage?.total) || 0;

      return currentPage * responsePerPage < total
        ? currentPage + 1
        : undefined;
    },
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}
