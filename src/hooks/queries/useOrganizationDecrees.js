import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const organizationDecreeKeys = {
  all: ['organizationDecrees'],
  list: (organizationId) => [...organizationDecreeKeys.all, 'list', organizationId],
  detail: (organizationId, decreeId) => [...organizationDecreeKeys.all, 'detail', organizationId, decreeId],
  candidates: (query) => [...organizationDecreeKeys.all, 'candidates', query],
};

const decreesPath = (organizationId) => `/api/master/organizations/${organizationId}/decrees`;

export function useOrganizationDecrees(organizationId) {
  return useQuery({
    queryKey: organizationDecreeKeys.list(organizationId),
    queryFn: async () => {
      const response = await api.get(decreesPath(organizationId));
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: Boolean(organizationId),
  });
}

export function useOrganizationDecree(organizationId, decreeId) {
  return useQuery({
    queryKey: organizationDecreeKeys.detail(organizationId, decreeId),
    queryFn: async () => {
      const response = await api.get(`${decreesPath(organizationId)}/${decreeId}`);
      return response.data;
    },
    enabled: Boolean(organizationId && decreeId),
  });
}

// Every SK mutation changes the list (status, member count, file flag) and the SK detail.
function useDecreeMutation(organizationId, mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationDecreeKeys.list(organizationId) });
      if (variables?.decreeId) {
        queryClient.invalidateQueries({ queryKey: organizationDecreeKeys.detail(organizationId, variables.decreeId) });
      }
    },
  });
}

export function useSaveOrganizationDecree(organizationId) {
  return useDecreeMutation(organizationId, async ({ decreeId, data }) => {
    const response = decreeId
      ? await api.put(`${decreesPath(organizationId)}/${decreeId}`, data)
      : await api.post(decreesPath(organizationId), data);
    return response.data;
  });
}

export function useDeleteOrganizationDecree(organizationId) {
  return useDecreeMutation(organizationId, async ({ decreeId }) => {
    await api.delete(`${decreesPath(organizationId)}/${decreeId}`);
  });
}

export function useUploadOrganizationDecreeFile(organizationId) {
  return useDecreeMutation(organizationId, async ({ decreeId, file }) => {
    const data = new FormData();
    data.append('file', file);
    const response = await api.post(`${decreesPath(organizationId)}/${decreeId}/file`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  });
}

export function useDeleteOrganizationDecreeFile(organizationId) {
  return useDecreeMutation(organizationId, async ({ decreeId }) => {
    const response = await api.delete(`${decreesPath(organizationId)}/${decreeId}/file`);
    return response.data;
  });
}

export function useAddDecreeMember(organizationId) {
  return useDecreeMutation(organizationId, async ({ decreeId, data }) => {
    const response = await api.post(`${decreesPath(organizationId)}/${decreeId}/members`, data);
    return response.data;
  });
}

export function useUpdateDecreeMember(organizationId) {
  return useDecreeMutation(organizationId, async ({ decreeId, memberId, data }) => {
    await api.put(`${decreesPath(organizationId)}/${decreeId}/members/${memberId}`, data);
  });
}

export function useDeleteDecreeMember(organizationId) {
  return useDecreeMutation(organizationId, async ({ decreeId, memberId }) => {
    await api.delete(`${decreesPath(organizationId)}/${decreeId}/members/${memberId}`);
  });
}

export const BOARD_CANDIDATE_MIN_QUERY = 3;

export function useBoardCandidates(query) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: organizationDecreeKeys.candidates(trimmed),
    queryFn: async ({ signal }) => {
      const response = await api.get('/api/master/organization-board/candidates', { params: { q: trimmed }, signal });
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: trimmed.length >= BOARD_CANDIDATE_MIN_QUERY,
    staleTime: 30 * 1000,
  });
}

// NIK lookups are deliberately not cached: a NIK must never become a query key.
export async function lookupBoardNIK(nik, signal) {
  const response = await api.post('/api/master/organization-board/lookup-nik', { nik }, { signal });
  return response.data;
}

export async function openOrganizationDecreeFile(organizationId, decreeId) {
  const response = await api.get(`${decreesPath(organizationId)}/${decreeId}/file`, { responseType: 'blob' });
  const objectUrl = window.URL.createObjectURL(response.data);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
}

export function getDecreeErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}
