import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const accountEmailRecoveryKeys = {
  all: ['account-email-recovery'],
  lists: () => [...accountEmailRecoveryKeys.all, 'list'],
  list: (filters) => [...accountEmailRecoveryKeys.lists(), filters],
  details: () => [...accountEmailRecoveryKeys.all, 'detail'],
  detail: (id) => [...accountEmailRecoveryKeys.details(), String(id)],
  summary: () => [...accountEmailRecoveryKeys.all, 'summary'],
};

export function useAccountEmailRecoveries(filters, enabled = true) {
  return useQuery({
    queryKey: accountEmailRecoveryKeys.list(filters),
    queryFn: async () => {
      const response = await api.get('/api/account-email-recovery/admin/requests', {
        params: {
          page: filters.page,
          per_page: filters.perPage,
          status: filters.status || undefined,
          account_type: filters.accountType || undefined,
          search: filters.search || undefined,
        },
      });
      return response.data;
    },
    enabled,
  });
}

export function useAccountEmailRecovery(id, enabled = true) {
  return useQuery({
    queryKey: accountEmailRecoveryKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(`/api/account-email-recovery/admin/requests/${id}`);
      return response.data;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useAccountEmailRecoverySummary(enabled = true) {
  return useQuery({
    queryKey: accountEmailRecoveryKeys.summary(),
    queryFn: async () => {
      const response = await api.get('/api/account-email-recovery/admin/summary');
      return response.data;
    },
    enabled,
    refetchInterval: enabled ? 60_000 : false,
    refetchOnWindowFocus: enabled,
  });
}

function useRecoveryMutation(action) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.post(`/api/account-email-recovery/admin/requests/${id}/${action}`, payload);
      return response.data;
    },
    onSuccess: (result, variables) => {
      if (result.data) {
        queryClient.setQueryData(accountEmailRecoveryKeys.detail(variables.id), result.data);
      }
      queryClient.invalidateQueries({ queryKey: accountEmailRecoveryKeys.summary() });
      queryClient.invalidateQueries({ queryKey: accountEmailRecoveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountEmailRecoveryKeys.detail(variables.id) });
    },
  });
}

export function useApproveAccountEmailRecovery() {
  return useRecoveryMutation('approve');
}

export function useRejectAccountEmailRecovery() {
  return useRecoveryMutation('reject');
}

export function useResendAccountEmailRecovery() {
  return useRecoveryMutation('resend');
}