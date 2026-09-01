import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

export const announcementKeys = {
  all: ['announcements'],
  pending: () => [...announcementKeys.all, 'pending'],
  inboxes: () => [...announcementKeys.all, 'inbox'],
  inbox: (page, perPage) => [...announcementKeys.inboxes(), { page, perPage }],
  adminLists: () => [...announcementKeys.all, 'admin-list'],
  adminList: (filters) => [...announcementKeys.adminLists(), filters],
  adminDetails: () => [...announcementKeys.all, 'admin-detail'],
  adminDetail: (id) => [...announcementKeys.adminDetails(), String(id)],
  roles: () => [...announcementKeys.all, 'roles'],
  reports: () => [...announcementKeys.all, 'reports'],
  report: (id, version, page, perPage) => [...announcementKeys.reports(), String(id), { version, page, perPage }],
};

function invalidateRecipientQueries(queryClient) {
  queryClient.invalidateQueries({ queryKey: announcementKeys.pending() });
  queryClient.invalidateQueries({ queryKey: announcementKeys.inboxes() });
}

function invalidateAdminQueries(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: announcementKeys.adminLists() });
  queryClient.invalidateQueries({ queryKey: announcementKeys.adminDetails() });
  queryClient.invalidateQueries({ queryKey: announcementKeys.reports() });
  if (id) {
    queryClient.invalidateQueries({ queryKey: announcementKeys.adminDetail(id) });
  }
  invalidateRecipientQueries(queryClient);
}

export function usePendingAnnouncements(enabled) {
  return useQuery({
    queryKey: announcementKeys.pending(),
    queryFn: async () => {
      const response = await api.get('/api/announcements/pending');
      return response.data.data || [];
    },
    enabled,
    staleTime: 0,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: enabled,
  });
}

export function useAnnouncementInbox({ enabled, page = 1, perPage = 20 }) {
  return useQuery({
    queryKey: announcementKeys.inbox(page, perPage),
    queryFn: async () => {
      const response = await api.get('/api/announcements/inbox', {
        params: { page, per_page: perPage },
      });
      return response.data;
    },
    enabled,
    staleTime: 0,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: enabled,
  });
}

function useReceiptMutation(action) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, deliveryVersion }) => {
      const response = await api.post(`/api/announcements/${id}/${action}`, {
        delivery_version: deliveryVersion,
      });
      return response.data.data;
    },
    onSuccess: () => invalidateRecipientQueries(queryClient),
  });
}

export function useMarkAnnouncementSeen() {
  return useReceiptMutation('seen');
}

export function useAcknowledgeAnnouncement() {
  return useReceiptMutation('acknowledge');
}

export function useAdminAnnouncements(filters, enabled = true) {
  return useQuery({
    queryKey: announcementKeys.adminList(filters),
    queryFn: async () => {
      const response = await api.get('/api/admin/announcements', {
        params: {
          page: filters.page,
          per_page: filters.perPage,
          search: filters.search || undefined,
          lifecycle: filters.lifecycle || undefined,
          severity: filters.severity || undefined,
          role_id: filters.roleId || undefined,
        },
      });
      return response.data;
    },
    enabled,
  });
}

export function useAdminAnnouncement(id, enabled = true) {
  return useQuery({
    queryKey: announcementKeys.adminDetail(id),
    queryFn: async () => {
      const response = await api.get(`/api/admin/announcements/${id}`);
      return response.data.data;
    },
    enabled: enabled && Boolean(id),
  });
}

export function useAnnouncementRoles(enabled = true) {
  return useQuery({
    queryKey: announcementKeys.roles(),
    queryFn: async () => {
      const response = await api.get('/api/admin/announcements/roles');
      return response.data.data || [];
    },
    enabled,
    staleTime: 10 * 60 * 1000,
  });
}

function useAdminMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result, variables) => {
      const id = result?.data?.id || variables?.id;
      invalidateAdminQueries(queryClient, id);
    },
  });
}

export function useCreateAnnouncement() {
  return useAdminMutation(async (payload) => {
    const response = await api.post('/api/admin/announcements', payload);
    return response.data;
  });
}

export function useUpdateAnnouncement() {
  return useAdminMutation(async ({ id, payload }) => {
    const response = await api.put(`/api/admin/announcements/${id}`, payload);
    return response.data;
  });
}

export function usePublishAnnouncement() {
  return useAdminMutation(async ({ id }) => {
    const response = await api.post(`/api/admin/announcements/${id}/publish`);
    return response.data;
  });
}

export function useArchiveAnnouncement() {
  return useAdminMutation(async ({ id }) => {
    const response = await api.post(`/api/admin/announcements/${id}/archive`);
    return response.data;
  });
}

export function useDeleteAnnouncement() {
  return useAdminMutation(async ({ id }) => {
    const response = await api.delete(`/api/admin/announcements/${id}`);
    return response.data;
  });
}

export function useAnnouncementRecipients({ id, version, page = 1, perPage = 20, enabled = true }) {
  return useQuery({
    queryKey: announcementKeys.report(id, version, page, perPage),
    queryFn: async () => {
      const response = await api.get(`/api/admin/announcements/${id}/recipients`, {
        params: {
          delivery_version: version || undefined,
          page,
          per_page: perPage,
        },
      });
      return response.data.data;
    },
    enabled: enabled && Boolean(id),
  });
}