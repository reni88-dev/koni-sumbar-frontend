import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const venueKeys = {
  all: ['venues'],
  lists: () => [...venueKeys.all, 'list'],
  list: (filters) => [...venueKeys.lists(), filters],
  allDropdown: () => [...venueKeys.all, 'dropdown'],
};

// Fetch venues with pagination
export function useVenues({ page = 1, search = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: venueKeys.list({ page, search, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/master/venues', {
        params: { page, search: search || undefined, per_page: perPage }
      });
      return response.data;
    },
  });
}

// Fetch all venues for dropdown
export function useVenuesAll() {
  return useQuery({
    queryKey: venueKeys.allDropdown(),
    queryFn: async () => {
      const response = await api.get('/api/venues/all');
      return Array.isArray(response.data) ? response.data.filter(v => v && v.id) : [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Create venue mutation (FormData for photo upload)
export function useCreateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/api/master/venues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
  });
}

// Update venue mutation (FormData for photo upload)
export function useUpdateVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }) => {
      const response = await api.put(`/api/master/venues/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
  });
}

// Delete venue mutation
export function useDeleteVenue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/venues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: venueKeys.all });
    },
  });
}
