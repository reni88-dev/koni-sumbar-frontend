import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const regionKeys = {
  all: ['regions'],
  lists: () => [...regionKeys.all, 'list'],
  list: (filters) => [...regionKeys.lists(), filters],
  allDropdown: () => [...regionKeys.all, 'dropdown'],
};

// Fetch regions with pagination
export function useRegions({ page = 1, search = '', perPage = 15 } = {}) {
  return useQuery({
    queryKey: regionKeys.list({ page, search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/regions', {
        params: { page, search: search || undefined, per_page: perPage }
      });
      return response.data;
    },
  });
}

// Fetch all regions for dropdown
export function useRegionsAll() {
  return useQuery({
    queryKey: regionKeys.allDropdown(),
    queryFn: async () => {
      const response = await api.get('/api/regions/all');
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Create region mutation
export function useCreateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/master/regions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.all });
    },
  });
}

// Update region mutation
export function useUpdateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/master/regions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.all });
    },
  });
}

// Delete region mutation
export function useDeleteRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/regions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: regionKeys.all });
    },
  });
}
