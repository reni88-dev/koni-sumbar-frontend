import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const coachClusterMasterKeys = {
  all: ['coachClusterMaster'],
  lists: () => [...coachClusterMasterKeys.all, 'list'],
  list: (filters) => [...coachClusterMasterKeys.lists(), filters],
  dropdown: () => [...coachClusterMasterKeys.all, 'dropdown'],
  subLists: () => [...coachClusterMasterKeys.all, 'sub-clusters'],
  subList: (filters) => [...coachClusterMasterKeys.subLists(), filters],
  subByCluster: (clusterId) => [...coachClusterMasterKeys.all, 'sub-by-cluster', clusterId],
};

export function useCoachClustersMaster({ page = 1, search = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: coachClusterMasterKeys.list({ page, search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/coach-clusters', {
        params: { page, search: search || undefined, per_page: perPage },
      });
      return response.data;
    },
  });
}

export function useCoachClustersAll() {
  return useQuery({
    queryKey: coachClusterMasterKeys.dropdown(),
    queryFn: async () => {
      const response = await api.get('/api/master/coach-clusters/all');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCoachClusterMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/api/master/coach-clusters', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachClusterMasterKeys.all }),
  });
}

export function useUpdateCoachClusterMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/api/master/coach-clusters/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachClusterMasterKeys.all }),
  });
}

export function useDeleteCoachClusterMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/master/coach-clusters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachClusterMasterKeys.all }),
  });
}

export function useCoachSubClusters({ page = 1, search = '', clusterId = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: coachClusterMasterKeys.subList({ page, search, clusterId, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/coach-sub-clusters', {
        params: { page, search: search || undefined, cluster_id: clusterId || undefined, per_page: perPage },
      });
      return response.data;
    },
  });
}

export function useCoachSubClustersByCluster(clusterId) {
  return useQuery({
    queryKey: coachClusterMasterKeys.subByCluster(clusterId),
    queryFn: async () => {
      const response = await api.get(`/api/master/coach-clusters/${clusterId}/sub-clusters`);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!clusterId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateCoachSubCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/api/master/coach-sub-clusters', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachClusterMasterKeys.all }),
  });
}

export function useUpdateCoachSubCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/api/master/coach-sub-clusters/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachClusterMasterKeys.all }),
  });
}

export function useDeleteCoachSubCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/master/coach-sub-clusters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachClusterMasterKeys.all }),
  });
}
