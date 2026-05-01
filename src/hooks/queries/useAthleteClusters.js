import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { athleteKeys } from './useAthletes';

export const athleteClusterKeys = {
  all: ['athleteClusters'],
  histories: (athleteId) => [...athleteClusterKeys.all, athleteId, 'histories'],
  active: (athleteId) => [...athleteClusterKeys.all, athleteId, 'active'],
  funds: (athleteId, filters) => [...athleteClusterKeys.all, athleteId, 'funds', filters],
  report: (filters) => [...athleteClusterKeys.all, 'funds-report', filters],
};

export function useAthleteClusterHistories(athleteId) {
  return useQuery({
    queryKey: athleteClusterKeys.histories(athleteId),
    queryFn: async () => {
      const response = await api.get(`/api/athletes/${athleteId}/clusters`);
      return response.data;
    },
    enabled: !!athleteId,
  });
}

export function useActiveAthleteCluster(athleteId) {
  return useQuery({
    queryKey: athleteClusterKeys.active(athleteId),
    queryFn: async () => {
      const response = await api.get(`/api/athletes/${athleteId}/clusters/active`);
      return response.data;
    },
    enabled: !!athleteId,
  });
}

export function useMoveAthleteCluster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ athleteId, data }) => {
      const response = await api.post(`/api/athletes/${athleteId}/clusters`, data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: athleteClusterKeys.histories(variables.athleteId) });
      queryClient.invalidateQueries({ queryKey: athleteClusterKeys.active(variables.athleteId) });
      queryClient.invalidateQueries({ queryKey: athleteKeys.all });
    },
  });
}

export function useAthleteDevelopmentFunds(athleteId, filters = {}) {
  return useQuery({
    queryKey: athleteClusterKeys.funds(athleteId, filters),
    queryFn: async () => {
      const response = await api.get(`/api/athletes/${athleteId}/development-funds`, {
        params: {
          page: filters.page || 1,
          per_page: filters.perPage || 15,
          year: filters.year || undefined,
          month: filters.month || undefined,
        },
      });
      return response.data;
    },
    enabled: !!athleteId,
  });
}

export function useCreateAthleteDevelopmentFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ athleteId, data }) => {
      const response = await api.post(`/api/athletes/${athleteId}/development-funds`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...athleteClusterKeys.all, variables.athleteId, 'funds'] });
      queryClient.invalidateQueries({ queryKey: athleteClusterKeys.report({}) });
    },
  });
}

export function useUpdateAthleteDevelopmentFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/development-funds/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: athleteClusterKeys.all });
    },
  });
}

export function useDeleteAthleteDevelopmentFund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/development-funds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: athleteClusterKeys.all });
    },
  });
}

export function useDevelopmentFundsReport(filters = {}) {
  return useQuery({
    queryKey: athleteClusterKeys.report(filters),
    queryFn: async () => {
      const response = await api.get('/api/development-funds/report', {
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
