import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const athleteKeys = {
  all: ['athletes'],
  lists: () => [...athleteKeys.all, 'list'],
  list: (filters) => [...athleteKeys.lists(), filters],
  details: () => [...athleteKeys.all, 'detail'],
  detail: (id) => [...athleteKeys.details(), id],
};

// Fetch athletes with pagination and filters
export function useAthletes({ page = 1, search = '', caborId = '', gender = '', organizationId = '', perPage = 10 } = {}) {
  return useQuery({
    queryKey: athleteKeys.list({ page, search, caborId, gender, organizationId, perPage }),
    queryFn: async () => {
      const response = await api.get('/api/athletes', {
        params: { 
          page, 
          search: search || undefined, 
          cabor_id: caborId || undefined, 
          gender: gender || undefined, 
          organization_id: organizationId || undefined,
          per_page: perPage 
        }
      });
      return response.data;
    },
  });
}

// Fetch single athlete
export function useAthlete(id) {
  return useQuery({
    queryKey: athleteKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/athletes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

// Delete athlete mutation
export function useDeleteAthlete() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/athletes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: athleteKeys.all });
    },
  });
}
