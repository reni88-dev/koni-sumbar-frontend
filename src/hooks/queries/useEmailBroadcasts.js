import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const emailBroadcastKeys = {
  all: ['email-broadcasts'],
  lists: () => [...emailBroadcastKeys.all, 'list'],
  list: (filters) => [...emailBroadcastKeys.lists(), filters],
  details: () => [...emailBroadcastKeys.all, 'detail'],
  detail: (id, targetPage, targetPerPage) => [...emailBroadcastKeys.details(), String(id), { targetPage, targetPerPage }],
  roles: () => [...emailBroadcastKeys.all, 'roles'],
  users: (filters) => [...emailBroadcastKeys.all, 'users', filters],
};

export function useEmailBroadcastHistory(filters, enabled = true) {
  return useQuery({
    queryKey: emailBroadcastKeys.list(filters),
    queryFn: async () => {
      const response = await api.get('/api/admin/email-broadcasts', {
        params: {
          page: filters.page,
          per_page: filters.perPage,
          search: filters.search || undefined,
          target_type: filters.targetType || undefined,
        },
      });
      return response.data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useEmailBroadcastDetail(id, targetPage = 1, targetPerPage = 20, enabled = true) {
  return useQuery({
    queryKey: emailBroadcastKeys.detail(id, targetPage, targetPerPage),
    queryFn: async () => {
      const response = await api.get(`/api/admin/email-broadcasts/${id}`, {
        params: { target_page: targetPage, target_per_page: targetPerPage },
      });
      return response.data;
    },
    enabled: enabled && Boolean(id),
    placeholderData: keepPreviousData,
  });
}

export function useEmailBroadcastRoles(enabled = true) {
  return useQuery({
    queryKey: emailBroadcastKeys.roles(),
    queryFn: async () => {
      const response = await api.get('/api/admin/email-broadcasts/roles');
      return response.data.data || [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmailBroadcastUsers(filters, enabled = true) {
  return useQuery({
    queryKey: emailBroadcastKeys.users(filters),
    queryFn: async () => {
      const response = await api.get('/api/admin/email-broadcasts/users', {
        params: {
          page: filters.page,
          per_page: filters.perPage,
          search: filters.search || undefined,
          role_id: filters.roleId || undefined,
        },
      });
      return response.data;
    },
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function usePreviewEmailBroadcast() {
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/api/admin/email-broadcasts/preview', payload);
      return response.data.data;
    },
  });
}

export function useSendEmailBroadcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/api/admin/email-broadcasts', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailBroadcastKeys.lists() });
      queryClient.invalidateQueries({ queryKey: emailBroadcastKeys.details() });
      queryClient.invalidateQueries({ queryKey: emailBroadcastKeys.roles() });
    },
  });
}