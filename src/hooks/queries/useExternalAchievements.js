import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const externalAchievementKeys = {
  all: ['externalAchievements'],
  athlete: (athleteId) => [...externalAchievementKeys.all, 'athlete', athleteId],
  portal: () => [...externalAchievementKeys.all, 'portal'],
  verifications: (filters) => [...externalAchievementKeys.all, 'verifications', filters],
  summary: () => [...externalAchievementKeys.all, 'summary'],
};

// athleteId null means the logged-in athlete's own portal collection.
export const externalAchievementsPath = (athleteId) => (
  athleteId ? `/api/athletes/${athleteId}/external-achievements` : '/api/portal/external-achievements'
);

export function getExternalAchievementError(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

export function useExternalAchievements(athleteId, { enabled = true } = {}) {
  return useQuery({
    queryKey: athleteId ? externalAchievementKeys.athlete(athleteId) : externalAchievementKeys.portal(),
    queryFn: async () => (await api.get(externalAchievementsPath(athleteId))).data?.data || [],
    enabled,
  });
}

// Every write can change the athlete list, the portal list, the queue and its badge.
function useAchievementMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // onSettled: a 409 means the cached status is stale and must be reloaded too.
    onSettled: () => queryClient.invalidateQueries({ queryKey: externalAchievementKeys.all }),
  });
}

export function useSaveExternalAchievement(athleteId) {
  return useAchievementMutation(async ({ id, data }) => {
    const base = externalAchievementsPath(athleteId);
    const response = id ? await api.put(`${base}/${id}`, data) : await api.post(base, data);
    return response.data;
  });
}

export function useDeleteExternalAchievement(athleteId) {
  return useAchievementMutation(async ({ id }) => {
    await api.delete(`${externalAchievementsPath(athleteId)}/${id}`);
  });
}

// action is 'submit' or 'withdraw'.
export function useExternalAchievementStatus(athleteId) {
  return useAchievementMutation(async ({ id, action }) => (
    (await api.post(`${externalAchievementsPath(athleteId)}/${id}/${action}`)).data
  ));
}

export function useUploadExternalAchievementFile(athleteId) {
  return useAchievementMutation(async ({ id, file }) => {
    const data = new FormData();
    data.append('file', file);
    const response = await api.post(`${externalAchievementsPath(athleteId)}/${id}/files`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  });
}

export function useDeleteExternalAchievementFile(athleteId) {
  return useAchievementMutation(async ({ id, fileId }) => (
    (await api.delete(`${externalAchievementsPath(athleteId)}/${id}/files/${fileId}`)).data
  ));
}

export function useExternalAchievementVerifications(filters) {
  return useQuery({
    queryKey: externalAchievementKeys.verifications(filters),
    queryFn: async () => (await api.get('/api/external-achievements/verifications', {
      params: {
        status: filters.status,
        level: filters.level || undefined,
        cabor_id: filters.caborId || undefined,
        search: filters.search || undefined,
        page: filters.page,
        per_page: filters.perPage,
      },
    })).data,
    staleTime: 0,
  });
}

export function useExternalAchievementSummary(enabled = true) {
  return useQuery({
    queryKey: externalAchievementKeys.summary(),
    queryFn: async () => (await api.get('/api/external-achievements/verifications/summary')).data,
    enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}

// action is 'approve', 'reject' or 'revoke'. submittedAt is the reviewed version and
// must be the raw API string: converting it through Date drops microseconds.
export function useDecideExternalAchievement() {
  return useAchievementMutation(async ({ id, action, reason, submittedAt }) => (
    (await api.post(`/api/external-achievements/${id}/${action}`, { reason, submitted_at: submittedAt })).data
  ));
}
