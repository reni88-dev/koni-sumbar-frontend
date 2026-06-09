import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const federationKeys = {
  all: ['federations'],
  lists: () => [...federationKeys.all, 'list'],
  list: (filters) => [...federationKeys.lists(), filters],
  allDropdown: () => [...federationKeys.all, 'dropdown'],
};

export function useFederations({ page = 1, search = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: federationKeys.list({ page, search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/federations', {
        params: { page, search: search || undefined, per_page: perPage }
      });
      return response.data;
    },
  });
}

export function useFederationsAll() {
  return useQuery({
    queryKey: federationKeys.allDropdown(),
    queryFn: async () => {
      const response = await api.get('/api/federations/all');
      return Array.isArray(response.data) ? response.data.filter(f => f && f.id) : [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateFederation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/master/federations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: federationKeys.all });
    },
  });
}

export function useUpdateFederation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/master/federations/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: federationKeys.all });
    },
  });
}

export function useDeleteFederation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/federations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: federationKeys.all });
    },
  });
}
