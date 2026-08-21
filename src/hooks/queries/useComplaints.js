import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const complaintKeys = {
  all: ['complaints'],
  lists: () => [...complaintKeys.all, 'list'],
  list: (filters) => [...complaintKeys.lists(), filters],
  details: () => [...complaintKeys.all, 'detail'],
  detail: (id) => [...complaintKeys.details(), String(id)],
  summary: () => [...complaintKeys.all, 'summary'],
};

export function useComplaints(filters) {
  return useQuery({
    queryKey: complaintKeys.list(filters),
    queryFn: async () => {
      const response = await api.get('/api/complaints', {
        params: {
          page: filters.page,
          per_page: filters.perPage,
          search: filters.search || undefined,
          status: filters.status || undefined,
          category: filters.category || undefined,
          impact: filters.impact || undefined,
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo || undefined,
        },
      });
      return response.data;
    },
  });
}

export function useComplaint(id) {
  return useQuery({
    queryKey: complaintKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/complaints/${id}`);
      return response.data;
    },
    enabled: Boolean(id),
  });
}

export function useComplaintSummary(enabled) {
  return useQuery({
    queryKey: complaintKeys.summary(),
    queryFn: async () => {
      const response = await api.get('/api/complaints/summary');
      return response.data;
    },
    enabled,
    refetchInterval: enabled ? 60_000 : false,
    refetchOnWindowFocus: enabled,
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/api/complaints', formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.details() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.summary() });
    },
  });
}

export function useReviewComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/api/complaints/${id}/review`, payload);
      return response.data;
    },
    onSuccess: (result, variables) => {
      queryClient.setQueryData(complaintKeys.detail(variables.id), result.data);
      queryClient.invalidateQueries({ queryKey: complaintKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complaintKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complaintKeys.summary() });
    },
  });
}
