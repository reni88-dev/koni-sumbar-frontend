import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { coachKeys } from './useCoaches';

export const coachTransferKeys = {
  all: ['coach-transfers'],
  lists: () => ['coach-transfers', 'list'],
  list: (filters) => ['coach-transfers', 'list', filters],
  detail: (id) => ['coach-transfers', 'detail', String(id)],
  summary: () => ['coach-transfers', 'summary'],
  destinations: (coachId) => ['coach-transfers', 'destinations', String(coachId)],
  coachHistory: (coachId) => ['coach-transfers', 'coach-history', String(coachId)],
};

function invalidateTransfers(queryClient, coachId, id) {
  queryClient.invalidateQueries({ queryKey: coachTransferKeys.lists() });
  queryClient.invalidateQueries({ queryKey: coachTransferKeys.summary() });
  if (id) queryClient.invalidateQueries({ queryKey: coachTransferKeys.detail(id) });
  if (coachId) {
    queryClient.invalidateQueries({ queryKey: coachTransferKeys.coachHistory(coachId) });
    queryClient.invalidateQueries({ queryKey: coachKeys.detail(coachId) });
  }
  queryClient.invalidateQueries({ queryKey: coachKeys.lists() });
}

export function useCoachTransfers(filters, enabled = true) {
  return useQuery({
    queryKey: coachTransferKeys.list(filters),
    queryFn: async () => (await api.get('/api/coach-transfers', { params: filters })).data,
    enabled,
  });
}

export function useCoachTransferSummary(enabled = true) {
  return useQuery({
    queryKey: coachTransferKeys.summary(),
    queryFn: async () => (await api.get('/api/coach-transfers/summary')).data,
    enabled,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: enabled,
  });
}

export function useCoachTransfer(id, enabled = true) {
  return useQuery({
    queryKey: coachTransferKeys.detail(id),
    queryFn: async () => (await api.get(`/api/coach-transfers/${id}`)).data,
    enabled: enabled && Boolean(id),
  });
}

export function useCoachTransferDestinations(coachId, enabled = true) {
  return useQuery({
    queryKey: coachTransferKeys.destinations(coachId),
    queryFn: async () => (await api.get('/api/coach-transfers/destinations', { params: { coach_id: coachId } })).data.data || [],
    enabled: enabled && Boolean(coachId),
  });
}

export function useCoachTransferHistory(coachId, enabled = true) {
  return useQuery({
    queryKey: coachTransferKeys.coachHistory(coachId),
    queryFn: async () => (await api.get(`/api/coaches/${coachId}/transfers`)).data.data || [],
    enabled: enabled && Boolean(coachId),
  });
}

export function useCreateCoachTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => (await api.post('/api/coach-transfers', formData)).data,
    onSuccess: (item) => invalidateTransfers(queryClient, item.coach_id, item.id),
  });
}

function useReviewMutation(path) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, coachId, ...payload }) => ({
      item: (await api.post(`/api/coach-transfers/${id}/${path}`, payload)).data,
      coachId,
      id,
    }),
    onSuccess: ({ coachId, id }) => invalidateTransfers(queryClient, coachId, id),
  });
}

export function useDestinationReviewCoachTransfer() { return useReviewMutation('destination-review'); }
export function useKoniReviewCoachTransfer() { return useReviewMutation('koni-review'); }
export function useCancelCoachTransfer() { return useReviewMutation('cancel'); }

export async function fetchCoachTransferDocument(id) {
  return (await api.get(`/api/coach-transfers/${id}/document`, { responseType: 'blob' })).data;
}
