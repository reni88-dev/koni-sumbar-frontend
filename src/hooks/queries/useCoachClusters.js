import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { coachKeys } from './useCoaches';

export const coachClusterKeys = {
  all: ['coachClusters'],
  histories: (coachId) => [...coachClusterKeys.all, coachId, 'histories'],
  active: (coachId) => [...coachClusterKeys.all, coachId, 'active'],
  funds: (coachId, filters) => [...coachClusterKeys.all, coachId, 'funds', filters],
  report: (filters) => [...coachClusterKeys.all, 'funds-report', filters],
};

export function useCoachClusterHistories(coachId) {
  return useQuery({
    queryKey: coachClusterKeys.histories(coachId),
    queryFn: async () => (await api.get(`/api/coaches/${coachId}/clusters`)).data,
    enabled: !!coachId,
  });
}

export function useActiveCoachCluster(coachId) {
  return useQuery({
    queryKey: coachClusterKeys.active(coachId),
    queryFn: async () => (await api.get(`/api/coaches/${coachId}/clusters/active`)).data,
    enabled: !!coachId,
  });
}

export function useMoveCoachCluster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ coachId, data }) => {
      const response = await api.post(`/api/coaches/${coachId}/clusters`, data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: coachClusterKeys.histories(variables.coachId) });
      queryClient.invalidateQueries({ queryKey: coachClusterKeys.active(variables.coachId) });
      queryClient.invalidateQueries({ queryKey: coachKeys.all });
    },
  });
}

export function useCoachDevelopmentFunds(coachId, filters = {}) {
  return useQuery({
    queryKey: coachClusterKeys.funds(coachId, filters),
    queryFn: async () => {
      const response = await api.get(`/api/coaches/${coachId}/development-funds`, {
        params: {
          page: filters.page || 1,
          per_page: filters.perPage || 15,
          year: filters.year || undefined,
          month: filters.month || undefined,
        },
      });
      return response.data;
    },
    enabled: !!coachId,
  });
}

export function useCreateCoachDevelopmentFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ coachId, data }) => (await api.post(`/api/coaches/${coachId}/development-funds`, data)).data,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...coachClusterKeys.all, variables.coachId, 'funds'] });
      queryClient.invalidateQueries({ queryKey: coachClusterKeys.report({}) });
    },
  });
}

export function useUpdateCoachDevelopmentFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => (await api.put(`/api/coach-development-funds/${id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachClusterKeys.all }),
  });
}

export function useDeleteCoachDevelopmentFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => api.delete(`/api/coach-development-funds/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: coachClusterKeys.all }),
  });
}

export function useCoachDevelopmentFundsReport(filters = {}) {
  return useQuery({
    queryKey: coachClusterKeys.report(filters),
    queryFn: async () => {
      const response = await api.get('/api/coach-development-funds/report', {
        params: {
          year: filters.year || undefined,
          month: filters.month || undefined,
          cabor_id: filters.caborId || undefined,
          cluster_id: filters.clusterId || undefined,
          sub_cluster_id: filters.subClusterId || undefined,
          cluster_type: filters.clusterType || undefined,
          sub_cluster_type: filters.subClusterType || undefined,
        },
      });
      return response.data;
    },
  });
}
