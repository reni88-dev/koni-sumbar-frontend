import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const athleteClusterMasterKeys = {
  all: ['athleteClusterMaster'],
  lists: () => [...athleteClusterMasterKeys.all, 'list'],
  list: (filters) => [...athleteClusterMasterKeys.lists(), filters],
  dropdown: () => [...athleteClusterMasterKeys.all, 'dropdown'],
  subLists: () => [...athleteClusterMasterKeys.all, 'sub-clusters'],
  subList: (filters) => [...athleteClusterMasterKeys.subLists(), filters],
  subByCluster: (clusterId) => [...athleteClusterMasterKeys.all, 'sub-by-cluster', clusterId],
};

export function useAthleteClustersMaster({ page = 1, search = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: athleteClusterMasterKeys.list({ page, search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/athlete-clusters', {
        params: { page, search: search || undefined, per_page: perPage },
      });
      return response.data;
    },
  });
}

export function useAthleteClustersAll() {
  return useQuery({
    queryKey: athleteClusterMasterKeys.dropdown(),
    queryFn: async () => {
      const response = await api.get('/api/master/athlete-clusters/all');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateAthleteClusterMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/api/master/athlete-clusters', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: athleteClusterMasterKeys.all }),
  });
}

export function useUpdateAthleteClusterMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/api/master/athlete-clusters/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: athleteClusterMasterKeys.all }),
  });
}

export function useDeleteAthleteClusterMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/master/athlete-clusters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: athleteClusterMasterKeys.all }),
  });
}

export function useAthleteSubClusters({ page = 1, search = '', clusterId = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: athleteClusterMasterKeys.subList({ page, search, clusterId, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/athlete-sub-clusters', {
        params: { page, search: search || undefined, cluster_id: clusterId || undefined, per_page: perPage },
      });
      return response.data;
    },
  });
}

export function useAthleteSubClustersByCluster(clusterId) {
  return useQuery({
    queryKey: athleteClusterMasterKeys.subByCluster(clusterId),
    queryFn: async () => {
      const response = await api.get(`/api/master/athlete-clusters/${clusterId}/sub-clusters`);
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: !!clusterId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateAthleteSubCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post('/api/master/athlete-sub-clusters', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: athleteClusterMasterKeys.all }),
  });
}

export function useUpdateAthleteSubCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/api/master/athlete-sub-clusters/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: athleteClusterMasterKeys.all }),
  });
}

export function useDeleteAthleteSubCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/master/athlete-sub-clusters/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: athleteClusterMasterKeys.all }),
  });
}
