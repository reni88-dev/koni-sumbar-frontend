import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const caborKeys = {
  all: ['cabors'],
  lists: () => [...caborKeys.all, 'list'],
  list: (filters) => [...caborKeys.lists(), filters],
  allDropdown: (filters) => [...caborKeys.all, 'dropdown', filters],
};

// Fetch cabors with pagination
export function useCabors({ page = 1, search = '', perPage = 10, level = '', parentId = '', tree = false } = {}) {
  return useQuery({
    queryKey: caborKeys.list({ page, search, perPage, level, parentId, tree }),
    queryFn: async () => {
      const response = await api.get('/api/master/cabors', {
        params: { page, search: search || undefined, per_page: perPage, level: level || undefined, parent_id: parentId || undefined, tree: tree || undefined }
      });
      return response.data;
    },
  });
}

// Fetch all cabors for dropdown
export function useCaborsAll({ level = 'discipline', parentId = '', tree = false } = {}) {
  return useQuery({
    queryKey: caborKeys.allDropdown({ level, parentId, tree }),
    queryFn: async () => {
      const response = await api.get('/api/cabors/all', {
        params: { level: level || undefined, parent_id: parentId || undefined, tree: tree || undefined }
      });
      return Array.isArray(response.data)
        ? response.data.filter(c => c && c.id).map(c => ({ ...c, raw_name: c.name, name: c.display_name || c.name }))
        : [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - dropdown data doesn't change often
  });
}

export function useCaborSports() {
  return useCaborsAll({ level: 'sport' });
}

// Create cabor mutation
export function useCreateCabor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/api/master/cabors', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caborKeys.all });
    },
  });
}

// Update cabor mutation
export function useUpdateCabor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, formData }) => {
      formData.append('_method', 'PUT');
      const response = await api.post(`/api/master/cabors/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caborKeys.all });
    },
  });
}

// Delete cabor mutation
export function useDeleteCabor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/master/cabors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: caborKeys.all });
    },
  });
}
