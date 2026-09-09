import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { athleteKeys } from './useAthletes';

export const athleteTransferKeys = {
  all: ['athlete-transfers'],
  lists: () => ['athlete-transfers', 'list'],
  list: (filters) => ['athlete-transfers', 'list', filters],
  detail: (id) => ['athlete-transfers', 'detail', String(id)],
  summary: () => ['athlete-transfers', 'summary'],
  destinations: (athleteId) => ['athlete-transfers', 'destinations', String(athleteId)],
  athleteHistory: (athleteId) => ['athlete-transfers', 'athlete-history', String(athleteId)],
};

function invalidateTransfers(queryClient, athleteId, id) {
  queryClient.invalidateQueries({ queryKey: athleteTransferKeys.lists() });
  queryClient.invalidateQueries({ queryKey: athleteTransferKeys.summary() });
  if (id) queryClient.invalidateQueries({ queryKey: athleteTransferKeys.detail(id) });
  if (athleteId) {
    queryClient.invalidateQueries({ queryKey: athleteTransferKeys.athleteHistory(athleteId) });
    queryClient.invalidateQueries({ queryKey: athleteKeys.detail(athleteId) });
  }
  queryClient.invalidateQueries({ queryKey: athleteKeys.lists() });
}

export function useAthleteTransfers(filters, enabled = true) {
  return useQuery({
    queryKey: athleteTransferKeys.list(filters),
    queryFn: async () => (await api.get('/api/athlete-transfers', { params: filters })).data,
    enabled,
  });
}

export function useAthleteTransferSummary(enabled = true) {
  return useQuery({
    queryKey: athleteTransferKeys.summary(),
    queryFn: async () => (await api.get('/api/athlete-transfers/summary')).data,
    enabled,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: enabled,
  });
}

export function useAthleteTransfer(id, enabled = true) {
  return useQuery({
    queryKey: athleteTransferKeys.detail(id),
    queryFn: async () => (await api.get(`/api/athlete-transfers/${id}`)).data,
    enabled: enabled && Boolean(id),
  });
}

export function useAthleteTransferDestinations(athleteId, enabled = true) {
  return useQuery({
    queryKey: athleteTransferKeys.destinations(athleteId),
    queryFn: async () => (await api.get('/api/athlete-transfers/destinations', { params: { athlete_id: athleteId } })).data.data || [],
    enabled: enabled && Boolean(athleteId),
  });
}

export function useAthleteTransferHistory(athleteId, enabled = true) {
  return useQuery({
    queryKey: athleteTransferKeys.athleteHistory(athleteId),
    queryFn: async () => (await api.get(`/api/athletes/${athleteId}/transfers`)).data.data || [],
    enabled: enabled && Boolean(athleteId),
  });
}

export function useCreateAthleteTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData) => (await api.post('/api/athlete-transfers', formData)).data,
    onSuccess: (item) => invalidateTransfers(queryClient, item.athlete_id, item.id),
  });
}

function useReviewMutation(path) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, athleteId, ...payload }) => ({
      item: (await api.post(`/api/athlete-transfers/${id}/${path}`, payload)).data,
      athleteId,
      id,
    }),
    onSuccess: ({ athleteId, id }) => invalidateTransfers(queryClient, athleteId, id),
  });
}

export function useDestinationReviewAthleteTransfer() { return useReviewMutation('destination-review'); }
export function useKoniReviewAthleteTransfer() { return useReviewMutation('koni-review'); }
export function useCancelAthleteTransfer() { return useReviewMutation('cancel'); }

export async function fetchAthleteTransferDocument(id) {
  return (await api.get(`/api/athlete-transfers/${id}/document`, { responseType: 'blob' })).data;
}
