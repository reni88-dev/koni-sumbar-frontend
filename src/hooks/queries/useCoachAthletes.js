import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

// Query keys
export const coachAthleteKeys = {
  all: ['coach-athletes'],
  lists: () => [...coachAthleteKeys.all, 'list'],
  list: (filters) => [...coachAthleteKeys.lists(), filters],
};

// Fetch coach-athlete assignments with pagination
export function useCoachAthletes({ page = 1, search = '', perPage = 15, coach_id = '', athlete_id = '', cabor_id = '' } = {}) {
  return useQuery({
    queryKey: coachAthleteKeys.list({ page, search, perPage, coach_id, athlete_id, cabor_id }),
    queryFn: async () => {
      const response = await api.get('/api/coach-athletes', {
        params: { 
          page, 
          search: search || undefined, 
          per_page: perPage,
          coach_id: coach_id || undefined,
          athlete_id: athlete_id || undefined,
          cabor_id: cabor_id || undefined
        }
      });
      return response.data;
    },
  });
}

// Assign coach to athlete
export function useAssignCoachAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/api/coach-athletes', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachAthleteKeys.all });
    },
  });
}

// Update coach-athlete assignment
export function useUpdateCoachAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/api/coach-athletes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachAthleteKeys.all });
    },
  });
}

// Remove coach-athlete assignment
export function useRemoveCoachAthlete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/api/coach-athletes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coachAthleteKeys.all });
    },
  });
}
