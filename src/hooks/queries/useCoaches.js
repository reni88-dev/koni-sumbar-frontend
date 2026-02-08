import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const coachKeys = {
  all: ['coaches'],
  lists: () => [...coachKeys.all, 'list'],
  list: (filters) => [...coachKeys.lists(), filters],
  details: () => [...coachKeys.all, 'detail'],
  detail: (id) => [...coachKeys.details(), id],
};

// Fetch coaches with pagination and filters
export function useCoaches({ page = 1, search = '', caborId = '', isActive = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: coachKeys.list({ page, search, caborId, isActive, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/coaches', {
        params: { 
          page, 
          search: search || undefined, 
          cabor_id: caborId || undefined, 
          is_active: isActive !== '' ? isActive : undefined, 
          per_page: perPage 
        }
      });
      return response.data;
    },
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
